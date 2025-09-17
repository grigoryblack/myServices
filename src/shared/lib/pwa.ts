"use client"

/**
 * PWA Service Worker registration
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

/**
 * PWA install prompt handler
 */
export function setupPWAInstallPrompt() {
  if (typeof window === 'undefined') return

  let deferredPrompt: any

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e
    
    // Show install button or banner
    console.log('PWA install prompt available')
  })

  // Handle the install button click
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      deferredPrompt = null
    }
  }

  return { installPWA, hasInstallPrompt: () => !!deferredPrompt }
}
