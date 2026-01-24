"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const plans = {
  free: {
    name: "Free",
    description: "Para começar a organizar suas finanças",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { text: "Dashboard completo", included: true },
      { text: "Categorias personalizadas", included: true },
      { text: "Até 3 faturas/mês com IA", included: true },
      { text: "Gráficos básicos", included: true },
      { text: "Faturas ilimitadas com IA", included: false },
      { text: "Relatórios mensais detalhados", included: false },
      { text: "Identifique gastos desnecessários", included: false },
      { text: "Análise inteligente de despesas", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    cta: "Começar grátis",
    popular: false,
  },
  pro: {
    name: "Pro",
    description: "Para quem quer controle total das finanças",
    monthlyPrice: 19.90,
    annualPrice: 190.00,
    features: [
      { text: "Dashboard completo", included: true },
      { text: "Categorias personalizadas", included: true },
      { text: "Faturas ilimitadas com IA", included: true },
      { text: "Gráficos avançados", included: true },
      { text: "Relatórios mensais detalhados em PDF", included: true },
      { text: "Identifique gastos desnecessários e economize mais", included: true },
      { text: "Análise inteligente de oportunidades de economia", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Acesso antecipado a novidades", included: true },
    ],
    cta: "Assinar Pro",
    popular: true,
  },
}

export function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleSubscribe = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const priceId = annual
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao criar checkout")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao processar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (plan: typeof plans.free | typeof plans.pro) => {
    if (plan.monthlyPrice === 0) return "Grátis"
    const price = annual ? plan.annualPrice / 12 : plan.monthlyPrice
    return `R$ ${price.toFixed(2).replace(".", ",")}`
  }

  const getPeriod = (plan: typeof plans.free | typeof plans.pro) => {
    if (plan.monthlyPrice === 0) return "para sempre"
    return "/mês"
  }

  return (
    <section id="precos" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Escolha o plano ideal para você. Sem surpresas, sem taxas escondidas.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                !annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
              <span className="ml-2 text-xs text-primary font-semibold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.values(plans).map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-2xl border bg-background",
                plan.popular && "border-primary shadow-lg ring-1 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    Mais popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{getPrice(plan)}</span>
                <span className="text-muted-foreground ml-1">{getPeriod(plan)}</span>
                {annual && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    R$ {plan.annualPrice.toFixed(2).replace(".", ",")} cobrado anualmente
                  </p>
                )}
              </div>

              {plan.popular ? (
                <Button
                  className="w-full mb-6"
                  variant="default"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full mb-6"
                  variant="outline"
                  asChild
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>
              )}

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem 7 dias de garantia. Cancele quando quiser.
        </p>
      </div>
    </section>
  )
}
