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
  Lock,
  PiggyBank,
  Shield,
  TrendingUp,
  Wallet,
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
      trackClassName: "bg-orange-100 dark:bg-orange-950/40",
      barClassName: "bg-orange-500",
    },
    {
      label: "Dívidas e cartão",
      value: diagnosis.currentMonth.debt,
      icon: CreditCard,
      color: "text-red-600",
      trackClassName: "bg-red-100 dark:bg-red-950/40",
      barClassName: "bg-red-500",
    },
    {
      label: "Dia a dia",
      value: diagnosis.currentMonth.dayToDay,
      icon: HeartPulse,
      color: "text-blue-600",
      trackClassName: "bg-blue-100 dark:bg-blue-950/40",
      barClassName: "bg-blue-500",
    },
    {
      label: "Estilo de vida",
      value: diagnosis.currentMonth.lifestyle,
      icon: ArrowDownCircle,
      color: "text-purple-600",
      trackClassName: "bg-purple-100 dark:bg-purple-950/40",
      barClassName: "bg-purple-500",
    },
  ]
  const monthlyOutflow = breakdown.reduce((sum, item) => sum + item.value, 0)

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              description="Renda média menos custo essencial do mês"
              icon={Shield}
              tone={diagnosis.survivalBalance >= 0 ? "green" : "red"}
            />
            <MetricCard
              title="Sobra real"
              value={formatCurrency(diagnosis.realBalance)}
              description="Renda média menos tudo que saiu no mês"
              icon={PiggyBank}
              tone={diagnosis.realBalance >= 0 ? "green" : "red"}
            />
            <MetricCard
              title="Caixa extra necessário"
              value={formatCurrency(diagnosis.cashNeededToday)}
              description={`Você precisaria ter ${formatCurrency(diagnosis.cashNeededToday)} a mais para organizar as saídas do mês`}
              icon={Wallet}
              tone={diagnosis.cashNeededToday > 0 ? "amber" : "green"}
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
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Composição das saídas</p>
                <p className="text-sm font-semibold">{formatCurrency(monthlyOutflow)}</p>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {breakdown.map((item) => {
                  const width = monthlyOutflow > 0 ? (item.value / monthlyOutflow) * 100 : 0

                  return (
                    <div
                      key={item.label}
                      className={cn("h-full", item.barClassName)}
                      style={{ width: `${width}%` }}
                    />
                  )
                })}
              </div>
            </div>

            {breakdown.map((item) => (
              <SpendBreakdownRow
                key={item.label}
                item={item}
                total={monthlyOutflow}
              />
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
          <CardContent className="space-y-6">
            <RatioLine
              label="Essenciais"
              value={diagnosis.essentialIncomePercent}
              tone="orange"
            />
            <RatioLine
              label="Dívidas/cartão"
              value={diagnosis.debtIncomePercent}
              tone="red"
            />
            <RatioLine
              label="Total comprometido"
              value={diagnosis.committedIncomePercent}
              tone={diagnosis.committedIncomePercent > 100 ? "danger" : "green"}
              emphasized
            />

            {user.plan === "free" ? (
              <div className="relative rounded-xl bg-primary/10 border border-primary/20 p-4 overflow-hidden">
                <div className="blur-[3px] select-none pointer-events-none">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Próximo passo recomendado</p>
                      <p className="text-sm text-muted-foreground mt-1">{diagnosis.nextStep}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                  <Link href="/assinatura" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Liberar recomendação com o Pro
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Próximo passo recomendado</p>
                    <p className="text-sm text-muted-foreground mt-1">{diagnosis.nextStep}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated" className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Plano De Ação Inicial</CardTitle>
          <CardDescription>
            O objetivo agora é sair do caos mental e criar uma ordem simples de execução.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {user.plan === "free" && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Plano de Ação Premium</h3>
              <p className="text-sm text-muted-foreground max-w-[300px] mb-4">
                Assine o plano Pro para liberar as sugestões inteligentes da IA e seu plano de recuperação financeira.
              </p>
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                <Link href="/assinatura">Ser Pro</Link>
              </Button>
            </div>
          )}
          <div className={cn("grid gap-4 md:grid-cols-3", user.plan === "free" && "blur-[3px] select-none pointer-events-none")}>
            {diagnosis.recommendations.map((recommendation, index) => (
              <div key={recommendation} className="rounded-xl border p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
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
  tone: "green" | "red" | "amber"
}) {
  const toneClassNames = {
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={cn("h-4 w-4", toneClassNames[tone])} />
      </div>
      <p className={cn("mt-2 text-2xl font-bold", toneClassNames[tone])}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

type BreakdownItem = {
  label: string
  value: number
  icon: typeof Shield
  color: string
  trackClassName: string
  barClassName: string
}

function SpendBreakdownRow({ item, total }: { item: BreakdownItem; total: number }) {
  const share = total > 0 ? (item.value / total) * 100 : 0
  const Icon = item.icon

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", item.trackClassName)}>
            <Icon className={cn("h-5 w-5", item.color)} />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">
              {item.label === "Dívidas e cartão"
                ? "Faturas, empréstimos, parcelas e renegociações detectadas"
                : "Classificação baseada nas categorias e descrições atuais"}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatCurrency(item.value)}</p>
          <p className="text-xs text-muted-foreground">{formatPercent(share)} das saídas</p>
        </div>
      </div>
      <div className={cn("mt-3 h-2 overflow-hidden rounded-full", item.trackClassName)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", item.barClassName)}
          style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

const ratioToneClassNames = {
  orange: {
    track: "bg-orange-100 dark:bg-orange-950/40",
    bar: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-300",
  },
  red: {
    track: "bg-red-100 dark:bg-red-950/40",
    bar: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  green: {
    track: "bg-emerald-100 dark:bg-emerald-950/40",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  danger: {
    track: "bg-red-100 dark:bg-red-950/40",
    bar: "bg-gradient-to-r from-orange-500 to-red-600",
    text: "text-red-700 dark:text-red-300",
  },
}

function RatioLine({
  label,
  value,
  tone,
  emphasized = false,
}: {
  label: string
  value: number
  tone: keyof typeof ratioToneClassNames
  emphasized?: boolean
}) {
  const width = Math.min(Math.max(value, 0), 140) / 1.4
  const toneClassNames = ratioToneClassNames[tone]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className={cn(emphasized ? "font-medium" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-semibold", emphasized && toneClassNames.text)}>{formatPercent(value)}</span>
      </div>
      <div className={cn("relative h-4 overflow-hidden rounded-full", toneClassNames.track)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", toneClassNames.bar)}
          style={{ width: `${width}%` }}
        />
        <div className="absolute left-[71.428%] top-0 h-full w-px bg-background/80" />
      </div>
      {emphasized && value > 100 ? (
        <p className="text-xs font-medium text-red-700 dark:text-red-300">
          Passou da renda média do mês.
        </p>
      ) : null}
    </div>
  )
}
