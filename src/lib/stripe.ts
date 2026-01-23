import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
})

export const PLANS = {
  free: {
    name: "Free",
    description: "Para começar a organizar suas finanças",
    price: 0,
    features: [
      "Dashboard completo",
      "Categorias personalizadas",
      "Até 3 faturas/mês com IA",
      "Gráficos básicos",
    ],
  },
  pro: {
    name: "Pro",
    description: "Para quem quer controle total das finanças",
    monthlyPrice: 19.90,
    annualPrice: 190.00,
    features: [
      "Dashboard completo",
      "Categorias personalizadas",
      "Faturas ilimitadas com IA",
      "Gráficos avançados",
      "Exportação PDF/Excel",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
    ],
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
  name?: string | null
): Promise<string> {
  const customerId = await createOrRetrieveCustomer(userId, email, name)

  const session = await stripe.checkout.sessions.create({
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
    cancel_url: `${process.env.NEXTAUTH_URL}/precos?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
  })

  return session.url!
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/configuracoes`,
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
