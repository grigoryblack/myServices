"use client"

import { useFinanceStore } from '../model/useFinanceStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Calendar, Calculator } from 'lucide-react'

/**
 * Daily Average Widget
 * Shows average daily spending for days that have already passed in the current month
 */
export function DailyAverageWidget() {
  const { transactions, currentMonth } = useFinanceStore()

  const calculateDailyAverage = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonthStr = now.toISOString().slice(0, 7)
    
    // Only calculate for current month
    if (currentMonth !== currentMonthStr) {
      // For past months, use all days in that month
      const [year, month] = currentMonth.split('-').map(Number)
      const daysInMonth = new Date(year, month, 0).getDate()
      
      const monthTransactions = transactions.filter(t => 
        t.month === currentMonth && t.type === 'expense'
      )
      
      const totalExpenses = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      return {
        averagePerDay: totalExpenses / daysInMonth,
        totalExpenses,
        daysCount: daysInMonth,
        isPastMonth: true
      }
    }
    
    // For current month, only count days that have passed
    const daysPassed = currentDate
    
    if (daysPassed === 0) {
      return {
        averagePerDay: 0,
        totalExpenses: 0,
        daysCount: 0,
        isPastMonth: false
      }
    }

    // Get expense transactions for current month
    const monthTransactions = transactions.filter(t => 
      t.month === currentMonth && t.type === 'expense'
    )

    const totalExpenses = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
    const averagePerDay = totalExpenses / daysPassed

    return {
      averagePerDay,
      totalExpenses,
      daysCount: daysPassed,
      isPastMonth: false
    }
  }

  const { averagePerDay, totalExpenses, daysCount, isPastMonth } = calculateDailyAverage()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ru-RU', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Средний расход в день
        </CardTitle>
        <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(averagePerDay)}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
            <Calendar className="h-3 w-3" />
            <span>
              {isPastMonth 
                ? `За весь ${getMonthName(currentMonth)} (${daysCount} дней)`
                : `За ${daysCount} ${daysCount === 1 ? 'день' : daysCount < 5 ? 'дня' : 'дней'} ${getMonthName(currentMonth)}`
              }
            </span>
          </div>
          
          <div className="text-xs text-blue-500 dark:text-blue-500">
            Всего потрачено: {formatCurrency(totalExpenses)}
          </div>
          
          {!isPastMonth && daysCount > 0 && (
            <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
              {daysCount === 1 ? 'Прошел' : 'Прошло'} {daysCount} {daysCount === 1 ? 'день' : daysCount < 5 ? 'дня' : 'дней'} из месяца
            </div>
          )}
          
          {daysCount === 0 && (
            <div className="text-xs text-blue-500 dark:text-blue-500">
              Первый день месяца
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
