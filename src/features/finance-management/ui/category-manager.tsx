"use client"

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { useFinanceStore } from '../model/useFinanceStore'
import { BudgetCategory } from '@/entities'

interface CategoryManagerProps {
  month: string
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#dc2626', '#991b1b', '#7c2d12'
]

export function CategoryManager({ month }: CategoryManagerProps) {
  const { budgets, addCategory, removeCategory } = useFinanceStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    plannedAmount: '',
    type: 'expense' as 'expense' | 'income' | 'savings',
    categoryType: 'variable' as 'fixed' | 'variable',
    proportion: '',
    color: CATEGORY_COLORS[0]
  })

  const budget = budgets[month]
  if (!budget) return null

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.plannedAmount) return

    const categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'> = {
      name: newCategory.name,
      plannedAmount: parseFloat(newCategory.plannedAmount),
      type: newCategory.type,
      categoryType: newCategory.categoryType,
      color: newCategory.color,
      ...(newCategory.categoryType === 'variable' && newCategory.proportion 
        ? { proportion: parseFloat(newCategory.proportion) / 100 }
        : {}
      )
    }

    addCategory(month, categoryData)
    
    // Reset form
    setNewCategory({
      name: '',
      plannedAmount: '',
      type: 'expense',
      categoryType: 'variable',
      proportion: '',
      color: CATEGORY_COLORS[0]
    })
    setIsAddDialogOpen(false)
  }

  const handleRemoveCategory = (categoryId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию? Все связанные транзакции также будут удалены.')) {
      removeCategory(month, categoryId)
    }
  }

  const canDeleteCategory = (category: BudgetCategory) => {
    // Don't allow deleting essential fixed categories
    const essentialCategories = ['Аренда', 'Коммунальные услуги', 'Кредит']
    return !essentialCategories.includes(category.name)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Управление категориями</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить категорию
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новая категория</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Название категории"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Тип</Label>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value: 'expense' | 'income' | 'savings') => 
                      setNewCategory(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Расход</SelectItem>
                      <SelectItem value="income">Доход</SelectItem>
                      <SelectItem value="savings">Накопления</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="categoryType">Категория</Label>
                  <Select
                    value={newCategory.categoryType}
                    onValueChange={(value: 'fixed' | 'variable') => 
                      setNewCategory(prev => ({ ...prev, categoryType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Фиксированный</SelectItem>
                      <SelectItem value="variable">Переменный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Сумма (₽)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newCategory.plannedAmount}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, plannedAmount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                {newCategory.categoryType === 'variable' && (
                  <div>
                    <Label htmlFor="proportion">Доля (%)</Label>
                    <Input
                      id="proportion"
                      type="number"
                      value={newCategory.proportion}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, proportion: e.target.value }))}
                      placeholder="15"
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Цвет</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${
                        newCategory.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddCategory} className="flex-1">
                  Добавить
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {budget.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {category.categoryType === 'fixed' ? 'Фиксированный' : 'Переменный'} • 
                    {category.type === 'expense' ? 'Расход' : category.type === 'income' ? 'Доход' : 'Накопления'} • 
                    {category.plannedAmount.toLocaleString('ru-RU')} ₽
                    {category.categoryType === 'variable' && category.proportion && 
                      ` • ${(category.proportion * 100).toFixed(0)}%`
                    }
                  </div>
                </div>
              </div>
              
              {canDeleteCategory(category) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCategory(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
