"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/utils'
import { useFinanceStore } from '../model/useFinanceStore'
import { BudgetCategory } from '@/entities'

/**
 * BudgetTable component
 * Displays Plan-Fact-Deviation table for budget categories
 */
export function BudgetTable() {
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const getCategoryActualAmount = useFinanceStore(state => state.getCategoryActualAmount)
  const updateCategory = useFinanceStore(state => state.updateCategory)
  const currentMonth = useFinanceStore(state => state.currentMonth)
  
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  
  const currentBudget = getCurrentBudget()

  if (!currentBudget) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет данных о бюджете для текущего месяца
      </div>
    )
  }

  const handleCellClick = (categoryId: string, currentValue: number) => {
    setEditingCell(categoryId)
    setEditValue(currentValue.toString())
  }

  const handleCellSave = (categoryId: string) => {
    const newValue = parseFloat(editValue)
    if (!isNaN(newValue) && newValue >= 0) {
      updateCategory(currentMonth, categoryId, { plannedAmount: newValue })
    }
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      handleCellSave(categoryId)
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  const expenseCategories = currentBudget.categories.filter(cat => cat.type === 'expense')
  const getBudgetSummary = useFinanceStore(state => state.getBudgetSummary)
  const summary = getBudgetSummary()

  const getDeviationColor = (deviation: number) => {
    if (deviation > 0) return 'text-red-600' // Превышение плана
    if (deviation < 0) return 'text-green-600' // Экономия
    return 'text-muted-foreground' // Точно по плану
  }

  const getDeviationText = (deviation: number) => {
    if (deviation === 0) return '0'
    const sign = deviation > 0 ? '+' : ''
    return `${sign}${formatCurrency(deviation)}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Категория</TableHead>
            <TableHead className="text-right">План</TableHead>
            <TableHead className="text-right">Факт</TableHead>
            <TableHead className="text-right">Отклонение</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenseCategories.map((category: BudgetCategory) => {
            const actualAmount = getCategoryActualAmount(category.id)
            const deviation = actualAmount - category.plannedAmount
            const deviationPercent = category.plannedAmount > 0 
              ? ((deviation / category.plannedAmount) * 100).toFixed(1)
              : '0'

            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.categoryType === 'fixed' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {category.categoryType === 'fixed' ? 'Фикс.' : 'Перем.'}
                    </span>
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingCell === category.id ? (
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellSave(category.id)}
                      onKeyDown={(e) => handleKeyDown(e, category.id)}
                      className="w-24 text-right"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                      onClick={() => handleCellClick(category.id, category.plannedAmount)}
                    >
                      {formatCurrency(category.plannedAmount)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {category.categoryType === 'fixed' ? (
                    <span className="text-muted-foreground italic">
                      {formatCurrency(actualAmount)} (авто)
                    </span>
                  ) : category.type === 'savings' ? (
                    <span className="text-muted-foreground italic">
                      {formatCurrency(actualAmount)} (авто)
                    </span>
                  ) : (
                    formatCurrency(actualAmount)
                  )}
                </TableCell>
                <TableCell className={`text-right ${getDeviationColor(deviation)}`}>
                  {getDeviationText(deviation)}
                </TableCell>
                <TableCell className={`text-right ${getDeviationColor(deviation)}`}>
                  {deviationPercent}%
                </TableCell>
              </TableRow>
            )
          })}
          {/* Savings row - automatic remainder */}
          <TableRow className="bg-muted/50">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  Авто
                </span>
                Накопления (остаток)
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-muted-foreground italic">
                {formatCurrency(summary.totalPlannedSavings)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="text-muted-foreground italic">
                {formatCurrency(summary.totalActualSavings)}
              </span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              —
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              —
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
