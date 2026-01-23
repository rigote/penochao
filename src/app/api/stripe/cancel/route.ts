import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"

const GUARANTEE_DAYS = 7

export async function POST() {
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

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura encontrada" },
        { status: 400 }
      )
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    
    // Calculate days since subscription started
    const subscriptionStartDate = new Date(subscription.start_date * 1000)
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
      return NextResponse.json({
        success: true,
        refunded: false,
        cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
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
