import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createCheckoutSession, getOrCreateStripeCoupon } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
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

    const { priceId, couponCode } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID é obrigatório" }, { status: 400 })
    }

    let stripeCouponId: string | null = null
    let internalCouponId: string | null = null

    // Validate and get Stripe coupon if provided
    if (couponCode) {
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, couponCode.toUpperCase()),
      })

      if (coupon && coupon.type === "discount" && coupon.discountPercent) {
        // Validate coupon is still valid
        const now = new Date()
        const isValid = coupon.isActive &&
          (!coupon.validFrom || now >= coupon.validFrom) &&
          (!coupon.validUntil || now <= coupon.validUntil) &&
          (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
          (!coupon.restrictedEmail || coupon.restrictedEmail === session.user.email.toLowerCase())

        // Check if already used by this user
        const alreadyUsed = await db.query.couponRedemptions.findFirst({
          where: and(
            eq(couponRedemptions.couponId, coupon.id),
            eq(couponRedemptions.userId, user.id)
          ),
        })

        if (isValid && !alreadyUsed) {
          stripeCouponId = await getOrCreateStripeCoupon(coupon.id, coupon.discountPercent)
          internalCouponId = coupon.id
        }
      }
    }

    const checkoutUrl = await createCheckoutSession(
      user.id,
      user.email,
      priceId,
      user.name,
      stripeCouponId,
      internalCouponId
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout" },
      { status: 500 }
    )
  }
}
