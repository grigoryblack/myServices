"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui'
import { Download } from 'lucide-react'

/**
 * PWA Install Button component
 * Shows install button when PWA can be installed
 */
export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA install prompt triggered')
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA installed')
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      console.log('PWA already installed')
      return
    }

    // iOS Safari doesn't support beforeinstallprompt, show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      console.log('iOS device detected - showing manual install instructions')
      setShowInstallButton(true)
    } else if (isAndroid) {
      console.log('Android device detected, waiting for beforeinstallprompt')
      // Fallback for Android if event doesn't fire
      setTimeout(() => {
        if (!deferredPrompt) {
          console.log('No beforeinstallprompt event on Android, showing fallback')
          setShowInstallButton(true)
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      // Show iOS installation instructions
      alert('Для установки на iOS:\n1. Нажмите кнопку "Поделиться" в Safari\n2. Выберите "На экран «Домой»"\n3. Нажмите "Добавить"')
      return
    }

    if (!deferredPrompt) {
      // Fallback for browsers without beforeinstallprompt
      alert('Для установки:\n• Chrome: Меню → "Установить приложение"\n• Edge: Меню → "Приложения" → "Установить это приложение"')
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  if (!showInstallButton) {
    return null
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Установить приложение
    </Button>
  )
}
