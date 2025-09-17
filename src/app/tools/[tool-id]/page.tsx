"use client"

import { notFound } from 'next/navigation'
import { getToolById } from '@/shared/config/tools'

/**
 * Dynamic tool page
 * Template for future tools that will be added to the portal
 */
export default function ToolPage({ params }: { params: { 'tool-id': string } }) {
  const tool = getToolById(params['tool-id'])

  if (!tool) {
    notFound()
  }

  const Icon = tool.icon

  return (
    <div className="space-y-8">
      <div className="text-center py-16">
        <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {tool.description}
        </p>
        <div className="bg-muted/50 rounded-lg p-8 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold mb-2">В разработке</h2>
          <p className="text-sm text-muted-foreground">
            Этот инструмент находится в разработке. Скоро здесь появится полезный функционал!
          </p>
        </div>
      </div>
    </div>
  )
}
