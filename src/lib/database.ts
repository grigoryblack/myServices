import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Database connection configuration
 * Supports both local development and production environments
 */

// Parse database URL
function parseDatabaseUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 5432,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1), // Remove leading slash
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
}

// Database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/myservice_dev'

// Create connection pool
const pool = new Pool(parseDatabaseUrl(DATABASE_URL))

// Create Drizzle instance
export const db = drizzle(pool, { schema })

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}
