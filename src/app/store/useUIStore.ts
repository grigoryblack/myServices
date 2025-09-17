"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global UI state store
 * Manages sidebar visibility, mobile menu state, and theme
 */
interface UIState {
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  theme: 'light' | 'dark'
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobileMenu: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      theme: 'light',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ 
        sidebarOpen: state.sidebarOpen, 
        theme: state.theme 
      }),
    }
  )
)
