import "dotenv/config"
import Stripe from "stripe"
import { db } from "../src/db"
import { users } from "../src/db/schema/auth"
import { eq } from "drizzle-orm"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function syncUserSubscription(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    console.error(`User with email ${email} not found`)
    process.exit(1)
  }

  console.log(`Found user: ${user.name} (${user.email})`)
  console.log(`Current plan: ${user.plan}`)
  console.log(`Stripe Customer ID: ${user.stripeCustomerId || "Not set"}`)
  console.log(`Stripe Subscription ID: ${user.stripeSubscriptionId || "Not set"}`)

  // If user has a customer ID, check for active subscriptions
  if (user.stripeCustomerId) {
    console.log("\nSearching for active subscriptions...")
    
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    })

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      console.log(`Found active subscription: ${subscription.id}`)
      
      await db
        .update(users)
        .set({
          plan: "pro",
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      console.log(`Successfully synced ${user.email} with Stripe subscription!`)
    } else {
      console.log("No active subscriptions found.")
      
      // Just upgrade to pro without Stripe data
      await db
        .update(users)
        .set({
          plan: "pro",
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      console.log(`Upgraded ${user.email} to Pro (manual upgrade, no Stripe subscription).`)
    }
  } else {
    // No customer ID, just upgrade manually
    await db
      .update(users)
      .set({
        plan: "pro",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    console.log(`Upgraded ${user.email} to Pro (no Stripe customer found).`)
  }

  process.exit(0)
}

// Get email from command line args
const email = process.argv[2]

if (!email) {
  console.error("Usage: pnpm tsx scripts/upgrade-user.ts <email>")
  process.exit(1)
}

syncUserSubscription(email)
