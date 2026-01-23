/**
 * Migration script to encrypt existing unencrypted data in the database
 * 
 * This script:
 * 1. Reads all expenses, incomes, and invoices
 * 2. Checks if they are encrypted (by trying to decrypt)
 * 3. Encrypts unencrypted data
 * 4. Updates the database
 * 
 * Run with: pnpm tsx scripts/encrypt-existing-data.ts
 */

import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"

// Load environment variables FIRST before importing modules that depend on them
dotenv.config({ path: ".env.local" })

import { db } from "../src/db"
import { expenses, incomes, invoices } from "../src/db/schema/finance"
import { encrypt, decrypt, encryptNumber, decryptNumber, encryptJSON, decryptJSON } from "../src/lib/encryption"
import { eq } from "drizzle-orm"
import { neon } from "@neondatabase/serverless"

interface MigrationStats {
  expenses: { total: number; encrypted: number; errors: number }
  incomes: { total: number; encrypted: number; errors: number }
  invoices: { total: number; encrypted: number; errors: number }
}

function isEncrypted(text: string): boolean {
  if (!text) return true // Empty strings are considered "encrypted" (no action needed)
  
  // Encrypted data has format: base64(IV):base64(authTag):base64(ciphertext)
  if (!text.includes(":")) {
    return false
  }
  
  const parts = text.split(":")
  if (parts.length !== 3) {
    return false
  }
  
  // Try to decrypt to verify
  try {
    const decrypted = decrypt(text)
    // If decryption succeeds and result is different, it was encrypted
    return decrypted !== text
  } catch {
    return false
  }
}

async function migrateExpenses(): Promise<{ encrypted: number; errors: number }> {
  console.log("Migrating expenses...")
  
  const allExpenses = await db.select().from(expenses)
  let encrypted = 0
  let errors = 0

  for (const expense of allExpenses) {
    try {
      let needsUpdate = false
      const updateData: Partial<typeof expense> = {}

      // Check description
      if (!isEncrypted(expense.description)) {
        updateData.description = encrypt(expense.description)
        needsUpdate = true
      }

      // Check amount
      try {
        // Try to decrypt - if it fails, it's not encrypted
        decryptNumber(expense.amount)
        // If we get here, it was already encrypted (or is a valid number string)
        // Check if it looks encrypted
        if (!isEncrypted(expense.amount)) {
          updateData.amount = encryptNumber(expense.amount)
          needsUpdate = true
        }
      } catch {
        // Not encrypted, encrypt it
        updateData.amount = encryptNumber(expense.amount)
        needsUpdate = true
      }

      if (needsUpdate) {
        // Use raw SQL to bypass Drizzle type checking since we changed schema
        const sqlClient = neon(process.env.DATABASE_URL!)
        
        if (updateData.description && updateData.amount) {
          await sqlClient`UPDATE expense SET description = ${updateData.description}, amount = ${updateData.amount} WHERE id = ${expense.id}`
        } else if (updateData.description) {
          await sqlClient`UPDATE expense SET description = ${updateData.description} WHERE id = ${expense.id}`
        } else if (updateData.amount) {
          await sqlClient`UPDATE expense SET amount = ${updateData.amount} WHERE id = ${expense.id}`
        }
        
        encrypted++
        console.log(`  ✓ Encrypted expense ${expense.id}`)
      }
    } catch (error) {
      console.error(`  ✗ Error encrypting expense ${expense.id}:`, error)
      errors++
    }
  }

  return { encrypted, errors }
}

async function migrateIncomes(): Promise<{ encrypted: number; errors: number }> {
  console.log("Migrating incomes...")
  
  const allIncomes = await db.select().from(incomes)
  let encrypted = 0
  let errors = 0

  for (const income of allIncomes) {
    try {
      let needsUpdate = false
      const updateData: Partial<typeof income> = {}

      // Check description
      if (!isEncrypted(income.description)) {
        updateData.description = encrypt(income.description)
        needsUpdate = true
      }

      // Check amount
      try {
        decryptNumber(income.amount)
        if (!isEncrypted(income.amount)) {
          updateData.amount = encryptNumber(income.amount)
          needsUpdate = true
        }
      } catch {
        updateData.amount = encryptNumber(income.amount)
        needsUpdate = true
      }

      if (needsUpdate) {
        // Use raw SQL to bypass Drizzle type checking since we changed schema
        const sqlClient = neon(process.env.DATABASE_URL!)
        
        if (updateData.description && updateData.amount) {
          await sqlClient`UPDATE income SET description = ${updateData.description}, amount = ${updateData.amount} WHERE id = ${income.id}`
        } else if (updateData.description) {
          await sqlClient`UPDATE income SET description = ${updateData.description} WHERE id = ${income.id}`
        } else if (updateData.amount) {
          await sqlClient`UPDATE income SET amount = ${updateData.amount} WHERE id = ${income.id}`
        }
        
        encrypted++
        console.log(`  ✓ Encrypted income ${income.id}`)
      }
    } catch (error) {
      console.error(`  ✗ Error encrypting income ${income.id}:`, error)
      errors++
    }
  }

  return { encrypted, errors }
}

