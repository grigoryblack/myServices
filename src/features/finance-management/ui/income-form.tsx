"use client"

import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/shared/ui'
import { useFinanceStore } from '../model/useFinanceStore'
import { formatCurrency } from '@/shared/lib/utils'

/**
 * IncomeForm component
 * Form for updating monthly income with automatic redistribution
 */
export function IncomeForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [income, setIncome] = useState('')

  const currentMonth = useFinanceStore(state => state.currentMonth)
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const updateBudgetIncome = useFinanceStore(state => state.updateBudgetIncome)

  const currentBudget = getCurrentBudget()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!income || !currentMonth) return

    const incomeAmount = parseFloat(income)
    if (isNaN(incomeAmount) || incomeAmount < 0) return

    updateBudgetIncome(currentMonth, incomeAmount)

    // Reset form
    setIncome('')
    setIsOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Доходы
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Изменить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Изменить доход</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Общий доход за месяц</label>
                  <Input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder={currentBudget?.totalIncome.toString() || "0"}
                    min="0"
                    step="1000"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    При изменении дохода переменные расходы будут пересчитаны автоматически
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Обновить доход
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(currentBudget?.totalIncome || 0)}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Общий доход за месяц
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          <p>• Фиксированные расходы не изменяются</p>
          <p>• Переменные расходы пересчитываются пропорционально</p>
          <p>• Накопления остаются неизменными</p>
        </div>
      </CardContent>
    </Card>
  )
}
