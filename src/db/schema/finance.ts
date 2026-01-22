import {
  timestamp,
  pgTable,
  text,
  decimal,
  pgEnum,
  uuid,
  boolean,
  jsonb,
  date,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./auth"

// Enums
export const categoryTypeEnum = pgEnum("category_type", [
  "income",
  "essential",
  "non_essential",
])

export const recurrenceEnum = pgEnum("recurrence", [
  "once",
  "monthly",
  "yearly",
])

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "processed",
  "error",
])

// Categories table
export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for system defaults
  parentId: uuid("parent_id"), // Self-reference for subcategories
  name: text("name").notNull(),
  type: categoryTypeEnum("type").notNull(),
  icon: text("icon"),
  color: text("color"), // Hex code
  isDefault: boolean("is_default").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  parentReference: {
    columns: [table.parentId],
    foreignColumns: [table.id],
  }
}))

// Incomes table
export const incomes = pgTable("income", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  occurrenceDate: date("occurrence_date").notNull(),
  recurrence: recurrenceEnum("recurrence").default("once"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Expenses table
export const expenses = pgTable("expense", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  occurrenceDate: date("occurrence_date").notNull(),
  type: categoryTypeEnum("type").notNull(),
  recurrence: recurrenceEnum("recurrence").default("once"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Invoices table (for PDF uploads)
export const invoices = pgTable("invoice", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  extractedData: jsonb("extracted_data"),
  status: invoiceStatusEnum("status").default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// User settings for financial goals
export const userSettings = pgTable("user_setting", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emergencyFundTarget: decimal("emergency_fund_target", {
    precision: 12,
    scale: 2,
  }),
  emergencyFundMonths: decimal("emergency_fund_months", {
    precision: 3,
    scale: 1,
  }).default("6"),
  currentSavings: decimal("current_savings", {
    precision: 12,
    scale: 2,
  }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  incomes: many(incomes),
  expenses: many(expenses),
  // Hierarchy relations
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_hierarchy",
  }),
  subcategories: many(categories, {
    relationName: "category_hierarchy",
  }),
}))

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [incomes.categoryId],
    references: [categories.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}))

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}))

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}))
