import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { users } from "@/db/schema/auth"
import { eq, and, sql } from "drizzle-orm"
import { addDays } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Código é obrigatório" }, { status: 400 })
    }

    // Find coupon
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    })

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    // Validate coupon (same checks as validate endpoint)
    if (!coupon.isActive) {
      return NextResponse.json({ error: "Cupom inativo" }, { status: 400 })
    }

    const now = new Date()
    
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return NextResponse.json({ error: "Cupom ainda não está válido" }, { status: 400 })
    }

    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 })
    }

    if (coupon.restrictedEmail && coupon.restrictedEmail !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Cupom não disponível para este email" }, { status: 400 })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if user already used this coupon
    const alreadyUsed = await db.query.couponRedemptions.findFirst({
      where: and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.userId, user.id)
      ),
    })

    if (alreadyUsed) {
      return NextResponse.json({ error: "Você já utilizou este cupom" }, { status: 400 })
    }

    // Process based on coupon type
    if (coupon.type === "courtesy") {
      // Courtesy coupon: grant Pro for X days
      const expiresAt = addDays(now, coupon.courtesyDays || 30)

      // Update user to Pro
      await db
        .update(users)
        .set({
          plan: "pro",
          // Don't set Stripe fields for courtesy
          updatedAt: now,
        })
        .where(eq(users.id, user.id))

      // Record redemption with invoice limit
      await db.insert(couponRedemptions).values({
        couponId: coupon.id,
        userId: user.id,
        courtesyExpiresAt: expiresAt,
        invoiceLimit: coupon.invoiceLimit,
      })

      // Increment used count
      await db
        .update(coupons)
        .set({
          usedCount: sql`${coupons.usedCount} + 1`,
          updatedAt: now,
        })
        .where(eq(coupons.id, coupon.id))

      return NextResponse.json({
        success: true,
        type: "courtesy",
        expiresAt: expiresAt.toISOString(),
        message: `Plano Pro ativado por ${coupon.courtesyDays} dias!`,
      })
    } else if (coupon.type === "discount") {
      // Discount coupon: return the coupon info to be used in checkout
      // The actual redemption will happen after successful payment
      
      return NextResponse.json({
        success: true,
        type: "discount",
        discountPercent: coupon.discountPercent,
        couponId: coupon.id,
        message: `Desconto de ${coupon.discountPercent}% aplicado!`,
      })
    }

    return NextResponse.json({ error: "Tipo de cupom inválido" }, { status: 400 })
  } catch (error) {
    console.error("Error redeeming coupon:", error)
    return NextResponse.json({ error: "Erro ao resgatar cupom" }, { status: 500 })
  }
}
