"use client"

import { Moon, Sun, Menu, X } from 'lucide-react'
import { useUIStore } from '@/app/store/useUIStore'
import { Button, InstallPWAButton } from '@/shared/ui'

/**
 * Header widget component
 * Provides theme toggle and other global actions
 */
export function Header() {
  const { theme, toggleTheme, sidebarOpen, mobileMenuOpen, toggleMobileMenu } = useUIStore()

  return (
    <header className={`fixed top-0 right-0 z-20 h-16 bg-background border-b transition-all duration-300 ${
      sidebarOpen ? 'lg:left-64' : 'lg:left-0'
    } left-0`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Mobile menu button - left side */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMobileMenu}
            className="bg-background"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2 ml-auto">
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
