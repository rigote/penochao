import { Activity, ArrowRight, CreditCard, FileText, Shield, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    icon: FileText,
    title: "Registre ou importe",
    description: "Adicione entradas, despesas e faturas para montar uma base financeira limpa.",
  },
  {
    icon: Activity,
    title: "Separe o que pesa",
    description: "O Raio-X diferencia custo essencial, dívidas/cartão, dia a dia e estilo de vida.",
  },
  {
    icon: TrendingUp,
    title: "Decida o próximo passo",
    description: "Veja se precisa cortar, gerar caixa extra, proteger reserva ou negociar com método.",
  },
]

const highlights = [
  {
    icon: CreditCard,
    title: "Dívidas fora do caos",
    description: "Faturas, empréstimos, parcelas e renegociações aparecem isolados do custo essencial.",
    tone: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300",
  },
  {
    icon: Sparkles,
    title: "IA com contexto",
    description: "Sugestões para reduzir vazamentos e priorizar ações sem te empurrar para mais parcela.",
    tone: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    icon: Shield,
    title: "Tudo criptografado",
    description: "Valores, descrições financeiras e dados sensíveis são criptografados para proteger sua privacidade.",
    tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
]

export function Features() {
  return (
    <section id="recursos" className="border-b bg-muted/30 py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-medium text-primary">Como o Penochão pensa</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Primeiro clareza, depois plano
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              O produto foi desenhado para quem precisa sair do aperto sem transformar controle financeiro em mais uma tarefa pesada.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="relative rounded-lg border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    {index < steps.length - 1 ? (
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                    ) : null}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-xl border bg-background p-5 shadow-sm">
              <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-lg", item.tone)}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
