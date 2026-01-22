"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Target
} from "lucide-react"

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
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

import { MonthSelector } from "@/app/components/shared/month-selector"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// ... imports ...

export function DashboardClient({ data, currentMonth }: { data: DashboardData, currentMonth: Date }) {
  const isPositiveBalance = data.monthlyBalance >= 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground capitalize">
            Visão geral de {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <MonthSelector />

          <Badge variant={isPositiveBalance ? "default" : "destructive"} className="text-lg px-4 py-2 hidden sm:flex">
            {isPositiveBalance ? <TrendingUp className="w-5 h-5 mr-2" /> : <TrendingDown className="w-5 h-5 mr-2" />}
            {isPositiveBalance ? "Saldo Positivo" : "Saldo Negativo"}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Entradas */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalIncomes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas do mês
            </p>
          </CardContent>
        </Card>

        {/* Despesas Essenciais */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Essenciais</CardTitle>
            <Wallet className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data.totalEssential)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos necessários
            </p>
          </CardContent>
        </Card>

        {/* Despesas Não Essenciais */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Essenciais</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalNonEssential)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos opcionais
            </p>
          </CardContent>
        </Card>

        {/* Sobra do Mês */}
        <Card className={`border-l-4 ${isPositiveBalance ? "border-l-emerald-500" : "border-l-red-500"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sobra do Mês</CardTitle>
            <PiggyBank className={`h-4 w-4 ${isPositiveBalance ? "text-emerald-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositiveBalance ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(data.monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPositiveBalance ? "Disponível para investir" : "Déficit mensal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Fund Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Reserva de Emergência
              </CardTitle>
              <CardDescription>
                Meta: {data.emergencyFund.months} meses de despesas essenciais
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {data.emergencyFund.progress.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={data.emergencyFund.progress} className="h-4" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Atual</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(data.emergencyFund.current)}
              </p>
            </div>
            <Separator orientation="vertical" className="h-12 mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground">Meta Ideal</p>
              <p className="text-lg font-semibold">
                {formatCurrency(data.emergencyFund.ideal)}
              </p>
            </div>
          </div>

          {data.emergencyFund.progress < 100 && (
            <p className="text-sm text-muted-foreground text-center">
              Faltam <span className="font-semibold text-foreground">
                {formatCurrency(data.emergencyFund.ideal - data.emergencyFund.current)}
              </span> para atingir sua meta
            </p>
          )}
        </CardContent>
      </Card>

      {/* Expense Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
            <CardDescription>Essenciais vs Não Essenciais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Essenciais</span>
                  <span className="text-sm text-muted-foreground">
                    {data.totalExpenses > 0
                      ? ((data.totalEssential / data.totalExpenses) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{
                      width: `${data.totalExpenses > 0
                        ? (data.totalEssential / data.totalExpenses) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Não Essenciais</span>
                  <span className="text-sm text-muted-foreground">
                    {data.totalExpenses > 0
                      ? ((data.totalNonEssential / data.totalExpenses) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${data.totalExpenses > 0
                        ? (data.totalNonEssential / data.totalExpenses) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Rápido</CardTitle>
            <CardDescription>Análise do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total de Entradas</span>
                <span className="font-medium text-green-600">{formatCurrency(data.totalIncomes)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total de Despesas</span>
                <span className="font-medium text-red-600">-{formatCurrency(data.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">Saldo Final</span>
                <span className={`font-bold ${isPositiveBalance ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(data.monthlyBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
