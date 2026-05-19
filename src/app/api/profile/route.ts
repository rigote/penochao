import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { accounts, sessions, verificationTokens } from "@/db/schema/auth"
import { aiUsageLogs } from "@/db/schema/ai-logs"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { categories, expenseSuggestions, expenses, incomes, invoices, userSettings } from "@/db/schema/finance"
import { eq, like, or } from "drizzle-orm"
import { z } from "zod"
import { del } from "@vercel/blob"
import { stripe } from "@/lib/stripe"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
})

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
})

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    await db
      .update(users)
      .set({
        name: result.data.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const result = deleteAccountSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Digite EXCLUIR para confirmar a exclusão da conta" },
        { status: 400 }
      )
    }

    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId, {
          prorate: false,
        })
      } catch (error) {
        console.error("Error canceling Stripe subscription before account deletion:", error)
      }
    }

    if (user.image && user.image.includes("blob.vercel-storage.com")) {
      try {
        await del(user.image)
      } catch {
        // Ignore blob deletion errors; account data deletion must continue.
      }
    }

    await db.delete(aiUsageLogs).where(eq(aiUsageLogs.userId, user.id))
    await db.delete(expenseSuggestions).where(eq(expenseSuggestions.userId, user.id))
    await db.delete(invoices).where(eq(invoices.userId, user.id))
    await db.delete(expenses).where(eq(expenses.userId, user.id))
    await db.delete(incomes).where(eq(incomes.userId, user.id))
    await db.delete(userSettings).where(eq(userSettings.userId, user.id))
    await db.delete(categories).where(eq(categories.userId, user.id))
    await db.delete(couponRedemptions).where(eq(couponRedemptions.userId, user.id))
    await db.update(coupons).set({ createdBy: null }).where(eq(coupons.createdBy, user.id))
    await db.delete(accounts).where(eq(accounts.userId, user.id))
    await db.delete(sessions).where(eq(sessions.userId, user.id))
    await db.delete(verificationTokens).where(
      or(
        eq(verificationTokens.identifier, user.email),
        like(verificationTokens.identifier, `email-change:${user.id}:%`)
      )
    )
    await db.delete(users).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Erro ao excluir conta" },
      { status: 500 }
    )
  }
}
