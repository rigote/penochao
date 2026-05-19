import Stripe from "stripe"
import { PLAN_COPY, PLAN_FEATURES, PLAN_PRICES } from "@/config/plans"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  free: {
    name: PLAN_COPY.free.name,
    description: PLAN_COPY.free.description,
    price: 0,
    features: [...PLAN_FEATURES.free],
  },
  pro: {
    name: PLAN_COPY.pro.name,
    description: PLAN_COPY.pro.description,
    monthlyPrice: PLAN_PRICES.proMonthly.amount,
    annualPrice: PLAN_PRICES.proAnnual.amount,
    features: [...PLAN_FEATURES.pro],
  },
}

export async function createOrRetrieveCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const { db } = await import("@/db")
  const { users } = await import("@/db/schema/auth")
  const { eq } = await import("drizzle-orm")

  // Check if user already has a Stripe customer ID
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  })

  // Save customer ID to database
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId))

  return customer.id
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  name?: string | null,
  stripeCouponId?: string | null,
  internalCouponId?: string | null
): Promise<string> {
  const customerId = await createOrRetrieveCustomer(userId, email, name)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/assinatura?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
      couponId: internalCouponId || "",
    },
  }

  // Apply discount if Stripe coupon provided
  if (stripeCouponId) {
    sessionParams.discounts = [
      {
        coupon: stripeCouponId,
      },
    ]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return session.url!
}

// Create or retrieve a Stripe coupon for our internal coupon
export async function getOrCreateStripeCoupon(
  internalCouponId: string,
  discountPercent: number
): Promise<string> {
  // Use a consistent ID based on our internal coupon
  const stripeCouponId = `penochao_${internalCouponId.substring(0, 8)}`
  
  try {
    // Try to retrieve existing coupon
    const existingCoupon = await stripe.coupons.retrieve(stripeCouponId)
    return existingCoupon.id
  } catch {
    // Coupon doesn't exist, create it
    const coupon = await stripe.coupons.create({
      id: stripeCouponId,
      percent_off: discountPercent,
      duration: "once",
      name: `Desconto ${discountPercent}%`,
    })
    return coupon.id
  }
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/assinatura`,
  })

  return session.url
}

export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch {
    return null
  }
}

export function isSubscriptionActive(subscription: Stripe.Subscription | null): boolean {
  if (!subscription) return false
  return ["active", "trialing"].includes(subscription.status)
}
