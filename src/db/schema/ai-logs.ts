
import { pgTable, text, timestamp, integer, decimal } from "drizzle-orm/pg-core"

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  model: text("model").notNull(), // 'gemini-2.5-flash'
  inputType: text("input_type").notNull(), // 'pdf_invoice'
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  costBrl: decimal("cost_brl", { precision: 10, scale: 6 }).notNull(), // Store small fractional costs
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
