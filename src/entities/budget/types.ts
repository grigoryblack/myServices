/**
 * Budget entity types
 * Defines the core data structures for budget management
 */
export interface BudgetCategory {
  id: string
  name: string
  plannedAmount: number
  actualAmount: number
  type: 'income' | 'expense' | 'savings'
  categoryType: 'fixed' | 'variable' // Фиксированные или переменные расходы
  proportion?: number // Пропорция для переменных категорий (0-1)
  color?: string
}

export interface Budget {
  id: string
  name: string
  month: string // YYYY-MM format
  totalIncome: number // Общий доход за месяц
  categories: BudgetCategory[]
  createdAt: Date
  updatedAt: Date
}

export interface BudgetSummary {
  totalIncome: number
  totalFixedExpenses: number
  totalVariableExpenses: number
  totalPlannedSavings: number
  totalActualSavings: number
  totalPlannedExpenses: number
  totalActualExpenses: number
  plannedBalance: number
  actualBalance: number
  availableForVariable: number // Доступно для переменных расходов
}

export interface SavingsSummary {
  totalPlannedSavings: number
  totalActualSavings: number
  savingsByMonth: Array<{
    month: string
    planned: number
    actual: number
  }>
  goal: number
  goalDescription: string
}
