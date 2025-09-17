"use client"

import React, { useState } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib/utils'
import { useFinanceStore } from '../model/useFinanceStore'

/**
 * SavingsWidget component (Копилка)
 * Shows aggregated savings data across all months
 */
export function SavingsWidget() {
  const getSavingsSummary = useFinanceStore(state => state.getSavingsSummary)
  const setSavingsGoal = useFinanceStore(state => state.setSavingsGoal)
  const setSavingsAmount = useFinanceStore(state => state.setSavingsAmount)
  const summary = getSavingsSummary()
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditAmountOpen, setIsEditAmountOpen] = useState(false)
  const [editGoal, setEditGoal] = useState(summary.goal.toString())
  const [editDescription, setEditDescription] = useState(summary.goalDescription)
  const [editAmount, setEditAmount] = useState(summary.totalActualSavings.toString())

  const savingsProgress = summary.goal > 0 
    ? (summary.totalActualSavings / summary.goal) * 100 
    : 0

  const isOnTrack = savingsProgress >= 90
  const progressColor = isOnTrack ? 'text-green-600' : savingsProgress >= 70 ? 'text-yellow-600' : 'text-red-600'
  const progressIcon = isOnTrack ? TrendingUp : TrendingDown

  const handleSaveGoal = () => {
    const goalAmount = parseFloat(editGoal)
    if (!isNaN(goalAmount) && goalAmount > 0) {
      setSavingsGoal(goalAmount, editDescription)
      setIsEditDialogOpen(false)
    }
  }

  const handleCancel = () => {
    setEditGoal(summary.goal.toString())
    setEditDescription(summary.goalDescription)
    setIsEditDialogOpen(false)
  }

  const handleSaveAmount = () => {
    const amount = parseFloat(editAmount)
    if (!isNaN(amount) && amount >= 0) {
      setSavingsAmount(amount)
      setIsEditAmountOpen(false)
    }
  }

  const handleCancelAmount = () => {
    setEditAmount(summary.totalActualSavings.toString())
    setIsEditAmountOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Копилка</CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройка цели накоплений</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Цель (₽)</label>
                  <Input
                    type="number"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="Введите сумму цели"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="На что копите?"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveGoal} className="flex-1">
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <PiggyBank className="h-4 w-4 text-green-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Savings */}
        <div>
          <Dialog open={isEditAmountOpen} onOpenChange={setIsEditAmountOpen}>
            <DialogTrigger asChild>
              <div className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalActualSavings)}
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Изменить сумму накоплений</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Текущая сумма (₽)</label>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Введите текущую сумму накоплений"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveAmount} className="flex-1">
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={handleCancelAmount} className="flex-1">
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground">
            Цель: {formatCurrency(summary.goal)} • {summary.goalDescription}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Прогресс к цели</span>
            <div className={`flex items-center gap-1 ${progressColor}`}>
              {React.createElement(progressIcon, { className: "h-3 w-3" })}
              <span className="text-sm font-medium">
                {savingsProgress.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isOnTrack ? 'bg-green-600' : savingsProgress >= 70 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.min(savingsProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Monthly Breakdown */}
        {summary.savingsByMonth.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">По месяцам</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {summary.savingsByMonth.slice(-3).map(({ month, planned, actual }) => {
                const [year, monthNum] = month.split('-')
                const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
                const monthDisplay = `${monthNames[parseInt(monthNum) - 1]} ${year}`
                
                return (
                  <div key={month} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{monthDisplay}</span>
                    <div className="flex items-center gap-2">
                      <span className={actual >= planned ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(actual)}
                      </span>
                      <span className="text-muted-foreground">
                        / {formatCurrency(planned)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
