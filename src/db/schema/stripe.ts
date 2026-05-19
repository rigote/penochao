import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const stripeWebhookEvents = pgTable("stripe_webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").default("processing").notNull(),
  error: text("error"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
