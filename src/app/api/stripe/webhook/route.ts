import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { coupons, couponRedemptions } from "@/db/schema/coupons"
import { eq, sql } from "drizzle-orm"

// Helper to safely get current_period_end from subscription
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription | Stripe.Response<Stripe.Subscription>): Date | null {
  // Cast to access the property regardless of type wrapper
  const sub = subscription as unknown as Record<string, unknown>
  
  // Try direct access
  if (typeof sub.current_period_end === "number") {
    return new Date(sub.current_period_end * 1000)
  }
  
  // Try from items
  const items = sub.items as { data?: Array<Record<string, unknown>> } | undefined
  if (items?.data?.[0] && typeof items.data[0].current_period_end === "number") {
    return new Date(items.data[0].current_period_end * 1000)
  }
  
  return null
}

// Helper to find user by Stripe customer ID
async function findUserByCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null
  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  })
  return user?.id || null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          // Try to get userId from metadata, fallback to customer lookup
          let userId = session.metadata?.userId
          if (!userId && session.customer) {
            userId = await findUserByCustomerId(session.customer as string) || undefined
          }
          
          if (userId) {
            const periodEnd = getSubscriptionPeriodEnd(subscription)
            
            await db
              .update(users)
              .set({
                plan: "pro",
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: periodEnd,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))
            
            console.log(`User ${userId} upgraded to Pro`)

            // Register coupon usage if coupon was used
            const couponId = session.metadata?.couponId
            if (couponId) {
              // Check if coupon exists and record redemption
              const coupon = await db.query.coupons.findFirst({
                where: eq(coupons.id, couponId),
              })
              
              if (coupon) {
                await db.insert(couponRedemptions).values({
                  couponId: coupon.id,
                  userId,
                  stripeSessionId: session.id,
                })

                // Increment usage count
                await db
                  .update(coupons)
                  .set({
                    usedCount: sql`${coupons.usedCount} + 1`,
                    updatedAt: new Date(),
                  })
                  .where(eq(coupons.id, coupon.id))

                console.log(`Coupon ${coupon.code} used by user ${userId}`)
              }
            }
          } else {
            console.error("checkout.session.completed: No userId found", { 
              sessionId: session.id, 
              customer: session.customer 
            })
          }
        }
        break
      }

      case "invoice.paid": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        
        // Get subscription ID - handle both string and object forms
        const subscriptionId = typeof invoice.subscription === "string" 
          ? invoice.subscription 
          : invoice.subscription?.id
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          let userId: string | undefined = subscription.metadata?.userId
          const customerId = typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id
          if (!userId && customerId) {
            userId = (await findUserByCustomerId(customerId)) || undefined
          }
          
          if (userId) {
            const periodEnd = getSubscriptionPeriodEnd(subscription)
            
            await db
              .update(users)
              .set({
                plan: "pro",
                stripeCurrentPeriodEnd: periodEnd,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        let userId: string | undefined = subscription.metadata?.userId
        if (!userId) {
          const customer = typeof subscription.customer === "string" 
            ? subscription.customer 
            : subscription.customer?.id
          userId = (await findUserByCustomerId(customer || null)) || undefined
        }
        
        if (userId) {
          const isActive = ["active", "trialing"].includes(subscription.status)
          const periodEnd = getSubscriptionPeriodEnd(subscription)
          
          await db
            .update(users)
            .set({
              plan: isActive ? "pro" : "free",
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        let userId: string | undefined = subscription.metadata?.userId
        if (!userId) {
          const customer = typeof subscription.customer === "string" 
            ? subscription.customer 
            : subscription.customer?.id
          userId = (await findUserByCustomerId(customer || null)) || undefined
        }
        
        if (userId) {
          await db
            .update(users)
            .set({
              plan: "free",
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
          
          console.log(`User ${userId} downgraded to Free`)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
