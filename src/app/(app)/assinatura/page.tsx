import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { couponRedemptions, coupons } from "@/db/schema/coupons"
import { eq, and, gte, desc } from "drizzle-orm"
import { stripe } from "@/lib/stripe"
import { AssinaturaClient } from "./assinatura-client"
import { resolveEffectiveUserPlan } from "@/lib/subscription"

export default async function AssinaturaPage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const foundUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!foundUser) {
    redirect("/login")
  }

  const user = await resolveEffectiveUserPlan(foundUser)

  let subscriptionStartDate: Date | null = null
  let cancelAtPeriodEnd = false

  // Get subscription details from Stripe if user has one
  if (user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      subscriptionStartDate = new Date(subscription.start_date * 1000)
      cancelAtPeriodEnd = subscription.cancel_at_period_end
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  // Check for active courtesy
  let courtesyInfo: {
    expiresAt: string
    invoiceLimit: number | null
    couponCode: string | null
    redeemedAt: string
  } | null = null

  const activeCourtesy = await db.query.couponRedemptions.findFirst({
    where: and(
      eq(couponRedemptions.userId, user.id),
      gte(couponRedemptions.courtesyExpiresAt, new Date())
    ),
    orderBy: [desc(couponRedemptions.redeemedAt)],
    with: {
      coupon: true,
    },
  })

  if (activeCourtesy?.courtesyExpiresAt) {
    courtesyInfo = {
      expiresAt: activeCourtesy.courtesyExpiresAt.toISOString(),
      invoiceLimit: activeCourtesy.invoiceLimit,
      couponCode: activeCourtesy.coupon?.code || null,
      redeemedAt: activeCourtesy.redeemedAt.toISOString(),
    }
  }

  const subscriptionInfo = {
    plan: user.plan as "free" | "pro",
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    subscriptionStartDate,
    cancelAtPeriodEnd,
    courtesyInfo,
    hasUsedProTrial: Boolean(user.proTrialUsedAt),
  }

  return <AssinaturaClient subscriptionInfo={subscriptionInfo} />
}
