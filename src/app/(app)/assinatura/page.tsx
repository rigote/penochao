import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { stripe } from "@/lib/stripe"
import { AssinaturaClient } from "./assinatura-client"

export default async function AssinaturaPage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) {
    redirect("/login")
  }

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

  const subscriptionInfo = {
    plan: user.plan as "free" | "pro",
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    subscriptionStartDate,
    cancelAtPeriodEnd,
  }

  return <AssinaturaClient subscriptionInfo={subscriptionInfo} />
}
