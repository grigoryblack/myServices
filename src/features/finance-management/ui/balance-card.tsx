"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/utils'
import { useFinanceStore } from '../model/useFinanceStore'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

/**
 * BalanceCard component
 * Displays budget summary with income, expenses, and balance
 */
export function BalanceCard() {
  const getBudgetSummary = useFinanceStore(state => state.getBudgetSummary)
  const currentMonth = useFinanceStore(state => state.currentMonth)
  const budgets = useFinanceStore(state => state.budgets)
  const summary = getBudgetSummary(currentMonth)

  const balanceColor = summary.actualBalance >= 0 ? 'text-green-600' : 'text-red-600'
  const balanceIcon = summary.actualBalance >= 0 ? TrendingUp : TrendingDown

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Доходы</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Fixed Expenses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Фиксированные</CardTitle>
          <TrendingDown className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalFixedExpenses)}
          </div>
        </CardContent>
      </Card>

      {/* Variable Expenses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Переменные</CardTitle>
          <TrendingDown className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(summary.totalVariableExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            Доступно: {formatCurrency(summary.availableForVariable)}
          </p>
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Баланс</CardTitle>
          {React.createElement(balanceIcon, { className: `h-4 w-4 ${balanceColor}` })}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balanceColor}`}>
            {formatCurrency(summary.actualBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            План: {formatCurrency(summary.plannedBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
