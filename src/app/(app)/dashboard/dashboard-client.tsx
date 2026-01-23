"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { SimpleBarChart, DonutChart } from "@/app/components/ui/charts"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  Trophy,
  Flame,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Plus
} from "lucide-react"
import { MonthSelector } from "@/app/components/shared/month-selector"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  target?: number
}

interface DashboardData {
  month: number
  year: number
  totalIncomes: number
  totalEssential: number
  totalNonEssential: number
  totalExpenses: number
  monthlyBalance: number
  emergencyFund: {
    current: number
    target: number
    ideal: number
    months: number
    progress: number
  }
  historicalData: Array<{
    name: string
    month: string
    entradas: number
    despesas: number
    saldo: number
  }>
  comparison: {
    prevBalance: number
    balanceChange: number
    prevIncomes: number
    prevExpenses: number
  }
  gamification: {
    streak: number
    totalTransactions: number
    achievements: Achievement[]
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatCompactCurrency = (value: number) => {
  if (value >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }
  return formatCurrency(value)
}

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { FileDown } from "lucide-react"

// ... imports remain the same

export function DashboardClient({ data, currentMonth, userName, userPlan }: { data: DashboardData, currentMonth: Date, userName: string | null, userPlan: "free" | "pro" }) {
  const [showAllAchievements, setShowAllAchievements] = useState(false)

  const handleExport = () => {
    if (userPlan === "free") {
      toast.error("Funcionalidade disponível apenas no plano Pro")
      return
    }

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("Relatório Mensal - Penochão", 14, 22)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
    doc.text(`Referência: ${format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}`, 14, 35)

    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Resumo Financeiro', 'Valor']],
      body: [
        ['Total de Entradas', formatCurrency(data.totalIncomes)],
        ['Despesas Essenciais', formatCurrency(data.totalEssential)],
        ['Despesas Não Essenciais', formatCurrency(data.totalNonEssential)],
        ['Total de Despesas', formatCurrency(data.totalExpenses)],
        ['Saldo Final', formatCurrency(data.monthlyBalance)],
        ['Reserva de Emergência', `${data.emergencyFund.progress.toFixed(1)}% (${formatCurrency(data.emergencyFund.current)})`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }, // Purple
    })

    // Evolution Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Mês', 'Entradas', 'Despesas', 'Saldo']],
      body: data.historicalData.map(d => [
        d.name,
        formatCurrency(d.entradas),
        formatCurrency(d.despesas),
        formatCurrency(d.saldo)
      ]),
      theme: 'striped',
    })

