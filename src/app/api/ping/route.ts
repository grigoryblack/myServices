import { NextResponse } from 'next/server'

/**
 * Ping endpoint to keep the service alive
 * Returns simple status response
 */
export async function GET() {
  try {
    // Add some light processing to ensure the service is actually working
    const timestamp = new Date().toISOString()
    const uptime = process.uptime()
    
    return NextResponse.json({ 
      status: 'alive', 
      timestamp,
      uptime: Math.floor(uptime),
      message: 'Service is running',
      memory: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Ping endpoint error:', error)
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      message: 'Service error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    return NextResponse.json({ 
      status: 'pong', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString() 
    }, { status: 500 })
  }
}
