"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui'
import { 
  BalanceCard, 
  BudgetTable, 
  ExpenseForm, 
  MonthSelector,
  SavingsWidget,
  IncomeForm,
  TransactionHistory,
} from '@/features/finance-management'
import { useFinanceStore } from '@/features/finance-management/model/useFinanceStore'

/**
 * Finance management page
 * Main page for the Plan-Fact budget tool
 */
export default function FinancePage() {
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const getAvailableMonths = useFinanceStore(state => state.getAvailableMonths)
  const initializeWithSeedData = useFinanceStore(state => state.initializeWithSeedData)
  const clearAllData = useFinanceStore(state => state.clearAllData)
  
  const [isClient, setIsClient] = useState(false)

  const currentBudget = getCurrentBudget()
  const availableMonths = getAvailableMonths()

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize with seed data if no budgets exist
  useEffect(() => {
    if (isClient && availableMonths.length === 0) {
      initializeWithSeedData()
    }
  }, [isClient, availableMonths.length, initializeWithSeedData])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="space-y-8">
        <div className="flex mt-4 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Финансовый менеджер</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Загрузка • Управление бюджетом по месяцам
            </p>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="w-32 h-10 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Загрузка...
        </div>
      </div>
    )
  }

  if (availableMonths.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Загрузка бюджета...</h2>
          <p className="text-muted-foreground">Инициализация данных</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl mt-4 sm:text-3xl font-bold">Финансовый менеджер</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {currentBudget?.name} • Управление бюджетом по месяцам
          </p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <MonthSelector />
        </div>
      </div>

      {/* Balance Overview */}
      <BalanceCard />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Budget Table - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">План-Факт по категориям</h2>
            <BudgetTable />
          </div>
        </div>

        {/* Right Panel - Takes 1 column */}
        <div className="space-y-6">
          <IncomeForm />
          <SavingsWidget />
          <ExpenseForm />
        </div>
      </div>

      {/* Transaction History Section */}
      <div>
        <TransactionHistory />
      </div>
    </div>
  )
}
