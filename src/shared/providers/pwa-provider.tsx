"use client"

import { useEffect } from 'react'
import { registerServiceWorker } from '@/shared/lib/pwa'

/**
 * PWA Provider component
 * Registers service worker and handles PWA functionality
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on client side
    registerServiceWorker()
  }, [])

  return <>{children}</>
}
