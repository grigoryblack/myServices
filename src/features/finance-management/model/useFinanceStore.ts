"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BudgetCategory, Budget, Transaction, BudgetSummary, SavingsSummary } from '@/entities'

/**
 * Finance management store
 * Manages multiple monthly budgets, categories, and transactions with persistence
 */
interface FinanceState {
  budgets: Record<string, Budget> // Key: YYYY-MM format
  currentMonth: string
  transactions: Transaction[]
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
  getCategoryActualAmount: (categoryId: string, month?: string) => number
  getTransactionsByCategory: (categoryId: string, month?: string) => Transaction[]
  getAvailableMonths: () => string[]
  getCurrentBudget: () => Budget | null
  setCurrentMonth: (month: string) => void
  setSavingsGoal: (goal: number, description: string) => void
  setSavingsAmount: (amount: number, month?: string) => void
  initializeWithSeedData: () => void
  clearAllData: () => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      budgets: {},
      currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
      transactions: [],
      savingsGoal: 100000,
      savingsGoalDescription: 'Цель на год',

      createBudget: (name: string, month: string, totalIncome = 0) => {
        const newBudget: Budget = {
          id: crypto.randomUUID(),
          name,
          month,
          totalIncome,
          categories: [],
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
        
        // Check if unexpected expenses category exists, if not add it
        const hasUnexpectedExpenses = budget.categories.some(cat => 
          cat.name === 'Непредвиденные расходы'
        )
        
        if (!hasUnexpectedExpenses) {
          budget.categories.push({
            id: crypto.randomUUID(),
            name: 'Непредвиденные расходы',
            plannedAmount: 15000,
            actualAmount: 0,
            type: 'expense',
            categoryType: 'fixed',
            color: '#991b1b'
          })
          budget.updatedAt = new Date()
          
          // Update the store
          set({ budgets: { ...budgets } })
        }
        
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
          if (!budget) return state

          const fixedExpenses = budget.categories.filter(cat => 
            cat.type === 'expense' && cat.categoryType === 'fixed'
          )
          const variableExpenses = budget.categories.filter(cat => 
            cat.type === 'expense' && cat.categoryType === 'variable'
          )

          const totalFixedExpenses = fixedExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
          
          // Available for variable expenses = Income - Fixed (savings are automatic remainder)
          const availableForVariable = budget.totalIncome - totalFixedExpenses
          
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

      addCategory: (categoryData: Omit<BudgetCategory, 'id'>) => {
        const { currentMonth, budgets } = get()
        const budget = budgets[currentMonth]
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
          budgets: { ...state.budgets, [currentMonth]: updatedBudget }
        }))
      },

      removeCategory: (categoryId: string) => {
        const { currentMonth, budgets, transactions } = get()
        const budget = budgets[currentMonth]
        if (!budget) return

        const updatedCategories = budget.categories.filter(cat => cat.id !== categoryId)
        const updatedTransactions = transactions.filter(t => t.categoryId !== categoryId)

        const updatedBudget = {
          ...budget,
          categories: updatedCategories,
          updatedAt: new Date(),
        }

        set((state) => ({
          budgets: { ...state.budgets, [currentMonth]: updatedBudget },
          transactions: updatedTransactions,
        }))
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
        const { transactions } = get()
        set({ transactions: transactions.filter(t => t.id !== transactionId) })
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
        const totalPlannedSavings = budget.totalIncome - totalFixedExpenses - totalVariableExpenses
        const totalActualSavings = budget.totalIncome - totalActualExpenses
        
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
            .reduce((sum, cat) => sum + get().getCategoryActualAmount(cat.id, month), 0)

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
        const currentMonth = new Date().toISOString().slice(0, 7)
        const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

        const createBudgetForMonth = (month: string, totalIncome: number): Budget => ({
          id: `budget-${month}`,
          name: `Бюджет ${month}`,
          month,
          totalIncome,
          categories: [
            // Create default categories for new budget
            {
              id: crypto.randomUUID(),
              name: 'Аренда',
              plannedAmount: 45000,
              actualAmount: 0,
              type: 'expense',
              categoryType: 'fixed',
              color: '#ef4444'
            },
            {
              id: crypto.randomUUID(),
              name: 'Коммунальные услуги',
              plannedAmount: 8000,
              actualAmount: 0,
              type: 'expense',
              categoryType: 'fixed',
              color: '#f97316'
            },
            {
              id: crypto.randomUUID(),
              name: 'Кредит',
              plannedAmount: 25000,
              actualAmount: 0,
              type: 'expense',
              categoryType: 'fixed',
              color: '#dc2626'
            },
            {
              id: crypto.randomUUID(),
              name: 'Непредвиденные расходы',
              plannedAmount: 15000,
              actualAmount: 0,
              type: 'expense',
              categoryType: 'fixed',
              color: '#991b1b'
            },
            // Variable expenses with proportions
            {
              id: `${month}-expense-food`,
              name: 'Питание',
              plannedAmount: 36000, // Will be recalculated
              actualAmount: 0,
              type: 'expense',
              categoryType: 'variable',
              proportion: 0.5, // 50%
              color: '#22c55e'
            },
            {
              id: `${month}-expense-transport`,
              name: 'Транспорт',
              plannedAmount: 14400, // Will be recalculated
              actualAmount: 0,
              type: 'expense',
              categoryType: 'variable',
              proportion: 0.2, // 20%
              color: '#3b82f6'
            },
            {
              id: `${month}-expense-entertainment`,
              name: 'Развлечения',
              plannedAmount: 21600, // Will be recalculated
              actualAmount: 0,
              type: 'expense',
              categoryType: 'variable',
              proportion: 0.3, // 30%
              color: '#8b5cf6'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const budgets = {
          [previousMonth]: createBudgetForMonth(previousMonth, 150000),
          [currentMonth]: createBudgetForMonth(currentMonth, 150000)
        }

        const seedTransactions: Transaction[] = [
          // Previous month transactions
          {
            id: crypto.randomUUID(),
            categoryId: `${previousMonth}-expense-rent`,
            amount: 45000,
            description: 'Аренда квартиры',
            date: new Date(`${previousMonth}-01`),
            month: previousMonth,
            type: 'expense',
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            categoryId: `${previousMonth}-expense-food`,
            amount: 28500,
            description: 'Продукты за месяц',
            date: new Date(`${previousMonth}-15`),
            month: previousMonth,
            type: 'expense',
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            categoryId: `${previousMonth}-savings-general`,
            amount: 20000,
            description: 'Ежемесячные накопления',
            date: new Date(`${previousMonth}-01`),
            month: previousMonth,
            type: 'expense',
            createdAt: new Date(),
          },
          // Current month transactions
          {
            id: crypto.randomUUID(),
            categoryId: `${currentMonth}-expense-rent`,
            amount: 45000,
            description: 'Аренда квартиры',
            date: new Date(`${currentMonth}-01`),
            month: currentMonth,
            type: 'expense',
            createdAt: new Date(),
          }
        ]

        set({
          budgets,
          currentMonth,
          transactions: seedTransactions,
        })

        // Redistribute income for both months
        get().redistributeIncome(previousMonth)
        get().redistributeIncome(currentMonth)
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
