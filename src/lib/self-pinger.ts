/**
 * Self-pinger utility to keep Render service alive
 * Pings the service every 14 minutes to prevent sleep
 */

const PING_INTERVAL = 14 * 60 * 1000 // 14 minutes in milliseconds
const MAX_RETRIES = 3

class SelfPinger {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private baseUrl: string

  constructor() {
    // Get the base URL from environment or current location
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : '')
  }

  start() {
    if (this.isRunning || !this.baseUrl) return

    this.isRunning = true
    console.log('🏓 Self-pinger started - keeping service alive')

    // Ping immediately
    this.ping()

    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping()
    }, PING_INTERVAL)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🛑 Self-pinger stopped')
  }

  private async ping(retries = 0): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`🏓 Ping successful at ${data.timestamp}`)
      } else {
        throw new Error(`Ping failed with status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️ Ping failed (attempt ${retries + 1}):`, error)
      
      if (retries < MAX_RETRIES) {
        // Retry after 30 seconds
        setTimeout(() => this.ping(retries + 1), 30000)
      } else {
        console.error('❌ Max ping retries exceeded')
      }
    }
  }
}

// Create singleton instance
export const selfPinger = new SelfPinger()

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => selfPinger.start(), 5000) // Start after 5 seconds
    })
  } else {
    setTimeout(() => selfPinger.start(), 5000)
  }

  // Stop when page unloads
  window.addEventListener('beforeunload', () => {
    selfPinger.stop()
  })
}
