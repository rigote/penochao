import { Metadata } from "next"
import { Pricing } from "@/app/components/landing/pricing"
import { Check, Shield, Zap, HeartHandshake } from "lucide-react"
import { PLAN_PRICES, PRO_TRIAL_DAYS } from "@/config/plans"

export const metadata: Metadata = {
  title: "Preços - Penochão",
  description: `Planos e preços do Penochão. Escolha entre Free ou Pro. Plano Pro: ${PLAN_PRICES.proMonthly.label}/mês ou ${PLAN_PRICES.proAnnual.label.replace(",00", "")}/ano com 20% de desconto. ${PRO_TRIAL_DAYS} dias grátis antes da primeira cobrança.`,
  keywords: [
    "preços penochão",
    "planos controle financeiro",
    "assinatura pro",
    "preço app financeiro",
    "planos penochão",
  ],
  openGraph: {
    title: "Preços - Penochão",
    description: "Planos e preços do Penochão. Escolha o plano ideal para organizar suas finanças.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Preços - Penochão",
    description: "Planos e preços do Penochão. Escolha o plano ideal para organizar suas finanças.",
  },
  alternates: {
    canonical: "https://penochao.app.br/precos",
  },
}

const guarantees = [
  {
    icon: Shield,
    title: `${PRO_TRIAL_DAYS} dias grátis`,
    description: "Teste o Pro antes da primeira cobrança e cancele pelo portal Stripe se não fizer sentido para você.",
  },
  {
    icon: Zap,
    title: "Cancele quando quiser",
    description: "Sem fidelidade ou contratos. Você tem controle total.",
  },
  {
    icon: HeartHandshake,
    title: "Suporte humanizado",
    description: "Estamos aqui para ajudar. Resposta em até 24h úteis.",
  },
]

const comparisonFeatures = [
  { feature: "Dashboard financeiro completo", free: true, pro: true },
  { feature: "Registro de receitas e despesas", free: true, pro: true },
  { feature: "Categorias personalizadas", free: true, pro: true },
  { feature: "Subcategorias ilimitadas", free: true, pro: true },
  { feature: "Gráficos de evolução mensal", free: true, pro: true },
  { feature: "Meta de reserva de emergência", free: true, pro: true },
  { feature: "Leitura de faturas com IA", free: false, pro: "Ilimitado" },
  { feature: "Assistente financeiro com IA", free: false, pro: true },
  { feature: "Exportação PDF/Excel", free: false, pro: true },
  { feature: "Relatórios avançados", free: false, pro: true },
  { feature: "Suporte prioritário", free: false, pro: true },
  { feature: "Acesso antecipado a novidades", free: false, pro: true },
]

const pricingFaqs = [
  {
    question: "Como funciona o pagamento?",
    answer: "O pagamento é processado de forma segura pelo Stripe. Aceitamos cartões de crédito Visa, Mastercard, American Express e Elo. Você pode escolher entre pagamento mensal ou anual (com 20% de desconto).",
  },
  {
    question: "Posso trocar de plano depois?",
    answer: "Sim! Você pode fazer upgrade do Free para o Pro a qualquer momento. Se fizer downgrade, manterá acesso ao Pro até o final do período já pago.",
  },
  {
    question: "O que acontece se eu cancelar?",
    answer: "Ao cancelar, você continua com acesso ao plano Pro até o fim do período de faturamento. Após isso, sua conta volta ao plano Free automaticamente. Seus dados são mantidos.",
  },
  {
    question: "Existe desconto para pagamento anual?",
    answer: `Sim! No plano anual você paga ${PLAN_PRICES.proAnnual.label}/ano, o equivalente a ${PLAN_PRICES.proAnnual.equivalentMonthlyLabel}/mês. Isso representa uma economia de 20% comparado ao plano mensal.`,
  },
  {
    question: "Os preços podem mudar?",
    answer: "Se houver reajuste, você será notificado com antecedência. Assinantes ativos mantêm o preço original até renovação.",
  },
]

export default function PrecosPage() {
  return (
    <div className="py-16">
      {/* Hero */}
      <div className="container mx-auto px-4 text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comece grátis e faça upgrade quando precisar. Sem compromisso, cancele a qualquer momento.
        </p>
      </div>

      {/* Pricing Component */}
      <Pricing />

      {/* Guarantees */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {guarantees.map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Comparativo de recursos
        </h2>
        <div className="max-w-3xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 font-medium">Recurso</th>
                <th className="text-center py-4 font-medium w-24">Free</th>
                <th className="text-center py-4 font-medium w-24 text-primary">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.feature} className="border-b">
                  <td className="py-4 text-sm">{row.feature}</td>
                  <td className="py-4 text-center">
                    {row.free === true ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : row.free === false ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.free}</span>
                    )}
                  </td>
                  <td className="py-4 text-center">
                    {row.pro === true ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <span className="text-sm font-medium text-primary">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          Perguntas sobre pagamento
        </h2>
        <div className="max-w-2xl mx-auto space-y-6">
          {pricingFaqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
