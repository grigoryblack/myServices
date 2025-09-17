"use client"

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { useFinanceStore } from '../model/useFinanceStore'
import { formatCurrency } from '@/shared/lib/utils'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

/**
 * ChartPanel component
 * Displays pie chart for expense distribution and bar chart for trends
 */
export function ChartPanel() {
  const getCurrentBudget = useFinanceStore(state => state.getCurrentBudget)
  const getCategoryActualAmount = useFinanceStore(state => state.getCategoryActualAmount)

  const currentBudget = getCurrentBudget()

  if (!currentBudget) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет данных для отображения
      </div>
    )
  }

  const expenseCategories = currentBudget.categories.filter(cat => cat.type === 'expense')
  
  // Pie chart data for expense distribution
  const pieData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [
      {
        data: expenseCategories.map(cat => getCategoryActualAmount(cat.id)),
        backgroundColor: expenseCategories.map(cat => cat.color || '#8b5cf6'),
        borderColor: expenseCategories.map(cat => cat.color || '#8b5cf6'),
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Распределение расходов по категориям',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed
            return `${context.label}: ${formatCurrency(value)}`
          }
        }
      }
    },
  }

  // Bar chart data for plan vs actual comparison
  const barData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [
      {
        label: 'План',
        data: expenseCategories.map(cat => cat.plannedAmount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Факт',
        data: expenseCategories.map(cat => getCategoryActualAmount(cat.id)),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'План vs Факт по категориям',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y
            return `${context.dataset.label}: ${formatCurrency(value)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value)
          }
        }
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Структура расходов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Сравнение плана и факта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={barData} options={barOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
