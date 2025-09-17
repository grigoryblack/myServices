import { NextResponse } from 'next/server'

/**
 * Ping endpoint to keep the service alive
 * Returns simple status response
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    message: 'Service is running'
  })
}

export async function POST() {
  return NextResponse.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString() 
  })
}
