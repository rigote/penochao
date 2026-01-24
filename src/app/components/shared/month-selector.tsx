"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addMonths, format, parse, subMonths, isSameMonth, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { toast } from "sonner"

interface MonthSelectorProps {
  className?: string
  userPlan?: "free" | "pro"
}

export function MonthSelector({ className, userPlan = "free" }: MonthSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Get current date from URL or default to current month
  const currentMonthStr = searchParams.get("month")
  const date = currentMonthStr
    ? parse(currentMonthStr, "yyyy-MM", new Date())
    : new Date()

  const today = new Date()

  const handleMonthChange = (newDate: Date | undefined) => {
    if (!newDate) return

    // Free tier restriction: strict locking to current month
    if (userPlan === "free" && !isSameMonth(newDate, today)) {
      toast.error("Funcionalidade Premium", {
        description: "O plano gratuito foca no presente. Faça upgrade para viajar no tempo.",
        icon: <Lock className="w-4 h-4" />,
        action: {
          label: "Ver Planos",
          onClick: () => { } // TODO redirect
        }
      })
      return
    }

    const newMonthStr = format(newDate, "yyyy-MM")
    const params = new URLSearchParams(searchParams)
    params.set("month", newMonthStr)
    router.push(`?${params.toString()}`)
  }

  const handlePreviousMonth = () => {
    handleMonthChange(subMonths(date, 1))
  }

  const handleNextMonth = () => {
    handleMonthChange(addMonths(date, 1))
  }

  // Generate month and year options
  const currentYear = date.getFullYear()
  const currentMonth = date.getMonth()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()

  // Generate years (current year ± 2 years)
  const years = Array.from({ length: 5 }, (_, i) => todayYear - 2 + i)
  
  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(2024, i, 1)
    return {
      value: i.toString(),
      label: format(monthDate, "MMMM", { locale: ptBR })
    }
  })

  const handleMonthSelect = (monthIndex: string) => {
    const newDate = new Date(currentYear, parseInt(monthIndex), 1)
    handleMonthChange(newDate)
  }

  const handleYearSelect = (yearStr: string) => {
    const newYear = parseInt(yearStr)
    const newDate = new Date(newYear, currentMonth, 1)
    handleMonthChange(newDate)
  }

  const isDateDisabled = (checkDate: Date) => {
    return userPlan === "free" && !isSameMonth(checkDate, today)
  }

  return (
    <div className={cn("flex items-center gap-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-1 rounded-xl border border-border/50 shadow-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousMonth}
        disabled={userPlan === "free"}
        className={cn(
          "h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all",
          userPlan === "free" && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {userPlan === "free" ? <Lock className="h-3 w-3" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex items-center gap-2 px-2" suppressHydrationWarning>
        <Select
          value={currentMonth.toString()}
          onValueChange={handleMonthSelect}
          disabled={userPlan === "free" && currentYear === todayYear || !mounted}
        >
          <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent hover:bg-white dark:hover:bg-zinc-800 font-medium text-sm">
            <SelectValue>
              <span className="capitalize">
                {format(date, "MMMM", { locale: ptBR })}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => {
              const monthDate = new Date(currentYear, index, 1)
              const disabled = isDateDisabled(monthDate)
              return (
                <SelectItem 
                  key={month.value} 
                  value={month.value}
                  disabled={disabled}
                  className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <span className="capitalize">{month.label}</span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select
          value={currentYear.toString()}
          onValueChange={handleYearSelect}
          disabled={userPlan === "free" || !mounted}
        >
          <SelectTrigger className="w-[80px] h-8 border-0 bg-transparent hover:bg-white dark:hover:bg-zinc-800 font-medium text-sm">
            <SelectValue>{currentYear}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => {
              const yearDate = new Date(year, currentMonth, 1)
              const disabled = userPlan === "free" && year !== todayYear
              return (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  disabled={disabled}
                  className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {year}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        disabled={userPlan === "free"}
        className={cn(
          "h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all",
          userPlan === "free" && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {userPlan === "free" ? <Lock className="h-3 w-3" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}
