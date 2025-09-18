/**
 * Self-pinger utility to keep Render service alive
 * Pings the service every 14 minutes to prevent sleep
 */

const PING_INTERVAL = 40 * 1000 // 40 seconds in milliseconds
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${this.baseUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SelfPinger/1.0',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        console.log(`🏓 Ping successful at ${data.timestamp}`)
      } else {
        throw new Error(`Ping failed with status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️ Ping failed (attempt ${retries + 1}):`, error)
      
      if (retries < MAX_RETRIES) {
        // Exponential backoff: 30s, 60s, 120s
        const delay = 30000 * Math.pow(2, retries)
        setTimeout(() => this.ping(retries + 1), delay)
      } else {
        console.error('❌ Max ping retries exceeded')
        // Restart pinger after 5 minutes if all retries failed
        setTimeout(() => {
          console.log('🔄 Restarting pinger after failure...')
          this.ping()
        }, 5 * 60 * 1000)
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
