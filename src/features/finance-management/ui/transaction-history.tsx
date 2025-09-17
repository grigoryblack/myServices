"use client"

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/utils'
import { useFinanceStore } from '../model/useFinanceStore'
import { Transaction, BudgetCategory } from '@/entities'
import { Pencil, Trash2, Calendar } from 'lucide-react'

/**
 * TransactionHistory component
 * Displays all transactions with edit and delete functionality
 */
export function TransactionHistory() {
  const transactions = useFinanceStore(state => state.transactions)
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const updateTransaction = useFinanceStore(state => state.updateTransaction)
  const removeTransaction = useFinanceStore(state => state.removeTransaction)
  const currentMonth = useFinanceStore(state => state.currentMonth)
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [filterMonth, setFilterMonth] = useState(currentMonth)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const currentBudget = getCurrentBudget()

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Filter transactions by selected month and get fresh data
  const filteredTransactions = transactions
    .filter(t => t.month === filterMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Update filter month when current month changes
  useEffect(() => {
    setFilterMonth(currentMonth)
  }, [currentMonth])

  const getCategoryName = (categoryId: string): string => {
    if (!currentBudget) return 'Неизвестная категория'
    const category = currentBudget.categories.find(cat => cat.id === categoryId)
    return category?.name || 'Неизвестная категория'
  }

  const getCategoryType = (categoryId: string): 'fixed' | 'variable' | null => {
    if (!currentBudget) return null
    const category = currentBudget.categories.find(cat => cat.id === categoryId)
    return category?.categoryType || null
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditAmount(transaction.amount.toString())
    setEditDescription(transaction.description)
    setEditDate(new Date(transaction.date).toISOString().split('T')[0])
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingTransaction) return
    
    const updates = {
      amount: parseFloat(editAmount),
      description: editDescription,
      date: new Date(editDate)
    }
    
    updateTransaction(editingTransaction.id, updates)
    setEditingTransaction(null)
    setEditAmount('')
    setEditDescription('')
    setEditDate('')
    setIsEditDialogOpen(false)
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setEditAmount('')
    setEditDescription('')
    setEditDate('')
    setIsEditDialogOpen(false)
  }

  const handleDelete = (transactionId: string) => {
    if (confirm('Удалить эту транзакцию?')) {
      removeTransaction(transactionId)
    }
  }

  const availableMonths = useFinanceStore(state => state.getAvailableMonths())

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">История транзакций</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="px-3 py-1 border rounded-md text-sm w-24 bg-muted animate-pulse"></div>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Загрузка...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">История транзакций</h3>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Нет транзакций за выбранный месяц
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="text-center">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const categoryType = getCategoryType(transaction.categoryId)
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {categoryType && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            categoryType === 'fixed' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {categoryType === 'fixed' ? 'Фикс.' : 'Перем.'}
                          </span>
                        )}
                        {getCategoryName(transaction.categoryId)}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Dialog open={isEditDialogOpen && editingTransaction?.id === transaction.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Редактировать транзакцию</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Сумма</label>
                                <Input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  placeholder="Введите сумму"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Описание</label>
                                <Input
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Введите описание"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Дата</label>
                                <Input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={handleCancelEdit}>
                                  Отмена
                                </Button>
                                <Button onClick={handleSaveEdit}>
                                  Сохранить
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
