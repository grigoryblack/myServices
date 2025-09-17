"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { TOOLS } from '@/shared/config/tools'
import Link from 'next/link'

/**
 * Home page component
 * Dashboard with overview of all available tools
 */
export default function HomePage() {
  const toolsByCategory = TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, typeof TOOLS>)

  const categoryNames = {
    general: 'Общие',
    finance: 'Финансы',
    productivity: 'Продуктивность',
    settings: 'Настройки'
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold">Добро пожаловать в личный портал</h1>
        <p className="text-muted-foreground mt-2">
          Выберите инструмент для работы или перейдите к финансовому менеджеру
        </p>
      </div>

      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <div key={category}>
          {category !== 'general' && (
            <h2 className="text-xl font-semibold mb-4">
              {categoryNames[category as keyof typeof categoryNames]}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.filter(tool => tool.id !== 'dashboard').map((tool) => {
              const Icon = tool.icon
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="h-4 w-4" />
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
