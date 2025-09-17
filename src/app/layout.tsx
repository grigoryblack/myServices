import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar, Header } from '@/widgets'
import { ThemeProvider } from '@/shared/providers'
import { PWAProvider } from '@/shared/providers'
import '@/lib/self-pinger'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Личный портал',
  description: 'Персональный портал с инструментами для управления финансами и не только',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Финансы',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
}

/**
 * Root layout component
 * Provides the main application structure with sidebar and header
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <PWAProvider>
          <ThemeProvider>
            <div className="min-h-screen bg-background">
              <Sidebar />
              <Header />
              <main className="lg:ml-64 pt-16 p-6">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  )
}
