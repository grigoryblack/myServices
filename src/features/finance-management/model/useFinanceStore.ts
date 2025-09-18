"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BudgetCategory, Budget, Transaction, BudgetSummary, SavingsSummary } from '@/entities'

/**
 * Finance management store
 * Manages multiple monthly budgets, categories, and transactions with persistence
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
  createBudget: (name: string, month: string, totalIncome?: number) => void
  redistributeIncome: (month: string) => void
  getBudgetSummary: (month?: string) => BudgetSummary
  getSavingsSummary: () => SavingsSummary
  updateCategory: (month: string, categoryId: string, updates: Partial<BudgetCategory>) => void
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'month'>) => void
  updateTransaction: (transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void
  removeTransaction: (transactionId: string) => void
  addCategory: (month: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>) => void
  removeCategory: (month: string, categoryId: string) => void
  getCategoryActualAmount: (categoryId: string, month?: string) => number
  getTransactionsByCategory: (categoryId: string, month?: string) => Transaction[]
  getAvailableMonths: () => string[]
  getCurrentBudget: () => Budget | null
  setCurrentMonth: (month: string) => void
  setSavingsGoal: (goal: number, description: string) => void
  setSavingsAmount: (amount: number, month?: string) => void
  updateBudgetIncome: (month: string, totalIncome: number) => void
  initializeWithSeedData: () => void
  clearAllData: () => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      budgets: {},
      currentMonth: new Date().toISOString().slice(0, 7),
      transactions: [],
      isInitialized: false,
      isInitializing: false,
      savingsGoal: 100000,
      savingsGoalDescription: 'Цель накоплений',

      createBudget: (name: string, month: string, totalIncome = 0) => {
        const defaultCategories: BudgetCategory[] = [
          // One fixed expense
          {
            id: crypto.randomUUID(),
            name: 'Фиксированные расходы',
            plannedAmount: 0,
            actualAmount: 0,
            type: 'expense',
            categoryType: 'fixed',
            color: '#ef4444'
          },
          // One variable expense
          {
            id: crypto.randomUUID(),
            name: 'Переменные расходы',
            plannedAmount: 0,
            actualAmount: 0,
            type: 'expense',
            categoryType: 'variable',
            proportion: 1.0,
            color: '#22c55e'
          },
          // One savings
          {
            id: crypto.randomUUID(),
            name: 'Копилка',
            plannedAmount: 0,
            actualAmount: 0,
            type: 'savings',
            categoryType: 'fixed',
            color: '#059669'
          }
        ]

        const newBudget: Budget = {
          id: crypto.randomUUID(),
          name,
          month,
          totalIncome,
          categories: defaultCategories,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          budgets: { ...state.budgets, [month]: newBudget },
          currentMonth: month
        }))
      },

      setCurrentMonth: (month: string) => {
        set({ currentMonth: month })
      },

      getCurrentBudget: () => {
        const { budgets, currentMonth } = get()
        const budget = budgets[currentMonth]
        
        if (!budget) return null
        
        
        return budget
      },

      updateBudgetIncome: (month: string, totalIncome: number) => {
        const { budgets } = get()
        const budget = budgets[month]
        if (!budget) return

        const updatedBudget = { ...budget, totalIncome, updatedAt: new Date() }
        set((state) => ({
          budgets: { ...state.budgets, [month]: updatedBudget }
        }))

        // Trigger income redistribution
        get().redistributeIncome(month)
      },

      redistributeIncome: (month: string) => {
        set((state) => {
          const budget = state.budgets[month]
          if (!budget || budget.totalIncome === 0) return state

          const fixedExpenses = budget.categories.filter(cat => 
            cat.type === 'expense' && cat.categoryType === 'fixed'
          )
          const variableExpenses = budget.categories.filter(cat => 
            cat.type === 'expense' && cat.categoryType === 'variable'
          )

          const totalFixedExpenses = fixedExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
          
          // Available for variable expenses = Income - Fixed (savings are automatic remainder)
          const availableForVariable = Math.max(0, budget.totalIncome - totalFixedExpenses)
          
          // Calculate total proportions
          const totalProportions = variableExpenses.reduce((sum, cat) => sum + (cat.proportion || 0), 0)
          
          if (totalProportions === 0) return state
          
          // Redistribute variable expenses proportionally
          const updatedCategories = budget.categories.map(category => {
            if (category.type === 'expense' && category.categoryType === 'variable' && category.proportion) {
              const newAmount = (availableForVariable * category.proportion) / totalProportions
              return { ...category, plannedAmount: Math.max(0, newAmount) }
            }
            return category
          })

          return {
            ...state,
            budgets: {
              ...state.budgets,
              [month]: {
                ...budget,
                categories: updatedCategories,
                updatedAt: new Date()
              }
            }
          }
        })
      },

      updateCategory: (month: string, categoryId: string, updates: Partial<BudgetCategory>) => {
        set((state) => {
          const budget = state.budgets[month]
          if (!budget) return state

          const updatedCategories = budget.categories.map(cat =>
            cat.id === categoryId ? { ...cat, ...updates } : cat
          )

          const updatedBudget = {
            ...budget,
            categories: updatedCategories
          }

          // If we updated a fixed category's planned amount, recalculate variable categories
          const updatedCategory = updatedCategories.find(cat => cat.id === categoryId)
          if (updatedCategory && updatedCategory.categoryType === 'fixed' && updates.plannedAmount !== undefined) {
            get().redistributeIncome(month)
          }

          return {
            ...state,
            budgets: {
              ...state.budgets,
              [month]: updatedBudget
            }
          }
        })
      },

      addCategory: (month: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>) => {
        const { budgets } = get()
        const budget = budgets[month]
        if (!budget) return

        const newCategory: BudgetCategory = {
          ...categoryData,
          id: crypto.randomUUID(),
          actualAmount: 0,
        }

        const updatedBudget = {
          ...budget,
          categories: [...budget.categories, newCategory],
          updatedAt: new Date(),
        }

        set((state) => ({
          budgets: { ...state.budgets, [month]: updatedBudget }
        }))

        // If it's a variable category, redistribute income
        if (categoryData.categoryType === 'variable') {
          get().redistributeIncome(month)
        }
      },

      removeCategory: (month: string, categoryId: string) => {
        const { budgets, transactions } = get()
        const budget = budgets[month]
        if (!budget) return

        const categoryToRemove = budget.categories.find(cat => cat.id === categoryId)
        if (!categoryToRemove) return

        console.log('Removing category:', categoryToRemove.name, 'from month:', month)

        const updatedCategories = budget.categories.filter(cat => cat.id !== categoryId)
        
        // Only remove transactions for the specific month
        const updatedTransactions = transactions.filter(t => 
          !(t.categoryId === categoryId && t.month === month)
        )

        const updatedBudget = {
          ...budget,
          categories: updatedCategories,
          updatedAt: new Date(),
        }

        // Force state update to trigger re-render
        set((state) => ({
          ...state,
          budgets: { ...state.budgets, [month]: updatedBudget },
          transactions: updatedTransactions,
        }))

        console.log('Category removed. Remaining categories:', updatedCategories.length)

        // If it was a variable category, redistribute income
        if (categoryToRemove.categoryType === 'variable') {
          setTimeout(() => get().redistributeIncome(month), 100)
        }
      },

      addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'month'>) => {
        const { transactions, currentMonth } = get()
        const newTransaction: Transaction = {
          ...transaction,
          id: crypto.randomUUID(),
          month: currentMonth,
          createdAt: new Date()
        }

        set({ transactions: [...transactions, newTransaction] })
      },

      updateTransaction: (transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
        const { transactions } = get()
        const updatedTransactions = transactions.map(t =>
          t.id === transactionId ? { ...t, ...updates } : t
        )
        set({ transactions: updatedTransactions })
      },

      removeTransaction: (transactionId: string) => {
        const { transactions, budgets } = get()
        const transactionToRemove = transactions.find(t => t.id === transactionId)
        
        if (!transactionToRemove) return
        
        // Remove the transaction
        const updatedTransactions = transactions.filter(t => t.id !== transactionId)
        
        // Update the category's actual amount
        const budget = budgets[transactionToRemove.month]
        if (budget) {
          const category = budget.categories.find(cat => cat.id === transactionToRemove.categoryId)
          if (category && category.categoryType !== 'fixed') {
            // Recalculate actual amount for variable categories
            const newActualAmount = updatedTransactions
              .filter(t => t.categoryId === transactionToRemove.categoryId && t.month === transactionToRemove.month)
              .reduce((sum, t) => sum + t.amount, 0)
            
            category.actualAmount = newActualAmount
            budget.updatedAt = new Date()
          }
        }
        
        set({ 
          transactions: updatedTransactions,
          budgets: { ...budgets }
        })
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
        
        // Calculate actual amounts from transactions (only for variable expenses)
        const monthTransactions = transactions.filter(t => t.month === targetMonth)
        
        // Fixed expenses are automatically deducted, no actual tracking
        const totalActualFixedExpenses = totalFixedExpenses
        
        // Only variable expenses have actual tracking
        const totalActualVariableExpenses = variableExpenses.reduce((sum, cat) => {
          const categoryTransactions = monthTransactions.filter(t => t.categoryId === cat.id)
          return sum + categoryTransactions.reduce((catSum, t) => catSum + t.amount, 0)
        }, 0)
        
        const totalActualExpenses = totalActualFixedExpenses + totalActualVariableExpenses
        
        // Savings are automatic remainder after all expenses
        const totalPlannedSavings = Math.max(0, budget.totalIncome - totalFixedExpenses - totalVariableExpenses)
        const totalActualSavings = Math.max(0, budget.totalIncome - totalActualExpenses)
        
        const totalPlannedExpenses = totalFixedExpenses + totalVariableExpenses
        const plannedBalance = 0 // No balance, everything goes to expenses or savings
        const actualBalance = 0 // No balance, everything goes to expenses or savings
        
        // Available for variable = Income - Fixed (no savings deduction)
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
        const { budgets } = get()
        const months = Object.keys(budgets).sort()
        
        let totalPlannedSavings = 0
        let totalActualSavings = 0
        const savingsByMonth: Array<{ month: string; planned: number; actual: number }> = []
        const goal = 100000
        const goalDescription = 'Цель на год'

        months.forEach(month => {
          const budget = budgets[month]
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
          goal: get().savingsGoal,
          goalDescription: get().savingsGoalDescription
        }
      },

      setSavingsGoal: (goal: number, description: string) => {
        set({ savingsGoal: goal, savingsGoalDescription: description })
      },

      setSavingsAmount: (amount: number, month?: string) => {
        const { budgets, currentMonth } = get()
        const targetMonth = month || currentMonth
        const budget = budgets[targetMonth]
        
        if (!budget) return
        
        // Find or create savings category
        let savingsCategory = budget.categories.find(cat => cat.type === 'savings')
        
        if (!savingsCategory) {
          // Create new savings category if it doesn't exist
          savingsCategory = {
            id: crypto.randomUUID(),
            name: 'Накопления',
            plannedAmount: 0,
            actualAmount: amount,
            type: 'savings',
            categoryType: 'fixed',
            color: '#10b981'
          }
          budget.categories.push(savingsCategory)
        }
        
        // Update the actual amount for savings category
        savingsCategory.actualAmount = amount
        budget.updatedAt = new Date()
        
        set({ budgets: { ...budgets } })
      },

      getCategoryActualAmount: (categoryId: string, month?: string) => {
        const { transactions, currentMonth, budgets } = get()
        const targetMonth = month || currentMonth
        const budget = budgets[targetMonth]
        
        if (!budget) return 0
        
        const category = budget.categories.find(cat => cat.id === categoryId)
        if (!category) return 0
        
        // Fixed expenses are automatically deducted (actual = planned)
        if (category.categoryType === 'fixed') {
          return category.plannedAmount
        }
        
        // For variable expenses and savings, calculate from transactions
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

      initializeWithSeedData: () => {
        set((state) => ({ ...state, isInitializing: true }))
        
        const currentMonth = new Date().toISOString().slice(0, 7)
        const previousMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7)

        // Create budgets with default categories (no mock data)
        const { createBudget } = get()
        createBudget(`Бюджет ${previousMonth}`, previousMonth, 0)
        createBudget(`Бюджет ${currentMonth}`, currentMonth, 0)

        // Mark as initialized and stop initializing
        set((state) => ({
          ...state,
          currentMonth,
          transactions: [],
          isInitialized: true,
          isInitializing: false,
        }))
      },

      clearAllData: () => {
        set({
          budgets: {},
          currentMonth: new Date().toISOString().slice(0, 7),
          transactions: [],
        })
      },
    }),
    {
      name: 'finance-store',
    }
  )
)
