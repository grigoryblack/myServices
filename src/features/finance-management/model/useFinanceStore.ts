"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BudgetCategory, Budget, Transaction, BudgetSummary, SavingsSummary } from '@/entities'

/**
 * Finance management store
 * Manages multiple monthly budgets, categories, and transactions with localStorage persistence
 */
interface FinanceState {
  budgets: Record<string, Budget>
  transactions: Transaction[]
  currentMonth: string
  isInitialized: boolean
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
  copyPermanentCategoryToFutureMonths: (category: BudgetCategory, fromMonth: string) => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      budgets: {},
      currentMonth: new Date().toISOString().slice(0, 7),
      transactions: [],
      isInitialized: false,
      savingsGoal: 100000,
      savingsGoalDescription: 'Цель накоплений',

      createBudget: (name: string, month: string, totalIncome = 0) => {
        const newBudget: Budget = {
          id: `budget-${month}`,
          name,
          month,
          totalIncome,
          categories: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          budgets: {
            ...state.budgets,
            [month]: newBudget,
          },
        }))

        // Initialize with default categories if income is provided
        if (totalIncome > 0) {
          get().redistributeIncome(month)
        }
      },

      redistributeIncome: (month: string) => {
        const state = get()
        const budget = state.budgets[month]
        if (!budget) return

        const fixedCategories = budget.categories.filter(cat => cat.categoryType === 'fixed')
        const savingsCategories = budget.categories.filter(cat => cat.categoryType === 'savings')
        const variableCategories = budget.categories.filter(cat => cat.categoryType === 'variable')

        const totalFixed = fixedCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0)
        const totalSavings = savingsCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0)
        const availableForVariable = budget.totalIncome - totalFixed - totalSavings

        if (availableForVariable <= 0 || variableCategories.length === 0) return

        const totalProportions = variableCategories.reduce((sum, cat) => sum + (cat.proportion || 0), 0)

        if (totalProportions === 0) return

        const updatedCategories = budget.categories.map(category => {
          if (category.categoryType === 'variable' && category.proportion) {
            return {
              ...category,
              plannedAmount: Math.round((availableForVariable * category.proportion) / totalProportions)
            }
          }
          return category
        })

        set((state) => ({
          budgets: {
            ...state.budgets,
            [month]: {
              ...budget,
              categories: updatedCategories,
              updatedAt: new Date().toISOString(),
            }
          }
        }))
      },

      getBudgetSummary: (month?: string): BudgetSummary => {
        const targetMonth = month || get().currentMonth
        const budget = get().budgets[targetMonth]
        
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
            availableForVariable: 0,
          }
        }

        const fixedExpenses = budget.categories.filter(cat => cat.categoryType === 'fixed' && cat.type === 'expense')
        const variableExpenses = budget.categories.filter(cat => cat.categoryType === 'variable' && cat.type === 'expense')
        const savingsCategories = budget.categories.filter(cat => cat.type === 'savings')
        
        const totalFixedExpenses = fixedExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
        const totalVariableExpenses = variableExpenses.reduce((sum, cat) => sum + cat.plannedAmount, 0)
        const totalPlannedSavings = savingsCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0)
        const totalActualSavings = savingsCategories.reduce((sum, cat) => sum + get().getCategoryActualAmount(cat.id, targetMonth), 0)
        const totalPlannedExpenses = totalFixedExpenses + totalVariableExpenses
        const totalActualExpenses = budget.categories.filter(cat => cat.type === 'expense').reduce((sum, cat) => sum + get().getCategoryActualAmount(cat.id, targetMonth), 0)

        return {
          totalIncome: budget.totalIncome,
          totalFixedExpenses,
          totalVariableExpenses,
          totalPlannedSavings,
          totalActualSavings,
          totalPlannedExpenses,
          totalActualExpenses,
          plannedBalance: budget.totalIncome - totalPlannedExpenses - totalPlannedSavings,
          actualBalance: budget.totalIncome - totalActualExpenses - totalActualSavings,
          availableForVariable: budget.totalIncome - totalFixedExpenses - totalPlannedSavings,
        }
      },

      getSavingsSummary: (): SavingsSummary => {
        const state = get()
        const allBudgets = Object.values(state.budgets)
        
        let totalSaved = 0
        const monthlyBreakdown: Array<{ month: string; amount: number }> = []

        let totalPlannedSavings = 0
        let totalActualSavings = 0
        const savingsByMonth: Array<{ month: string; planned: number; actual: number }> = []

        allBudgets.forEach(budget => {
          const savingsCategories = budget.categories.filter(cat => cat.type === 'savings')
          const monthPlanned = savingsCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0)
          const monthActual = savingsCategories.reduce((sum, cat) => {
            return sum + get().getCategoryActualAmount(cat.id, budget.month)
          }, 0)
          
          totalPlannedSavings += monthPlanned
          totalActualSavings += monthActual
          
          if (monthPlanned > 0 || monthActual > 0) {
            savingsByMonth.push({
              month: budget.month,
              planned: monthPlanned,
              actual: monthActual
            })
          }
        })

        return {
          totalPlannedSavings,
          totalActualSavings,
          savingsByMonth: savingsByMonth.sort((a, b) => a.month.localeCompare(b.month)),
          goal: state.savingsGoal,
          goalDescription: state.savingsGoalDescription,
        }
      },

      updateCategory: (month: string, categoryId: string, updates: Partial<BudgetCategory>) => {
        set((state) => {
          const budget = state.budgets[month]
          if (!budget) return state

          const updatedCategories = budget.categories.map(cat =>
            cat.id === categoryId ? { ...cat, ...updates } : cat
          )

          return {
            budgets: {
              ...state.budgets,
              [month]: {
                ...budget,
                categories: updatedCategories,
                updatedAt: new Date().toISOString(),
              }
            }
          }
        })
      },

      addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'month'>) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          month: transaction.date.slice(0, 7), // Extract YYYY-MM from date
        }

        set((state) => ({
          transactions: [...state.transactions, newTransaction]
        }))
      },

      updateTransaction: (transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
        set((state) => ({
          transactions: state.transactions.map(transaction =>
            transaction.id === transactionId 
              ? { 
                  ...transaction, 
                  ...updates,
                  month: updates.date ? updates.date.slice(0, 7) : transaction.month
                }
              : transaction
          )
        }))
      },

      removeTransaction: (transactionId: string) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== transactionId)
        }))
      },

      addCategory: (month: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>) => {
        const newCategory: BudgetCategory = {
          ...categoryData,
          id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          actualAmount: 0,
        }

        set((state) => {
          const budget = state.budgets[month]
          if (!budget) return state

          return {
            budgets: {
              ...state.budgets,
              [month]: {
                ...budget,
                categories: [...budget.categories, newCategory],
                updatedAt: new Date().toISOString(),
              }
            }
          }
        })
      },

      removeCategory: (month: string, categoryId: string) => {
        set((state) => {
          const budget = state.budgets[month]
          if (!budget) return state

          return {
            budgets: {
              ...state.budgets,
              [month]: {
                ...budget,
                categories: budget.categories.filter(cat => cat.id !== categoryId),
                updatedAt: new Date().toISOString(),
              }
            }
          }
        })
      },

      getCategoryActualAmount: (categoryId: string, month?: string): number => {
        const targetMonth = month || get().currentMonth
        const transactions = get().transactions.filter(t => 
          t.categoryId === categoryId && t.month === targetMonth
        )
        return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      },

      getTransactionsByCategory: (categoryId: string, month?: string): Transaction[] => {
        const targetMonth = month || get().currentMonth
        return get().transactions.filter(t => 
          t.categoryId === categoryId && t.month === targetMonth
        )
      },

      getAvailableMonths: (): string[] => {
        const budgetMonths = Object.keys(get().budgets)
        const transactionMonths = [...new Set(get().transactions.map(t => t.month))]
        const allMonths = [...new Set([...budgetMonths, ...transactionMonths])]
        return allMonths.sort()
      },

      getCurrentBudget: (): Budget | null => {
        return get().budgets[get().currentMonth] || null
      },

      setCurrentMonth: (month: string) => {
        set({ currentMonth: month })
      },

      setSavingsGoal: (goal: number, description: string) => {
        set({ savingsGoal: goal, savingsGoalDescription: description })
      },

      setSavingsAmount: (amount: number, month?: string) => {
        const targetMonth = month || get().currentMonth
        const budget = get().budgets[targetMonth]
        if (!budget) return

        // Find or create savings category
        let savingsCategory = budget.categories.find(cat => cat.categoryType === 'savings')
        
        if (!savingsCategory) {
          get().addCategory(targetMonth, {
            name: 'Накопления',
            plannedAmount: amount,
            categoryType: 'savings',
            color: '#10B981',
          })
        } else {
          get().updateCategory(targetMonth, savingsCategory.id, { plannedAmount: amount })
        }
      },

      updateBudgetIncome: (month: string, totalIncome: number) => {
        set((state) => {
          const budget = state.budgets[month]
          if (!budget) return state

          return {
            budgets: {
              ...state.budgets,
              [month]: {
                ...budget,
                totalIncome,
                updatedAt: new Date().toISOString(),
              }
            }
          }
        })

        // Redistribute income after update
        get().redistributeIncome(month)
      },

      initializeWithSeedData: () => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

        // Create previous month budget
        get().createBudget('Бюджет', previousMonth, 150000)
        
        // Add categories to previous month
        const prevBudgetId = `budget-${previousMonth}`
        get().addCategory(previousMonth, {
          name: 'Аренда',
          plannedAmount: 45000,
          categoryType: 'fixed',
          color: '#EF4444',
        })
        
        get().addCategory(previousMonth, {
          name: 'Коммунальные',
          plannedAmount: 8000,
          categoryType: 'fixed',
          color: '#F59E0B',
        })
        
        get().addCategory(previousMonth, {
          name: 'Кредит',
          plannedAmount: 25000,
          categoryType: 'fixed',
          color: '#DC2626',
        })
        
        get().addCategory(previousMonth, {
          name: 'Продукты',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#10B981',
          proportion: 50,
        })
        
        get().addCategory(previousMonth, {
          name: 'Транспорт',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#3B82F6',
          proportion: 20,
        })
        
        get().addCategory(previousMonth, {
          name: 'Развлечения',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#8B5CF6',
          proportion: 30,
        })
        
        get().setSavingsAmount(20000, previousMonth)
        get().redistributeIncome(previousMonth)

        // Create current month budget
        get().createBudget('Бюджет', currentMonth, 150000)
        
        // Add categories to current month
        get().addCategory(currentMonth, {
          name: 'Аренда',
          plannedAmount: 45000,
          categoryType: 'fixed',
          color: '#EF4444',
        })
        
        get().addCategory(currentMonth, {
          name: 'Коммунальные',
          plannedAmount: 8000,
          categoryType: 'fixed',
          color: '#F59E0B',
        })
        
        get().addCategory(currentMonth, {
          name: 'Кредит',
          plannedAmount: 25000,
          categoryType: 'fixed',
          color: '#DC2626',
        })
        
        get().addCategory(currentMonth, {
          name: 'Продукты',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#10B981',
          proportion: 50,
        })
        
        get().addCategory(currentMonth, {
          name: 'Транспорт',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#3B82F6',
          proportion: 20,
        })
        
        get().addCategory(currentMonth, {
          name: 'Развлечения',
          plannedAmount: 0,
          categoryType: 'variable',
          color: '#8B5CF6',
          proportion: 30,
        })
        
        get().setSavingsAmount(20000, currentMonth)
        get().redistributeIncome(currentMonth)

        set({ isInitialized: true })
      },

      clearAllData: () => {
        set({
          budgets: {},
          transactions: [],
          currentMonth: new Date().toISOString().slice(0, 7),
          isInitialized: false,
          savingsGoal: 100000,
          savingsGoalDescription: 'Цель накоплений',
        })
      },

      copyPermanentCategoryToFutureMonths: (category: BudgetCategory, fromMonth: string) => {
        const state = get()
        const availableMonths = get().getAvailableMonths()
        const futureMonths = availableMonths.filter(month => month > fromMonth)

        futureMonths.forEach(month => {
          const budget = state.budgets[month]
          if (!budget) return

          const existingCategory = budget.categories.find(cat => cat.name === category.name)
          if (!existingCategory) {
            get().addCategory(month, {
              name: category.name,
              plannedAmount: category.plannedAmount,
              categoryType: category.categoryType,
              color: category.color,
              proportion: category.proportion,
            })
          }
        })
      },
    }),
    {
      name: 'finance-store',
      partialize: (state) => ({
        budgets: state.budgets,
        transactions: state.transactions,
        currentMonth: state.currentMonth,
        isInitialized: state.isInitialized,
        savingsGoal: state.savingsGoal,
        savingsGoalDescription: state.savingsGoalDescription,
      }),
    }
  )
)
