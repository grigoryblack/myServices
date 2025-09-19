import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/database'

/**
 * Database initialization API endpoint
 * Tests database connection and initializes tables if needed
 */
export async function GET() {
  try {
    const isConnected = await testConnection()
    
    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database connected successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Database connection failed' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
