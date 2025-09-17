"use client"

import { Moon, Sun } from 'lucide-react'
import { useUIStore } from '@/app/store/useUIStore'
import { Button } from '@/shared/ui'

/**
 * Header widget component
 * Provides theme toggle and other global actions
 */
export function Header() {
  const { theme, toggleTheme, sidebarOpen } = useUIStore()

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 bg-background border-b transition-all duration-300 ${
      sidebarOpen ? 'lg:left-64' : 'lg:left-0'
    } left-0`}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Переключить тему</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
