import "dotenv/config"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function refundLastPayment(email: string) {
  // Get customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })
  
  if (customers.data.length === 0) {
    console.log("Customer not found")
    process.exit(1)
  }
  
  const customer = customers.data[0]
  console.log("Customer:", customer.id, customer.email)
  
  // Get latest charges for this customer
  const charges = await stripe.charges.list({
    customer: customer.id,
    limit: 5,
  })
  
  console.log("\nCharges found:", charges.data.length)
  
  for (const charge of charges.data) {
    console.log("---")
    console.log("Charge ID:", charge.id)
    console.log("Amount: R$", (charge.amount / 100).toFixed(2))
    console.log("Refunded:", charge.refunded ? "Yes" : "No")
    console.log("Status:", charge.status)
    console.log("Created:", new Date(charge.created * 1000).toLocaleString("pt-BR"))
  }
  
  // Find the latest non-refunded charge
  const chargeToRefund = charges.data.find(c => !c.refunded && c.status === "succeeded")
  
  if (chargeToRefund) {
    console.log("\n=== Creating refund for charge:", chargeToRefund.id, "===")
    const refund = await stripe.refunds.create({
      charge: chargeToRefund.id,
      reason: "requested_by_customer",
    })
    console.log("Refund created!")
    console.log("Refund ID:", refund.id)
    console.log("Status:", refund.status)
    console.log("Amount: R$", ((refund.amount || 0) / 100).toFixed(2))
  } else {
    console.log("\nNo charges to refund (all already refunded or no successful charges)")
  }
  
  process.exit(0)
}

const email = process.argv[2]

if (!email) {
  console.error("Usage: pnpm tsx scripts/refund-user.ts <email>")
  process.exit(1)
}

refundLastPayment(email)
