"use client"

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useFinanceStore } from '../model/useFinanceStore'

/**
 * MonthSelector component
 * Allows navigation between different monthly budgets
 */
export function MonthSelector() {
  const currentMonth = useFinanceStore(state => state.currentMonth)
  const setCurrentMonth = useFinanceStore(state => state.setCurrentMonth)
  const getAvailableMonths = useFinanceStore(state => state.getAvailableMonths)
  const createBudget = useFinanceStore(state => state.createBudget)

  const availableMonths = getAvailableMonths()
  const currentIndex = availableMonths.indexOf(currentMonth)

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-')
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`
  }

  const goToPreviousMonth = () => {
    if (currentIndex > 0) {
      setCurrentMonth(availableMonths[currentIndex - 1])
    }
  }

  const goToNextMonth = () => {
    if (currentIndex < availableMonths.length - 1) {
      setCurrentMonth(availableMonths[currentIndex + 1])
    } else {
      // Create next month budget
      const nextMonth = new Date(currentMonth + '-01')
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextMonthStr = nextMonth.toISOString().slice(0, 7)
      createBudget('Семейный бюджет', nextMonthStr, 150000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousMonth}
        disabled={currentIndex <= 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md min-w-[200px] justify-center">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">
          {formatMonthDisplay(currentMonth)}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
