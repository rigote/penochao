export const PLAN_PRICES = {
  proMonthly: {
    amount: 19.9,
    cents: 1990,
    label: "R$ 19,90",
    intervalLabel: "/mês",
    stripeEnvKey: "STRIPE_PRO_MONTHLY_PRICE_ID",
    publicStripeEnvKey: "NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID",
  },
  proAnnual: {
    amount: 190,
    cents: 19000,
    label: "R$ 190,00",
    equivalentMonthlyAmount: 15.83,
    equivalentMonthlyLabel: "R$ 15,83",
    intervalLabel: "/ano",
    stripeEnvKey: "STRIPE_PRO_ANNUAL_PRICE_ID",
    publicStripeEnvKey: "NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID",
  },
} as const

export const PRO_TRIAL_DAYS = 7

export const PLAN_FEATURES = {
  free: [
    "Dashboard financeiro",
    "Raio-X financeiro inicial",
    "Registro manual de entradas e despesas",
    "Gráficos básicos",
    "Simulador de previsão diária",
  ],
  pro: [
    "Dashboard completo",
    "Categorias personalizadas",
    "Faturas ilimitadas com IA",
    "Raio-X financeiro completo",
    "Sugestões inteligentes para reduzir dívidas",
    "Relatórios mensais em PDF",
    "Plano de recuperação financeira",
    "Projeção do Horizonte de Saldos",
    "Agendamento em lote de despesas",
  ],
} as const

export const PLAN_COPY = {
  free: {
    name: "Free",
    description: "Para começar a entender sua vida financeira",
  },
  pro: {
    name: "Pro",
    description: "Low ticket para sair das dívidas com ajuda da IA",
  },
} as const

export function getAllowedStripePriceIds() {
  return [
    process.env[PLAN_PRICES.proMonthly.stripeEnvKey],
    process.env[PLAN_PRICES.proAnnual.stripeEnvKey],
  ].filter((priceId): priceId is string => Boolean(priceId))
}
