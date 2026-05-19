import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  HeartPulse,
  PiggyBank,
  Shield,
  TrendingUp,
} from "lucide-react"
import { db } from "@/db"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { buildFinancialDiagnosis, type FinancialRiskLevel } from "@/lib/financial-diagnosis"
import { resolveEffectiveUserPlan } from "@/lib/subscription"
import { cn } from "@/lib/utils"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const formatPercent = (value: number) =>
  `${Math.round(value * 10) / 10}%`

const riskConfig: Record<FinancialRiskLevel, {
  label: string
  className: string
  progress: number
}> = {
  stable: {
    label: "Estável",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    progress: 25,
  },
  tight: {
    label: "Apertado",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    progress: 45,
  },
  alert: {
    label: "Em alerta",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    progress: 65,
  },
  critical: {
    label: "Crítico",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    progress: 82,
  },
  emergency: {
    label: "Emergência",
    className: "bg-red-600 text-white",
    progress: 100,
  },
}

export default async function RaioXPage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const foundUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!foundUser) {
    redirect("/login")
  }

  const user = await resolveEffectiveUserPlan(foundUser)
  const diagnosis = await buildFinancialDiagnosis(user.id)
  const risk = riskConfig[diagnosis.riskLevel]

  const breakdown = [
    {
      label: "Essenciais",
      value: diagnosis.currentMonth.essential,
      icon: Shield,
      color: "text-orange-600",
    },
    {
      label: "Dívidas e cartão",
      value: diagnosis.currentMonth.debt,
      icon: CreditCard,
      color: "text-red-600",
    },
    {
      label: "Dia a dia",
      value: diagnosis.currentMonth.dayToDay,
      icon: HeartPulse,
      color: "text-blue-600",
    },
    {
      label: "Estilo de vida",
      value: diagnosis.currentMonth.lifestyle,
      icon: ArrowDownCircle,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Diagnóstico financeiro</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Raio-X Financeiro</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Uma visão crua para separar sobrevivência, dívidas e folga real antes de tomar decisões.
          </p>
        </div>

        <Badge className={cn("w-fit text-sm px-3 py-1", risk.className)}>
          Risco: {risk.label}
        </Badge>
      </div>

      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-muted/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">{diagnosis.headline}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {diagnosis.mainProblem}
              </CardDescription>
            </div>
            <div className="rounded-xl bg-background border p-4 min-w-56">
              <p className="text-xs text-muted-foreground mb-2">Termômetro financeiro</p>
              <Progress value={risk.progress} />
              <p className="text-xs text-muted-foreground mt-2">
                Quanto mais alto, mais urgente é estabilizar o mês atual.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Renda média"
              value={formatCurrency(diagnosis.averageIncome)}
              description="Média dos últimos meses com renda registrada"
              icon={TrendingUp}
              tone="green"
            />
            <MetricCard
              title="Sobra de sobrevivência"
              value={formatCurrency(diagnosis.survivalBalance)}
              description="Renda média menos custo essencial"
              icon={Shield}
              tone={diagnosis.survivalBalance >= 0 ? "green" : "red"}
            />
            <MetricCard
              title="Sobra real"
              value={formatCurrency(diagnosis.realBalance)}
              description="Renda média menos tudo que saiu"
              icon={PiggyBank}
              tone={diagnosis.realBalance >= 0 ? "green" : "red"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>O Que Está Pesando Neste Mês</CardTitle>
            <CardDescription>
              O Penochão separa o que mantém sua vida funcionando do que precisa ser isolado para negociação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.label === "Dívidas e cartão"
                        ? "Faturas, empréstimos, parcelas e renegociações detectadas"
                        : "Classificação baseada nas categorias e descrições atuais"}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(item.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Comprometimento Da Renda</CardTitle>
            <CardDescription>
              Uma vida empatada no zero tende a virar dívida no primeiro imprevisto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RatioLine label="Essenciais" value={diagnosis.essentialIncomePercent} />
            <RatioLine label="Dívidas/cartão" value={diagnosis.debtIncomePercent} />
            <RatioLine label="Total comprometido" value={diagnosis.committedIncomePercent} />

            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Próximo passo recomendado</p>
                  <p className="text-sm text-muted-foreground mt-1">{diagnosis.nextStep}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Plano De Ação Inicial</CardTitle>
          <CardDescription>
            O objetivo agora é sair do caos mental e criar uma ordem simples de execução.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {diagnosis.recommendations.map((recommendation, index) => (
            <div key={recommendation} className="rounded-xl border p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed">{recommendation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BadgeCheck className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-semibold">Para melhorar o diagnóstico</p>
              <p className="text-sm text-muted-foreground">
                Cadastre as entradas e despesas dos últimos meses e marque faturas, empréstimos e parcelas com descrições claras.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/faturas">
              Importar faturas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  description: string
  icon: typeof TrendingUp
  tone: "green" | "red"
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={cn("h-4 w-4", tone === "green" ? "text-emerald-600" : "text-red-600")} />
      </div>
      <p className={cn("mt-2 text-2xl font-bold", tone === "green" ? "text-emerald-600" : "text-red-600")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function RatioLine({ label, value }: { label: string; value: number }) {
  const capped = Math.min(Math.max(value, 0), 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatPercent(value)}</span>
      </div>
      <Progress value={capped} />
    </div>
  )
}
