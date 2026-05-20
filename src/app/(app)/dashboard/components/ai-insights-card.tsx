"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import Link from "next/link"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  PiggyBank,
  Flame,
  Target,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InsightData {
  totalIncomes: number
  totalExpenses: number
  totalEssential: number
  totalNonEssential: number
  monthlyBalance: number
  emergencyFund: {
    current: number
    target: number
    progress: number
  }
  comparison: {
    prevBalance: number
    balanceChange: number
    prevIncomes: number
    prevExpenses: number
  }
  gamification: {
    streak: number
  }
  expensesByCategory: Array<{
    name: string
    amount: number
    percentage: number
  }>
}

interface Insight {
  id: string
  type: "warning" | "tip" | "achievement" | "alert"
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  priority: number // higher = more important
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

function generateInsights(data: InsightData): Insight[] {
  const insights: Insight[] = []

  // 1. Deficit alert
  if (data.monthlyBalance < 0) {
    const deficit = Math.abs(data.monthlyBalance)
    insights.push({
      id: "deficit",
      type: "alert",
      icon: <ShieldAlert className="w-5 h-5" />,
      title: "Você está no vermelho",
      description: `Suas despesas superaram suas entradas em ${formatCurrency(deficit)} este mês. Revise seus gastos não essenciais para equilibrar o orçamento.`,
      action: { label: "Ver sugestões", href: "/assistente" },
      priority: 100,
    })
  }

  // 2. Non-essential expenses > 30% of income
  if (data.totalIncomes > 0 && data.totalNonEssential / data.totalIncomes > 0.3) {
    const pct = ((data.totalNonEssential / data.totalIncomes) * 100).toFixed(0)
    insights.push({
      id: "non_essential_high",
      type: "warning",
      icon: <AlertTriangle className="w-5 h-5" />,
      title: `Gastos supérfluos em ${pct}% da renda`,
      description: `Especialistas recomendam manter gastos não essenciais abaixo de 30%. Considere revisar assinaturas e delivery.`,
      action: { label: "Analisar despesas", href: "/despesas" },
      priority: 80,
    })
  }

  // 3. Expenses grew vs last month
  if (data.comparison.prevExpenses > 0) {
    const expenseGrowth = ((data.totalExpenses - data.comparison.prevExpenses) / data.comparison.prevExpenses) * 100
    if (expenseGrowth > 15) {
      insights.push({
        id: "expense_growth",
        type: "warning",
        icon: <TrendingUp className="w-5 h-5" />,
        title: `Despesas subiram ${expenseGrowth.toFixed(0)}%`,
        description: `Seus gastos aumentaram significativamente em relação ao mês anterior. Verifique o que mudou.`,
        action: { label: "Comparar meses", href: "/raio-x" },
        priority: 70,
      })
    }
  }

  // 4. Income dropped vs last month
  if (data.comparison.prevIncomes > 0) {
    const incomeDrop = ((data.comparison.prevIncomes - data.totalIncomes) / data.comparison.prevIncomes) * 100
    if (incomeDrop > 10) {
      insights.push({
        id: "income_drop",
        type: "alert",
        icon: <TrendingDown className="w-5 h-5" />,
        title: `Renda caiu ${incomeDrop.toFixed(0)}% vs mês anterior`,
        description: `Sua renda diminuiu significativamente. Considere ajustar seus gastos proporcionalmente.`,
        priority: 75,
      })
    }
  }

  // 5. Emergency fund low
  if (data.emergencyFund.target > 0 && data.emergencyFund.progress < 25) {
    insights.push({
      id: "emergency_low",
      type: "tip",
      icon: <PiggyBank className="w-5 h-5" />,
      title: "Reserva de emergência baixa",
      description: `Sua reserva está em ${data.emergencyFund.progress.toFixed(0)}% da meta. Tente separar pelo menos 10% da renda todo mês.`,
      action: { label: "Ver configurações", href: "/configuracoes" },
      priority: 60,
    })
  }

  // 6. Top spending category
  if (data.expensesByCategory.length > 0) {
    const top = data.expensesByCategory[0]
    if (top.percentage > 40) {
      insights.push({
        id: "top_category",
        type: "tip",
        icon: <Lightbulb className="w-5 h-5" />,
        title: `${top.name} = ${top.percentage.toFixed(0)}% dos gastos`,
        description: `A categoria "${top.name}" concentra ${formatCurrency(top.amount)} das suas despesas. Diversificar gastos pode indicar melhor planejamento.`,
        priority: 50,
      })
    }
  }

  // 7. Positive streak celebration
  if (data.gamification.streak >= 3) {
    insights.push({
      id: "streak",
      type: "achievement",
      icon: <Flame className="w-5 h-5" />,
      title: `${data.gamification.streak} meses no positivo! 🔥`,
      description: `Parabéns! Você mantém um equilíbrio financeiro consistente. Continue assim!`,
      priority: 40,
    })
  }

  // 8. Savings rate excellent
  if (data.totalIncomes > 0) {
    const savingsRate = (data.monthlyBalance / data.totalIncomes) * 100
    if (savingsRate >= 20) {
      insights.push({
        id: "savings_excellent",
        type: "achievement",
        icon: <Target className="w-5 h-5" />,
        title: `Economizando ${savingsRate.toFixed(0)}% da renda`,
        description: `Excelente! Você está guardando mais de 20% da sua renda. Isso coloca você entre os melhores poupadores.`,
        priority: 35,
      })
    }
  }

  // 9. Suggest AI assistant if there are expenses but no insights
  if (insights.length === 0 && data.totalExpenses > 0) {
    insights.push({
      id: "use_assistant",
      type: "tip",
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Converse com o Assistente IA",
      description: `Tire dúvidas sobre investimentos, dívidas ou planejamento. Seu assistente financeiro pessoal está pronto.`,
      action: { label: "Abrir assistente", href: "/assistente" },
      priority: 20,
    })
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3)
}

const typeStyles: Record<Insight["type"], { bg: string; border: string; iconBg: string; iconColor: string }> = {
  alert: {
    bg: "bg-red-50/80 dark:bg-red-950/20",
    border: "border-red-200/60 dark:border-red-800/40",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    bg: "bg-amber-50/80 dark:bg-amber-950/20",
    border: "border-amber-200/60 dark:border-amber-800/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  tip: {
    bg: "bg-blue-50/80 dark:bg-blue-950/20",
    border: "border-blue-200/60 dark:border-blue-800/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  achievement: {
    bg: "bg-green-50/80 dark:bg-green-950/20",
    border: "border-green-200/60 dark:border-green-800/40",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    iconColor: "text-green-600 dark:text-green-400",
  },
}

export function AiInsightsCard({ data }: { data: InsightData }) {
  const insights = useMemo(() => generateInsights(data), [data])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id))

  if (visibleInsights.length === 0) return null

  return (
    <Card variant="elevated" className="relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Insights IA
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                PRO
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Análise proativa das suas finanças
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {visibleInsights.map((insight, index) => {
          const style = typeStyles[insight.type]
          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                style.bg,
                style.border
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg flex-shrink-0", style.iconBg, style.iconColor)}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Link href={insight.action.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 px-2 text-xs gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-100/50 dark:text-violet-400 dark:hover:bg-violet-900/30"
                      >
                        {insight.action.label}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
