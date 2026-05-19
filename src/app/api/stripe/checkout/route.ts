import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAllowedStripePriceIds } from "@/config/plans"
import { createCheckoutSession, getOrCreateStripeCoupon } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { eq, and, isNull } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

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

    const allowedPriceIds = getAllowedStripePriceIds()

    if (!allowedPriceIds.includes(priceId)) {
      return NextResponse.json({ error: "Price ID inválido" }, { status: 400 })
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

    let includeTrial = false
    let claimedTrial = false

    if (!user.proTrialUsedAt) {
      const [trialClaim] = await db
        .update(users)
        .set({
          proTrialUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), isNull(users.proTrialUsedAt)))
        .returning({ id: users.id })

      includeTrial = Boolean(trialClaim)
      claimedTrial = includeTrial
    }

    try {
      const checkoutUrl = await createCheckoutSession(
        user.id,
        user.email,
        priceId,
        user.name,
        stripeCouponId,
        internalCouponId,
        includeTrial
      )

      return NextResponse.json({ url: checkoutUrl, trialIncluded: includeTrial })
    } catch (checkoutError) {
      if (claimedTrial) {
        await db
          .update(users)
          .set({
            proTrialUsedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
      }

      throw checkoutError
    }
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout" },
      { status: 500 }
    )
  }
}
