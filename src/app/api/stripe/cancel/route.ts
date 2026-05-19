import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"
import Stripe from "stripe"

const GUARANTEE_DAYS = 7

// Helper to safely get timestamp from subscription
function getSubscriptionTimestamp(
  subscription: Stripe.Subscription,
  field: "start_date" | "current_period_end"
): number {
  // Try direct access first (older API versions)
  const directValue = (subscription as unknown as Record<string, number>)[field]
  if (typeof directValue === "number") {
    return directValue
  }
  
  // For current_period_end, try getting from items
  if (field === "current_period_end" && subscription.items?.data?.[0]) {
    const itemPeriodEnd = (subscription.items.data[0] as unknown as Record<string, number>).current_period_end
    if (typeof itemPeriodEnd === "number") {
      return itemPeriodEnd
    }
  }
  
  // Fallback to created timestamp for start_date
  if (field === "start_date") {
    return subscription.created
  }
  
  // Fallback to 30 days from now for period end
  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
}

export async function POST() {
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

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura encontrada" },
        { status: 400 }
      )
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    
    // Calculate days since subscription started
    const startTimestamp = getSubscriptionTimestamp(subscription, "start_date")
    const subscriptionStartDate = new Date(startTimestamp * 1000)
    const now = new Date()
    const daysSinceStart = Math.floor(
      (now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const isWithinGuarantee = daysSinceStart <= GUARANTEE_DAYS

    if (isWithinGuarantee) {
      // Within 7 days: Cancel immediately and refund
      console.log(`Canceling subscription ${subscription.id} with refund (within guarantee period)`)
      console.log(`Days since start: ${daysSinceStart}`)
      
      let refunded = false
      let refundError: string | null = null

      // Get the latest charges for the customer to refund
      const customerId = typeof subscription.customer === "string" 
        ? subscription.customer 
        : subscription.customer.id

      console.log(`Customer ID: ${customerId}`)

      // Get the latest successful charge for this customer
      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 5,
      })

      console.log(`Found ${charges.data.length} charges`)

      // Find the latest non-refunded successful charge
      const chargeToRefund = charges.data.find(c => !c.refunded && c.status === "succeeded")

      if (chargeToRefund) {
        console.log(`Charge to refund: ${chargeToRefund.id}, amount: ${chargeToRefund.amount / 100}`)
        
        try {
          const refund = await stripe.refunds.create({
            charge: chargeToRefund.id,
            reason: "requested_by_customer",
          })
          
          console.log(`Refund created: ${refund.id}, status: ${refund.status}`)
          refunded = true
        } catch (refundErr) {
          console.error("Refund error:", refundErr)
          refundError = refundErr instanceof Error ? refundErr.message : "Erro ao processar reembolso"
        }
      } else {
        console.log("No charges found to refund")
      }

      // Cancel subscription immediately
      await stripe.subscriptions.cancel(subscription.id, {
        prorate: false,
      })
      
      console.log(`Subscription ${subscription.id} canceled`)

      // Update user to free immediately
      await db
        .update(users)
        .set({
          plan: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      if (refundError) {
        return NextResponse.json({
          success: true,
          refunded: false,
          message: `Assinatura cancelada. Reembolso pendente: ${refundError}`,
          refundError,
        })
      }

      return NextResponse.json({
        success: true,
        refunded,
        message: refunded 
          ? "Assinatura cancelada e valor reembolsado com sucesso."
          : "Assinatura cancelada. Nenhum pagamento encontrado para reembolso.",
      })
    } else {
      // After 7 days: Cancel at period end (no refund)
      console.log(`Canceling subscription ${subscription.id} at period end`)
      
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })

      // User keeps Pro until period end
      const periodEndTimestamp = getSubscriptionTimestamp(subscription, "current_period_end")
      return NextResponse.json({
        success: true,
        refunded: false,
        cancelAt: new Date(periodEndTimestamp * 1000).toISOString(),
        message: "Assinatura será cancelada ao final do período atual.",
      })
    }
  } catch (error) {
    console.error("Cancel subscription error:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    )
  }
}
