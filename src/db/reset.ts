
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "@/db"
import { sql } from "drizzle-orm"

async function reset() {
  console.log("Dropping all tables...")
  await db.execute(sql`DROP SCHEMA public CASCADE`)
  await db.execute(sql`CREATE SCHEMA public`)
  // Permissions are handled by default user ownership
  console.log("All tables dropped.")
  process.exit(0)
}

reset().catch((err) => {
  console.error(err)
  process.exit(1)
})
