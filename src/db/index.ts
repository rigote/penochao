import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import * as authSchema from './schema/auth'
import * as financeSchema from './schema/finance'
import * as aiLogsSchema from './schema/ai-logs'
import * as couponsSchema from './schema/coupons'
import * as stripeSchema from './schema/stripe'

const schema = { ...authSchema, ...financeSchema, ...aiLogsSchema, ...couponsSchema, ...stripeSchema }

const sql = neon(process.env.DATABASE_URL!)

// Backward-compatibility guard for environments that haven't applied the
// `0005_add_pro_trial_used_at` migration yet.
await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pro_trial_used_at" timestamp`

export const db = drizzle(sql, { schema })

// Types
export type DbClient = typeof db

// Re-export schemas
export { authSchema, financeSchema, aiLogsSchema, couponsSchema, stripeSchema } 
