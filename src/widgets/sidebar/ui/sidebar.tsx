"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { TOOLS } from '@/shared/config/tools'
import { useUIStore } from '@/app/store/useUIStore'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

/**
 * Sidebar widget component
 * Provides navigation for all tools in the personal portal
 * Responsive design with mobile hamburger menu
 */
export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, mobileMenuOpen, toggleSidebar, toggleMobileMenu } = useUIStore()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-background"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 ease-in-out",
          // Desktop behavior
          "lg:translate-x-0",
          sidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full",
          // Mobile behavior
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Личный портал</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden lg:flex"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {TOOLS.map((tool) => {
                const isActive = pathname === tool.href
                const Icon = tool.icon

                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={() => {
                      if (mobileMenuOpen) {
                        toggleMobileMenu()
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tool.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground">
              Версия 1.0.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