async function migrateInvoices(): Promise<{ encrypted: number; errors: number }> {
  console.log("Migrating invoices...")
  
  const allInvoices = await db.select().from(invoices)
  let encrypted = 0
  let errors = 0

  for (const invoice of allInvoices) {
    try {
      if (!invoice.extractedData) {
        continue // Skip if no data
      }

      // Check if it's a string (encrypted) or object (needs encryption)
      if (typeof invoice.extractedData === "object") {
        // It's a JSONB object, needs encryption
        const encryptedData = encryptJSON(invoice.extractedData)
        await db
          .update(invoices)
          .set({ extractedData: encryptedData as any })
          .where(eq(invoices.id, invoice.id))
        encrypted++
        console.log(`  ✓ Encrypted invoice ${invoice.id}`)
      } else if (typeof invoice.extractedData === "string") {
        // Check if it's already encrypted
        try {
          decryptJSON(invoice.extractedData)
          // If decrypt succeeds, it's encrypted
        } catch {
          // Not encrypted, but it's a string - might be malformed
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(invoice.extractedData)
            const encryptedData = encryptJSON(parsed)
            await db
              .update(invoices)
              .set({ extractedData: encryptedData as any })
              .where(eq(invoices.id, invoice.id))
            encrypted++
            console.log(`  ✓ Encrypted invoice ${invoice.id}`)
          } catch {
            console.warn(`  ⚠ Invoice ${invoice.id} has invalid extractedData format`)
            errors++
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ Error encrypting invoice ${invoice.id}:`, error)
      errors++
    }
  }

  return { encrypted, errors }
}

async function runSchemaMigration(): Promise<void> {
  console.log("Running schema migration to convert amount fields to text...")
  
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Execute migrations using template literals
    try {
      await sql`ALTER TABLE "expense" ALTER COLUMN "amount" TYPE text USING "amount"::text`
      console.log("  ✓ Converted expense.amount to text")
    } catch (error: any) {
      if (error?.message?.includes("already") || error?.code === "42701" || error?.message?.includes("does not exist")) {
        console.log("  ✓ expense.amount is already text")
      } else {
        throw error
      }
    }
    
    try {
      await sql`ALTER TABLE "income" ALTER COLUMN "amount" TYPE text USING "amount"::text`
      console.log("  ✓ Converted income.amount to text")
    } catch (error: any) {
      if (error?.message?.includes("already") || error?.code === "42701" || error?.message?.includes("does not exist")) {
        console.log("  ✓ income.amount is already text")
      } else {
        throw error
      }
    }
    
    console.log("  ✓ Schema migration completed\n")
  } catch (error: any) {
    console.error("  ⚠ Schema migration error:", error.message)
    console.log("  Continuing with encryption...\n")
  }
}

async function main() {
  console.log("Starting data encryption migration...\n")

  // First, run schema migration to convert numeric to text
  await runSchemaMigration()

  const stats: MigrationStats = {
    expenses: { total: 0, encrypted: 0, errors: 0 },
    incomes: { total: 0, encrypted: 0, errors: 0 },
    invoices: { total: 0, encrypted: 0, errors: 0 },
  }

  try {
    // Count totals
    const allExpenses = await db.select().from(expenses)
    const allIncomes = await db.select().from(incomes)
    const allInvoices = await db.select().from(invoices)

    stats.expenses.total = allExpenses.length
    stats.incomes.total = allIncomes.length
    stats.invoices.total = allInvoices.length

    console.log(`Found ${stats.expenses.total} expenses, ${stats.incomes.total} incomes, ${stats.invoices.total} invoices\n`)

    // Migrate expenses
    const expenseResult = await migrateExpenses()
    stats.expenses.encrypted = expenseResult.encrypted
    stats.expenses.errors = expenseResult.errors

    // Migrate incomes
    const incomeResult = await migrateIncomes()
    stats.incomes.encrypted = incomeResult.encrypted
    stats.incomes.errors = incomeResult.errors

    // Migrate invoices
    const invoiceResult = await migrateInvoices()
    stats.invoices.encrypted = invoiceResult.encrypted
    stats.invoices.errors = invoiceResult.errors

    // Print summary
    console.log("\n" + "=".repeat(50))
    console.log("Migration Summary:")
    console.log("=".repeat(50))
    console.log(`Expenses: ${stats.expenses.encrypted} encrypted, ${stats.expenses.errors} errors (${stats.expenses.total} total)`)
    console.log(`Incomes: ${stats.incomes.encrypted} encrypted, ${stats.incomes.errors} errors (${stats.incomes.total} total)`)
    console.log(`Invoices: ${stats.invoices.encrypted} encrypted, ${stats.invoices.errors} errors (${stats.invoices.total} total)`)
    console.log("=".repeat(50))

    const totalEncrypted = stats.expenses.encrypted + stats.incomes.encrypted + stats.invoices.encrypted
    const totalErrors = stats.expenses.errors + stats.incomes.errors + stats.invoices.errors

    if (totalErrors === 0) {
      console.log("\n✅ Migration completed successfully!")
    } else {
      console.log(`\n⚠️  Migration completed with ${totalErrors} error(s)`)
    }

    process.exit(totalErrors > 0 ? 1 : 0)
  } catch (error) {
    console.error("\n❌ Migration failed:", error)
    process.exit(1)
  }
}

main()
