"use client"

import Link from "next/link"
import { Activity, ArrowLeft, BadgeCheck, CreditCard, LockKeyhole, PiggyBank, Shield, TrendingDown } from "lucide-react"
import { UserAuthForm } from "@/app/login/components/user-auth-form"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"
import { cn } from "@/lib/utils"

const previewRows = [
  { label: "Essenciais", value: "R$ 1.793", color: "bg-orange-500" },
  { label: "Dívidas/cartão", value: "R$ 2.228", color: "bg-red-500" },
  { label: "Estilo de vida", value: "R$ 9.025", color: "bg-violet-500" },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r bg-muted/30 lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:52px_52px] opacity-40" />
          <div className="relative flex min-h-screen flex-col justify-between p-10 xl:p-14">
            <Link href="/" className="flex w-fit items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PiggyBank className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Penochão</span>
            </Link>

            <div className="max-w-xl">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm">
                <Activity className="h-4 w-4 text-primary" />
                Dados financeiros criptografados
              </div>
              <h1 className="text-4xl font-bold tracking-tight xl:text-5xl">
                Entre para ver onde o dinheiro está travando
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                O app separa sobrevivência, dívidas e consumo para mostrar o próximo passo com menos ruído.
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-elevated">
                <div className="border-b bg-muted/40 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Diagnóstico do mês</p>
                        <p className="text-xs text-muted-foreground">Prévia do Raio-X</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Em alerta
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3">
                    <PreviewMetric label="Renda" value="R$ 10.098" tone="text-emerald-600" icon={Shield} />
                    <PreviewMetric label="Sobra real" value="-R$ 2.948" tone="text-red-600" icon={TrendingDown} />
                    <PreviewMetric label="Caixa extra" value="R$ 3.000" tone="text-amber-600" icon={CreditCard} />
                  </div>

                  <div className="mt-5 space-y-3">
                    {previewRows.map((row) => (
                      <div key={row.label} className="rounded-lg border bg-background p-3">
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-semibold">{row.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", row.color)} style={{ width: row.label === "Estilo de vida" ? "69%" : row.label === "Dívidas/cartão" ? "17%" : "14%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="max-w-md text-sm text-muted-foreground">
              Todos os dados financeiros sensíveis ficam criptografados. Você pode excluir sua conta quando quiser.
            </p>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a home
            </Link>

            <div className="mb-8 lg:hidden">
              <Link href="/" className="mb-5 flex w-fit items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">Penochão</span>
              </Link>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-primary">Acesse sua conta</p>
              <h1 className="text-3xl font-bold tracking-tight">Continue seu diagnóstico</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use seu e-mail ou Google para entrar. Se for seu primeiro acesso, a conta é criada automaticamente.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <UserAuthForm />
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs leading-5 text-muted-foreground">
                Entradas, despesas, descrições e valores financeiros são armazenados criptografados.
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <Link href="/termos" className="underline underline-offset-4 hover:text-primary">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

function PreviewMetric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  tone: string
  icon: typeof Shield
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn("h-3.5 w-3.5", tone)} />
      </div>
      <p className={cn("text-base font-bold", tone)}>{value}</p>
    </div>
  )
}
