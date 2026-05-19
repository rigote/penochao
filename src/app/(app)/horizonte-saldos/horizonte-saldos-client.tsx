"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DayBalance {
  day: number
  balance: number
}

interface MonthData {
  month: string
  label: string
  days: DayBalance[]
}

const formatCompact = (value: number) => {
  const abs = Math.abs(value)
  if (abs >= 1000) {
    return `${value < 0 ? "-" : ""}${(abs / 1000).toFixed(abs >= 10000 ? 1 : 2)}K`
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

const getBalanceColor = (balance: number) => {
  if (balance > 0) {
    const intensity = Math.min(balance / 10000, 1)
    return {
      bg: `rgba(34, 197, 94, ${0.1 + intensity * 0.35})`,
      text: "text-green-700 dark:text-green-400",
    }
  }
  if (balance < 0) {
    const intensity = Math.min(Math.abs(balance) / 10000, 1)
    return {
      bg: `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`,
      text: "text-red-700 dark:text-red-400",
    }
  }
  return { bg: "transparent", text: "text-muted-foreground" }
}

export function HorizonteSaldosClient() {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM"))
  const [monthsCount, setMonthsCount] = useState("3")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/balance-horizon?start=${startDate}&months=${monthsCount}`
      )
      if (res.ok) {
        const json = await res.json()
        setData(json.months)
      }
    } catch (error) {
      console.error("Error fetching horizon data:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, monthsCount])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePrevious = () => {
    const [y, m] = startDate.split("-").map(Number)
    const prev = new Date(y, m - 2, 15)
    setStartDate(format(prev, "yyyy-MM"))
  }

  const handleNext = () => {
    const [y, m] = startDate.split("-").map(Number)
    const next = new Date(y, m, 15)
    setStartDate(format(next, "yyyy-MM"))
  }

  // Calculate the max number of days (31) to align the grid
  const maxDays = 31

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Projeção</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Horizonte de Saldos
          </h1>
          <p className="text-muted-foreground mt-1">
            Projeção diária do saldo acumulado mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select value={monthsCount} onValueChange={setMonthsCount}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl">
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="4">4 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum dado encontrado para o período.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {data.map((month) => (
                      <th
                        key={month.month}
                        colSpan={2}
                        className="text-center font-semibold py-2.5 px-2 text-xs uppercase tracking-wider border-r last:border-r-0"
                      >
                        <span className="capitalize">
                          {(() => {
                            const [y, m] = month.month.split("-").map(Number)
                            return format(new Date(y, m - 1, 15), "MMM/yy", { locale: ptBR })
                          })()}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxDays }, (_, dayIndex) => (
                    <tr key={dayIndex} className="border-b last:border-b-0">
                      {data.map((month) => {
                        const dayData = month.days[dayIndex]
                        if (!dayData) {
                          return (
                            <td
                              key={`${month.month}-day-${dayIndex}`}
                              colSpan={2}
                              className="border-r last:border-r-0"
                            >
                              &nbsp;
                            </td>
                          )
                        }
                        const color = getBalanceColor(dayData.balance)
                        return (
                          <td
                            key={`${month.month}-day-${dayIndex}`}
                            colSpan={2}
                            className="border-r last:border-r-0 px-0"
                          >
                            <div
                              className="flex items-center justify-between px-2.5 py-1.5"
                              style={{ backgroundColor: color.bg }}
                            >
                              <span className="text-xs text-muted-foreground font-medium w-6 tabular-nums">
                                {dayData.day}
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-semibold tabular-nums",
                                  color.text
                                )}
                              >
                                {formatCompact(dayData.balance)}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
