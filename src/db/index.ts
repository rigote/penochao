import { drizzle } from 'drizzle-orm/neon-http'
import { neon, neonConfig } from '@neondatabase/serverless'
import * as schema from './schema/auth'

neonConfig.fetchConnectionCache = true

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

// Types
export type DbClient = typeof db 