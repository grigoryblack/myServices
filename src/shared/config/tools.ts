import { LucideIcon, Calculator, TrendingUp, Settings, Home } from 'lucide-react'

/**
 * Configuration for available tools in the personal portal
 * This config drives the sidebar navigation and routing
 */
export interface Tool {
  id: string
  name: string
  description: string
  icon: LucideIcon
  href: string
  category: 'finance' | 'productivity' | 'settings' | 'general'
}

export const TOOLS: Tool[] = [
  {
    id: 'finance',
    name: 'Финансовый менеджер',
    description: 'План-Факт бюджет и управление расходами',
    icon: Calculator,
    href: '/tools/finance',
    category: 'finance'
  },
  {
    id: 'analytics',
    name: 'Аналитика',
    description: 'Анализ трендов и статистика (скоро)',
    icon: TrendingUp,
    href: '/tools/analytics',
    category: 'finance'
  },
  {
    id: 'settings',
    name: 'Настройки',
    description: 'Конфигурация приложения',
    icon: Settings,
    href: '/tools/settings',
    category: 'settings'
  }
]

export const getToolById = (id: string): Tool | undefined => {
  return TOOLS.find(tool => tool.id === id)
}

export const getToolsByCategory = (category: Tool['category']): Tool[] => {
  return TOOLS.filter(tool => tool.category === category)
}