    doc.save(`relatorio-penochao-${format(currentMonth, "MM-yyyy")}.pdf`)
    toast.success("Relatório exportado com sucesso!")
  }

  const isPositiveBalance = data.monthlyBalance >= 0
  const savingsRate = data.totalIncomes > 0
    ? ((data.monthlyBalance / data.totalIncomes) * 100).toFixed(0)
    : "0"

  const essentialPercentage = data.totalExpenses > 0
    ? (data.totalEssential / data.totalExpenses) * 100
    : 0
  const nonEssentialPercentage = data.totalExpenses > 0
    ? (data.totalNonEssential / data.totalExpenses) * 100
    : 0

  // Prepare donut chart data
  const expenseDistribution = [
    { name: "Essenciais", value: data.totalEssential, color: "#f97316" },
    { name: "Não Essenciais", value: data.totalNonEssential, color: "#ef4444" },
  ].filter(item => item.value > 0)

  // Achievements
  const unlockedAchievements = data.gamification.achievements.filter(a => a.unlocked)
  const lockedAchievements = data.gamification.achievements.filter(a => !a.unlocked)
  const displayedAchievements = showAllAchievements
    ? data.gamification.achievements
    : [...unlockedAchievements.slice(0, 3), ...lockedAchievements.slice(0, 2)]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Bem-vindo!'}
          </h1>
          <p className="text-muted-foreground mt-1 capitalize">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />

          {/* Streak Badge */}
          {data.gamification.streak > 0 && (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-600">{data.gamification.streak}</span>
              <span className="text-xs text-orange-600/80">meses</span>
            </Badge>
          )}

          <Badge
            variant={isPositiveBalance ? "success" : "destructive"}
            className="text-sm px-4 py-2 hidden sm:flex gap-2"
          >
            {isPositiveBalance ? (
              <>
                <TrendingUp className="w-4 h-4" />
                +{savingsRate}% economia
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                Déficit mensal
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Link href="/entradas" className="contents sm:block">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Entrada
          </Button>
        </Link>
        <Link href="/despesas" className="contents sm:block">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-800 dark:hover:bg-rose-950/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Despesa
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className={cn(
            "w-full sm:w-auto gap-1.5 transition-all text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/30",
            userPlan === "free" && "opacity-70"
          )}
        >
          {userPlan === "free" ? <Lock className="w-3.5 h-3.5" /> : <FileDown className="w-3.5 h-3.5" />}
          Exportar
        </Button>
      </div>

      {/* Main Balance Card */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

        <CardContent className="relative pt-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance */}
            <div className="lg:col-span-1 flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Saldo do mês
              </p>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${isPositiveBalance ? "text-green-600" : "text-red-600"}`}>
                {isPositiveBalance ? "+" : ""}{formatCurrency(data.monthlyBalance)}
              </div>

              {/* Comparison with previous month */}
              <div className="flex items-center gap-2 mt-3">
                {data.comparison.balanceChange !== 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      data.comparison.balanceChange > 0
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 text-green-700"
                        : "bg-red-50 dark:bg-red-950/30 border-red-200 text-red-700"
                    )}
                  >
                    {data.comparison.balanceChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {data.comparison.balanceChange > 0 ? "+" : ""}
                    {data.comparison.balanceChange.toFixed(0)}% vs mês anterior
                  </Badge>
                )}
              </div>
            </div>

            {/* Income vs Expenses */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <Link href="/entradas" className="group">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-200/50 dark:border-green-800/30 hover:border-green-300 dark:hover:border-green-700 transition-all hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <ArrowUpCircle className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Entradas</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 truncate">{formatCurrency(data.totalIncomes)}</p>
                </div>
              </Link>

              <Link href="/despesas" className="group">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-200/50 dark:border-red-800/30 hover:border-red-300 dark:hover:border-red-700 transition-all hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                      <ArrowDownCircle className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Despesas</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 truncate">{formatCurrency(data.totalExpenses)}</p>
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - 6 months comparison */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>
                  Últimos 6 meses de movimentação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            {userPlan === "free" && (
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Histórico Completo</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mb-4">
                  Desbloqueie o histórico de 6 meses no plano Pro.
                </p>
                <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity">
                  Ser Pro
                </Button>
              </div>
            )}
            <SimpleBarChart
              data={data.historicalData}
              bars={[
                { dataKey: "entradas", color: "#22c55e", name: "Entradas" },
                { dataKey: "despesas", color: "#ef4444", name: "Despesas" },
              ]}
              height={250}
              formatter={(v) => formatCompactCurrency(v)}
            />
          </CardContent>
        </Card>

        {/* Donut Chart - Expense Distribution */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Distribuição de Despesas</CardTitle>
                <CardDescription>
                  Essenciais vs Não Essenciais
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenseDistribution.length > 0 ? (
              <div className="flex items-center gap-8">
                <DonutChart
                  data={expenseDistribution}
                  height={180}
                  innerRadius={45}
                  outerRadius={75}
                />
                <div className="space-y-3 flex-1">
                  {/* Total */}
                  <div className="pb-3 border-b">
                    <p className="text-xs text-muted-foreground mb-1">Total de Despesas</p>
                    <p className="text-2xl font-bold">{formatCompactCurrency(data.totalExpenses)}</p>
                  </div>

                  {/* Essenciais */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Essenciais</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{formatCompactCurrency(data.totalEssential)}</p>
                      <p className="text-xs text-muted-foreground">{essentialPercentage.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Não Essenciais */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Não Essenciais</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCompactCurrency(data.totalNonEssential)}</p>
                      <p className="text-xs text-muted-foreground">{nonEssentialPercentage.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Nenhuma despesa registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card intent="warning" interactive>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Essenciais</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600 truncate">
              {formatCurrency(data.totalEssential)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(essentialPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {essentialPercentage.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card intent="danger" interactive>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Essenciais</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
              {formatCurrency(data.totalNonEssential)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-500"
                  style={{ width: `${Math.min(nonEssentialPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {nonEssentialPercentage.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card intent="success" interactive>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold truncate ${isPositiveBalance ? "text-emerald-600" : "text-red-600"}`}>
              {isPositiveBalance ? "+" : ""}{formatCurrency(data.monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isPositiveBalance
                ? `${savingsRate}% da renda`
                : "Déficit no mês"
              }
            </p>
          </CardContent>
        </Card>

        <Card intent="info" interactive>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserva</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {data.emergencyFund.progress.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(data.emergencyFund.progress, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gamification & Emergency Fund */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Achievements */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Conquistas</CardTitle>
                  <CardDescription>
                    {unlockedAchievements.length} de {data.gamification.achievements.length} desbloqueadas
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                {data.gamification.streak} meses
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all",
                  achievement.unlocked
                    ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30"
                    : "bg-muted/50 border border-border opacity-60"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  achievement.unlocked
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20"
                    : "bg-muted"
                )}>
                  {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium truncate",
                      !achievement.unlocked && "text-muted-foreground"
                    )}>
                      {achievement.title}
                    </p>
                    {achievement.unlocked && (
                      <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {data.gamification.achievements.length > 5 && (
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => setShowAllAchievements(!showAllAchievements)}
              >
                {showAllAchievements ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Ver todas ({data.gamification.achievements.length})
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Emergency Fund */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Reserva de Emergência</CardTitle>
                  <CardDescription>
                    Meta: {data.emergencyFund.months} meses de despesas
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3">
                {data.emergencyFund.progress.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={data.emergencyFund.progress} className="h-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">Acumulado</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(data.emergencyFund.current)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Meta Ideal</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.emergencyFund.ideal)}
                </p>
              </div>
            </div>

            {data.emergencyFund.progress < 100 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Faltam {formatCurrency(data.emergencyFund.ideal - data.emergencyFund.current)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    para atingir sua meta de segurança financeira
                  </p>
                </div>
              </div>
            )}

            <Link href="/configuracoes" className="block mt-2">
              <Button variant="outline" className="w-full gap-2">
                <Target className="w-4 h-4" />
                Configurar Metas
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
