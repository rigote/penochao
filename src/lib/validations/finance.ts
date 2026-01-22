import { z } from "zod"

// Category schemas
export const categoryTypeSchema = z.enum(["income", "essential", "non_essential"])

export const createCategorySchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Nome é obrigatório"),
  type: categoryTypeSchema,
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida").optional(),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  archived: z.boolean().optional(),
})

// Income schemas
export const recurrenceSchema = z.enum(["once", "monthly", "yearly"])

export const createIncomeSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  recurrence: recurrenceSchema.optional().default("once"),
})

export const updateIncomeSchema = createIncomeSchema.partial()

// Expense schemas
export const createExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  occurrenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  type: z.enum(["essential", "non_essential"]),
  recurrence: recurrenceSchema.optional().default("once"),
})

export const updateExpenseSchema = createExpenseSchema.partial()

// Invoice schemas
export const invoiceStatusSchema = z.enum(["pending", "processed", "error"])

export const createInvoiceSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
})

// User settings schemas
export const updateUserSettingsSchema = z.object({
  emergencyFundTarget: z.coerce.number().positive().optional(),
  emergencyFundMonths: z.coerce.number().min(1).max(24).optional(),
  currentSavings: z.coerce.number().min(0).optional(),
})

// Query params schemas
export const monthQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).max(2100).optional(),
})

// Types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>
