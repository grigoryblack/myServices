"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/utils'
import { useFinanceStore } from '../model/useFinanceStore'
import { BudgetCategory } from '@/entities'
import { ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react'

/**
 * BudgetTable component
 * Displays Plan-Fact-Deviation table for budget categories
 */
export function BudgetTable() {
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const getCategoryActualAmount = useFinanceStore(state => state.getCategoryActualAmount)
  const updateCategory = useFinanceStore(state => state.updateCategory)
  const currentMonth = useFinanceStore(state => state.currentMonth)
  const budgets = useFinanceStore(state => state.budgets) // Add this to trigger re-render
  
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'planned' | 'actual' | 'deviation' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterType, setFilterType] = useState<'all' | 'fixed' | 'variable'>('all')
  
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

  const handleSort = (column: 'name' | 'planned' | 'actual' | 'deviation' | 'type') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (column: 'name' | 'planned' | 'actual' | 'deviation' | 'type') => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Filter and sort categories - include all categories (expense and savings)
  let allCategories = currentBudget.categories
    .filter(cat => cat.type === 'expense' || cat.type === 'savings')
    .sort((a, b) => {
      // Sort by category type first (fixed, then variable, then savings)
      const typeOrder = { fixed: 0, variable: 1, savings: 2 }
      const aOrder = typeOrder[a.categoryType as keyof typeof typeOrder] ?? 3
      const bOrder = typeOrder[b.categoryType as keyof typeof typeOrder] ?? 3
      
      if (aOrder !== bOrder) return aOrder - bOrder
      
      // Then sort by name
      return a.name.localeCompare(b.name)
    })

  // Apply filter
  if (filterType !== 'all') {
    allCategories = allCategories.filter(cat => 
      filterType === 'fixed' ? cat.categoryType === 'fixed' : cat.categoryType === 'variable'
    )
  }

  // Apply sort
  allCategories = allCategories.sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'planned':
        aValue = a.plannedAmount
        bValue = b.plannedAmount
        break
      case 'actual':
        aValue = getCategoryActualAmount(a.id)
        bValue = getCategoryActualAmount(b.id)
        break
      case 'deviation':
        aValue = getCategoryActualAmount(a.id) - a.plannedAmount
        bValue = getCategoryActualAmount(b.id) - b.plannedAmount
        break
      case 'type':
        aValue = a.categoryType
        bValue = b.categoryType
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const getBudgetSummary = useFinanceStore(state => state.getBudgetSummary)
  const summary = getBudgetSummary()

  const getDeviationColor = (deviation: number) => {
    if (deviation > 0) return 'text-red-600' // Превышение плана
    if (deviation < 0) return 'text-green-600' // Экономия
    return 'text-muted-foreground' // Точно по плану
  }

  const getDeviationText = (deviation: number) => {
    if (deviation === 0) return '0'
    if (deviation > 0) return `+${formatCurrency(deviation)}`
    return `${formatCurrency(Math.abs(deviation))}`
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(value: 'all' | 'fixed' | 'variable') => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="fixed">Фиксированные</SelectItem>
              <SelectItem value="variable">Переменные</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Показано: {allCategories.length} категорий
        </div>
      </div>

      <div className="rounded-md border">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Категория
                    {getSortIcon('name')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort('planned')}
                >
                  <div className="flex items-center gap-1">
                    План
                    {getSortIcon('planned')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort('actual')}
                >
                  <div className="flex items-center gap-1">
                    Факт
                    {getSortIcon('actual')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort('deviation')}
                >
                  <div className="flex items-center gap-1">
                    Отклонение
                    {getSortIcon('deviation')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {allCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-lg">📊</div>
                  <div>Нет категорий для отображения</div>
                  <div className="text-sm">Добавьте категории через менеджер категорий</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            allCategories.map((category: BudgetCategory) => {
            const actualAmount = getCategoryActualAmount(category.id)
            const deviation = actualAmount - category.plannedAmount
            const deviationPercent = category.plannedAmount > 0 
              ? Math.abs((deviation / category.plannedAmount) * 100).toFixed(1)
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
          }))}
        </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
