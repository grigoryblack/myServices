"use client"

import { useState } from 'react'
import { Plus } from 'lucide-react'
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

/**
 * ExpenseForm component
 * Form for adding actual expenses to budget categories
 */
export function ExpenseForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const addTransaction = useFinanceStore(state => state.addTransaction)

  const currentBudget = getCurrentBudget()
  if (!currentBudget) return null

  const allCategories = currentBudget?.categories.filter(cat => cat.type === 'expense') || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCategoryId || !amount || !description) return

    addTransaction({
      categoryId: selectedCategoryId,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      type: 'expense'
    })

    // Reset form
    setSelectedCategoryId('')
    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setIsOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Добавить расход
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Добавить</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый расход</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Категория</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {allCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.categoryType === 'fixed' ? 'Фиксированный' : 'Переменный'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Сумма</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Описание расхода"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Дата</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Добавить расход
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
        <p className="text-sm text-muted-foreground">
          Добавляйте фактические расходы для отслеживания выполнения бюджета
        </p>
      </CardContent>
    </Card>
  )
}
