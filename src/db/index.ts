import { drizzle } from 'drizzle-orm/neon-http'
import { neon, neonConfig } from '@neondatabase/serverless'
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import * as authSchema from './schema/auth'
import * as financeSchema from './schema/finance'
import * as aiLogsSchema from './schema/ai-logs'
import * as couponsSchema from './schema/coupons'
import * as stripeSchema from './schema/stripe'

neonConfig.fetchConnectionCache = true

const schema = { ...authSchema, ...financeSchema, ...aiLogsSchema, ...couponsSchema, ...stripeSchema }

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

// Types
export type DbClient = typeof db

// Re-export schemas
export { authSchema, financeSchema, aiLogsSchema, couponsSchema, stripeSchema } 
