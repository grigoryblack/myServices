"use client"

import { create } from 'zustand'
import { DatabaseService } from '@/lib/database-service'
import { BudgetCategory, Budget, Transaction, BudgetSummary, SavingsSummary } from '@/entities'

/**
 * Database-backed Finance management store
 * Replaces localStorage with PostgreSQL database operations
 */
interface FinanceState {
  budgets: Record<string, Budget>
  transactions: Transaction[]
  currentMonth: string
  isInitialized: boolean
  isInitializing: boolean
  savingsGoal: number
  savingsGoalDescription: string
  
  // Budget actions
  createBudget: (name: string, month: string, totalIncome?: number) => Promise<void>
  redistributeIncome: (month: string) => Promise<void>
  getBudgetSummary: (month?: string) => BudgetSummary
  getSavingsSummary: () => SavingsSummary
  updateCategory: (month: string, categoryId: string, updates: Partial<BudgetCategory>) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'month'>) => Promise<void>
  updateTransaction: (transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>
  removeTransaction: (transactionId: string) => Promise<void>
  addCategory: (month: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>) => Promise<void>
  removeCategory: (month: string, categoryId: string) => Promise<void>
  getCategoryActualAmount: (categoryId: string, month?: string) => number
  getTransactionsByCategory: (categoryId: string, month?: string) => Transaction[]
  getAvailableMonths: () => string[]
  getCurrentBudget: () => Budget | null
  setCurrentMonth: (month: string) => Promise<void>
  setSavingsGoal: (goal: number, description: string) => Promise<void>
  setSavingsAmount: (amount: number, month?: string) => Promise<void>
  updateBudgetIncome: (month: string, totalIncome: number) => Promise<void>
  initializeWithSeedData: () => Promise<void>
  clearAllData: () => Promise<void>
  loadAllData: () => Promise<void>
  copyPermanentCategoryToFutureMonths: (category: BudgetCategory, fromMonth: string) => Promise<void>
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  budgets: {},
  currentMonth: new Date().toISOString().slice(0, 7),
  transactions: [],
  isInitialized: false,
  isInitializing: false,
  savingsGoal: 100000,
  savingsGoalDescription: 'Цель накоплений',

  loadAllData: async () => {
    try {
      set({ isInitializing: true })
      
      // Load user settings
      const settings = await DatabaseService.getUserSettings()
      
      // Load all budgets
      const allBudgets = await DatabaseService.getAllBudgets()
      const budgetsRecord: Record<string, Budget> = {}
      const allTransactions: Transaction[] = []
      
      allBudgets.forEach(budget => {
        budgetsRecord[budget.month] = budget
        budget.categories.forEach(category => {
          // Collect all transactions from categories
          const categoryTransactions = get().getTransactionsByCategory(category.id, budget.month)
          allTransactions.push(...categoryTransactions)
        })
      })
      
      set({
        budgets: budgetsRecord,
        currentMonth: settings.currentMonth,
        savingsGoal: settings.savingsGoal,
        savingsGoalDescription: settings.savingsGoalDescription,
        transactions: allTransactions,
        isInitialized: true,
        isInitializing: false,
      })
    } catch (error) {
      console.error('Failed to load data from database:', error)
      set({ isInitializing: false })
    }
  },

  createBudget: async (name: string, month: string, totalIncome = 0) => {
    try {
      const newBudget = await DatabaseService.createBudget(name, month, totalIncome)
      
      set((state) => ({
        budgets: { ...state.budgets, [month]: newBudget },
        currentMonth: month
      }))
    } catch (error) {
      console.error('Failed to create budget:', error)
    }
  },

  setCurrentMonth: async (month: string) => {
    try {
      await DatabaseService.updateUserSettings({ currentMonth: month })
      set({ currentMonth: month })
    } catch (error) {
      console.error('Failed to update current month:', error)
    }
  },

  getCurrentBudget: () => {
    const { budgets, currentMonth } = get()
    return budgets[currentMonth] || null
  },

  updateBudgetIncome: async (month: string, totalIncome: number) => {
    try {
      await DatabaseService.updateBudgetIncome(month, totalIncome)
      
      set((state) => {
        const budget = state.budgets[month]
        if (!budget) return state
        
        const updatedBudget = { ...budget, totalIncome, updatedAt: new Date() }
        return {
          budgets: { ...state.budgets, [month]: updatedBudget }
        }
      })

      // Trigger income redistribution
      await get().redistributeIncome(month)
    } catch (error) {
      console.error('Failed to update budget income:', error)
    }
  },

  redistributeIncome: async (month: string) => {
    const { budgets } = get()
    const budget = budgets[month]
    if (!budget || budget.totalIncome === 0) return

    const fixedExpenses = budget.categories.filter(cat => 
      cat.type === 'expense' && cat.categoryType === 'fixed'
    )
    const variableExpenses = budget.categories.filter(cat => 
      cat.type === 'expense' && cat.categoryType === 'variable'
    )

    const totalFixedExpenses = fixedExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
    const availableForVariable = Math.max(0, budget.totalIncome - totalFixedExpenses)
    const totalProportions = variableExpenses.reduce((sum, cat) => sum + (cat.proportion || 0), 0)
    
    if (totalProportions === 0) return
    
    // Update variable categories in database
    for (const category of variableExpenses) {
      if (category.proportion) {
        const newAmount = (availableForVariable * category.proportion) / totalProportions
        await DatabaseService.updateCategory(category.id, { plannedAmount: Math.max(0, newAmount) })
      }
    }

    // Reload budget data
    await get().loadAllData()
  },

  updateCategory: async (month: string, categoryId: string, updates: Partial<BudgetCategory>) => {
    try {
      await DatabaseService.updateCategory(categoryId, updates)
      
      // If we updated a fixed category's planned amount, recalculate variable categories
      const { budgets } = get()
      const budget = budgets[month]
      if (budget) {
        const category = budget.categories.find(cat => cat.id === categoryId)
        if (category && category.categoryType === 'fixed' && updates.plannedAmount !== undefined) {
          await get().redistributeIncome(month)
        }
      }
      
      await get().loadAllData()
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  },

  addCategory: async (month: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>) => {
    try {
      const { budgets } = get()
      const budget = budgets[month]
      if (!budget) return

      await DatabaseService.addCategory(budget.id, categoryData)

      // If it's a variable category, redistribute income
      if (categoryData.categoryType === 'variable') {
        await get().redistributeIncome(month)
      }
      
      await get().loadAllData()
    } catch (error) {
      console.error('Failed to add category:', error)
    }
  },

  removeCategory: async (month: string, categoryId: string) => {
    try {
      const { budgets } = get()
      const budget = budgets[month]
      if (!budget) return

      const categoryToRemove = budget.categories.find(cat => cat.id === categoryId)
      if (!categoryToRemove) return

      await DatabaseService.removeCategory(categoryId)

      // If it was a variable category, redistribute income
      if (categoryToRemove.categoryType === 'variable') {
        await get().redistributeIncome(month)
      }
      
      await get().loadAllData()
    } catch (error) {
      console.error('Failed to remove category:', error)
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'month'>) => {
    try {
      const { currentMonth } = get()
      const newTransaction = await DatabaseService.addTransaction({
        ...transaction,
        month: currentMonth,
      })

      set((state) => ({
        transactions: [...state.transactions, newTransaction]
      }))
    } catch (error) {
      console.error('Failed to add transaction:', error)
    }
  },

  updateTransaction: async (transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    try {
      await DatabaseService.updateTransaction(transactionId, updates)
      
      set((state) => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, ...updates } : t
        )
      }))
    } catch (error) {
      console.error('Failed to update transaction:', error)
    }
  },

  removeTransaction: async (transactionId: string) => {
    try {
      await DatabaseService.removeTransaction(transactionId)
      
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== transactionId)
      }))
    } catch (error) {
      console.error('Failed to remove transaction:', error)
    }
  },

  getBudgetSummary: (month?: string) => {
    const { budgets, currentMonth, transactions } = get()
    const targetMonth = month || currentMonth
    const budget = budgets[targetMonth]
    
    if (!budget) {
      return {
        totalIncome: 0,
        totalFixedExpenses: 0,
        totalVariableExpenses: 0,
        totalPlannedSavings: 0,
        totalActualSavings: 0,
        totalPlannedExpenses: 0,
        totalActualExpenses: 0,
        plannedBalance: 0,
        actualBalance: 0,
        availableForVariable: 0
      }
    }

    const expenseCategories = budget.categories.filter(cat => cat.type === 'expense')
    const fixedExpenses = expenseCategories.filter(cat => cat.categoryType === 'fixed')
    const variableExpenses = expenseCategories.filter(cat => cat.categoryType === 'variable')
    
    const totalFixedExpenses = fixedExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
    const totalVariableExpenses = variableExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
    
    // Calculate actual amounts from transactions
    const monthTransactions = transactions.filter(t => t.month === targetMonth)
    const totalActualFixedExpenses = totalFixedExpenses
    
    const totalActualVariableExpenses = variableExpenses.reduce((sum, cat) => {
      const categoryTransactions = monthTransactions.filter(t => t.categoryId === cat.id)
      return sum + categoryTransactions.reduce((catSum, t) => catSum + t.amount, 0)
    }, 0)
    
    const totalActualExpenses = totalActualFixedExpenses + totalActualVariableExpenses
    const totalPlannedSavings = Math.max(0, budget.totalIncome - totalFixedExpenses - totalVariableExpenses)
    const totalActualSavings = Math.max(0, budget.totalIncome - totalActualExpenses)
    const totalPlannedExpenses = totalFixedExpenses + totalVariableExpenses
    const plannedBalance = 0
    const actualBalance = 0
    const availableForVariable = budget.totalIncome - totalFixedExpenses

    return {
      totalIncome: budget.totalIncome,
      totalFixedExpenses,
      totalVariableExpenses,
      totalPlannedSavings,
      totalActualSavings,
      totalPlannedExpenses,
      totalActualExpenses,
      plannedBalance,
      actualBalance,
      availableForVariable
    }
  },

  getSavingsSummary: (): SavingsSummary => {
    const { budgets, savingsGoal, savingsGoalDescription } = get()
    const months = Object.keys(budgets).sort()
    
    let totalPlannedSavings = 0
    let totalActualSavings = 0
    const savingsByMonth: Array<{ month: string; planned: number; actual: number }> = []

    months.forEach(month => {
      const budget = budgets[month]
      if (!budget) return
      
      const plannedSavings = budget.categories
        .filter(cat => cat.type === 'savings')
        .reduce((sum, cat) => sum + cat.plannedAmount, 0)
      
      const actualSavings = budget.categories
        .filter(cat => cat.type === 'savings')
        .reduce((sum, cat) => sum + cat.actualAmount, 0)

      totalPlannedSavings += plannedSavings
      totalActualSavings += actualSavings
      
      savingsByMonth.push({
        month,
        planned: plannedSavings,
        actual: actualSavings
      })
    })

    return {
      totalPlannedSavings,
      totalActualSavings,
      savingsByMonth,
      goal: savingsGoal,
      goalDescription: savingsGoalDescription
    }
  },

  setSavingsGoal: async (goal: number, description: string) => {
    try {
      await DatabaseService.updateUserSettings({ 
        savingsGoal: goal, 
        savingsGoalDescription: description 
      })
      set({ savingsGoal: goal, savingsGoalDescription: description })
    } catch (error) {
      console.error('Failed to update savings goal:', error)
    }
  },

  setSavingsAmount: async (amount: number, month?: string) => {
    // This method would need to be implemented based on your savings logic
    // For now, keeping the original implementation
  },

  getCategoryActualAmount: (categoryId: string, month?: string) => {
    const { transactions, currentMonth, budgets } = get()
    const targetMonth = month || currentMonth
    const budget = budgets[targetMonth]
    
    if (!budget) return 0
    
    const category = budget.categories.find(cat => cat.id === categoryId)
    if (!category) return 0
    
    if (category.categoryType === 'fixed') {
      return category.plannedAmount
    }
    
    return transactions
      .filter(t => t.categoryId === categoryId && t.month === targetMonth)
      .reduce((sum, t) => sum + t.amount, 0)
  },

  getTransactionsByCategory: (categoryId: string, month?: string) => {
    const { transactions, currentMonth } = get()
    const targetMonth = month || currentMonth
    
    return transactions
      .filter(t => t.categoryId === categoryId && t.month === targetMonth)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  getAvailableMonths: () => {
    const { budgets } = get()
    return Object.keys(budgets).sort()
  },

  initializeWithSeedData: async () => {
    try {
      set({ isInitializing: true })
      
      const currentMonth = new Date().toISOString().slice(0, 7)
      const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7)

      // Create budgets with default categories (no mock data)
      await get().createBudget(`Бюджет ${previousMonth}`, previousMonth, 0)
      await get().createBudget(`Бюджет ${currentMonth}`, currentMonth, 0)

      set({
        currentMonth,
        isInitialized: true,
        isInitializing: false,
      })
    } catch (error) {
      console.error('Failed to initialize with seed data:', error)
      set({ isInitializing: false })
    }
  },

  clearAllData: async () => {
    // This would need to implement database clearing logic
    set({
      budgets: {},
      currentMonth: new Date().toISOString().slice(0, 7),
      transactions: [],
    })
  },

  copyPermanentCategoryToFutureMonths: async (category: BudgetCategory, fromMonth: string) => {
    // This would need to implement the permanent category copying logic
    // For now, keeping minimal implementation
  },
}))

// Initialize data on store creation
if (typeof window !== 'undefined') {
  useFinanceStore.getState().loadAllData()
}
