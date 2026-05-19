import Link from "next/link"
import { Activity, ArrowRight, BadgeCheck, CreditCard, LockKeyhole, Shield, TrendingDown, Wallet } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"

const metrics = [
  {
    label: "Renda média",
    value: "R$ 10.098",
    tone: "text-emerald-600",
    icon: Wallet,
  },
  {
    label: "Sobra real",
    value: "-R$ 2.948",
    tone: "text-red-600",
    icon: TrendingDown,
  },
  {
    label: "Caixa extra",
    value: "R$ 3.000",
    tone: "text-amber-600",
    icon: Shield,
  },
]

const outflow = [
  { label: "Essenciais", value: "13,7%", className: "bg-orange-500" },
  { label: "Dívidas/cartão", value: "17,1%", className: "bg-red-500" },
  { label: "Estilo de vida", value: "69,2%", className: "bg-violet-500" },
]

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b bg-background pt-24 sm:pt-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-muted/60 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl pb-10 text-center sm:pb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Todos os dados financeiros são criptografados
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Penochão mostra o que precisa mudar para o mês fechar
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Separe renda, custo essencial, dívidas e consumo para enxergar a sobra real, o caixa extra necessário e o próximo passo sem achismo.
          </p>
          <div className="mx-auto mt-5 flex max-w-2xl flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-5">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-emerald-600" />
              Valores e descrições criptografados
            </span>
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Privacidade desde o cadastro
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/login">
                Fazer meu Raio-X
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <a href="#recursos">Ver como funciona</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl pb-10 sm:pb-14">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-elevated">
            <div className="border-b bg-muted/40 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Raio-X Financeiro</p>
                    <p className="text-xs text-muted-foreground">Leitura do mês atual com renda média</p>
                  </div>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Em alerta
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b p-4 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="grid gap-3 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <metric.icon className={cn("h-4 w-4", metric.tone)} />
                      </div>
                      <p className={cn("text-xl font-bold", metric.tone)}>{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Composição das saídas</p>
                    <p className="text-sm font-semibold">R$ 13.046</p>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[14%] bg-orange-500" />
                    <div className="h-full w-[17%] bg-red-500" />
                    <div className="h-full flex-1 bg-violet-500" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {outflow.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.className)} />
                          <span className="truncate text-xs text-muted-foreground">{item.label}</span>
                        </div>
                        <span className="text-xs font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Próximo passo recomendado</p>
                      <p className="text-sm text-muted-foreground">Reduzir vazamentos antes de assumir novas parcelas.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <ProgressPreview label="Essenciais" value="17,8%" width="18%" color="bg-orange-500" />
                    <ProgressPreview label="Dívidas/cartão" value="22,1%" width="22%" color="bg-red-500" />
                    <ProgressPreview label="Total comprometido" value="129,2%" width="92%" color="bg-gradient-to-r from-orange-500 to-red-600" strong />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProgressPreview({
  label,
  value,
  width,
  color,
  strong = false,
}: {
  label: string
  value: string
  width: string
  color: string
  strong?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
        <span className={cn("font-semibold", strong && "text-red-600")}>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width }} />
      </div>
    </div>
  )
}
