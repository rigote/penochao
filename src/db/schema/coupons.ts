import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./auth"

export const coupons = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Código do cupom (ex: BEMVINDO20, CORTESIA30D)
  code: text("code").notNull().unique(),
  
  // Descrição interna (para admin)
  description: text("description"),
  
  // Tipo: 'discount' (desconto %) ou 'courtesy' (cortesia tempo)
  type: text("type").notNull(), // 'discount' | 'courtesy'
  
  // Para desconto: porcentagem (0-100)
  discountPercent: integer("discount_percent"),
  
  // Para cortesia: dias de Pro grátis
  courtesyDays: integer("courtesy_days"),
  
  // Limite de faturas IA por mês (null = ilimitado como Pro normal)
  invoiceLimit: integer("invoice_limit"),
  
  // Email específico (se preenchido, só esse email pode usar)
  restrictedEmail: text("restricted_email"),
  
  // Limite máximo de usos (null = ilimitado)
  maxUses: integer("max_uses"),
  
  // Contador de usos
  usedCount: integer("used_count").default(0).notNull(),
  
  // Período de validade
  validFrom: timestamp("valid_from", { mode: "date" }),
  validUntil: timestamp("valid_until", { mode: "date" }),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Criado por (userId do admin)
  createdBy: text("created_by").references(() => users.id),
})

// Registro de uso dos cupons
export const couponRedemptions = pgTable("coupon_redemption", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Para cortesia: data de expiração do Pro
  courtesyExpiresAt: timestamp("courtesy_expires_at", { mode: "date" }),
  
  // Limite de faturas IA aplicado (copiado do cupom no momento do resgate)
  invoiceLimit: integer("invoice_limit"),
  
  // Para desconto: ID da sessão de checkout do Stripe
  stripeSessionId: text("stripe_session_id"),
  
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
})

// Relations
export const couponsRelations = relations(coupons, ({ one, many }) => ({
  creator: one(users, {
    fields: [coupons.createdBy],
    references: [users.id],
  }),
  redemptions: many(couponRedemptions),
}))

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponRedemptions.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponRedemptions.userId],
    references: [users.id],
  }),
}))
