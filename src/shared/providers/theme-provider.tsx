"use client"

import { useEffect } from 'react'
import { useUIStore } from '@/app/store/useUIStore'

/**
 * Theme provider component
 * Applies theme class to HTML element based on store state
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore(state => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
}
