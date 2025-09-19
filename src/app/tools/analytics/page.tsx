"use client"

import { useEffect, useState } from 'react'
import { ChartPanel, MonthSelector, DailyAverageWidget } from '@/features/finance-management'
import { useFinanceStore } from '@/features/finance-management/model/useFinanceStore'

/**
 * Analytics page
 * Displays financial analytics and charts
 */
export default function AnalyticsPage() {
  const getAvailableMonths = useFinanceStore(state => state.getAvailableMonths)
  const initializeWithSeedData = useFinanceStore(state => state.initializeWithSeedData)
  
  const [isClient, setIsClient] = useState(false)
  const availableMonths = getAvailableMonths()

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize with seed data if no budgets exist
  useEffect(() => {
    if (isClient && availableMonths.length === 0) {
      initializeWithSeedData()
    }
  }, [isClient, availableMonths.length, initializeWithSeedData])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl mt-4 sm:text-3xl font-bold">Аналитика</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Загрузка • Графики и статистика по финансам
            </p>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="w-32 h-10 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Загрузка...
        </div>
      </div>
    )
  }

  if (availableMonths.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Нет данных для аналитики</h2>
          <p className="text-muted-foreground">Создайте бюджет в разделе "Финансы" для просмотра аналитики</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl mt-4 sm:text-3xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Графики и статистика по финансам
          </p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <MonthSelector />
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1">
          <DailyAverageWidget />
        </div>
      </div>

      {/* Charts */}
      <ChartPanel />
    </div>
  )
}
