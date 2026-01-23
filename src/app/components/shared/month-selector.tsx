"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addMonths, format, parse, subMonths, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"
import { toast } from "sonner"

interface MonthSelectorProps {
  className?: string
  userPlan?: "free" | "pro"
}

export function MonthSelector({ className, userPlan = "free" }: MonthSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-[160px] justify-center text-center font-medium h-8 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            <span className="capitalize text-sm">
              {format(date, "MMMM yyyy", { locale: ptBR })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleMonthChange}
            initialFocus
            locale={ptBR}
            disabled={(day) => userPlan === "free" && !isSameMonth(day, today)}
          />
          {userPlan === "free" && (
            <div className="p-3 bg-muted/30 border-t text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              <span>Navegação restrita ao plano Free</span>
            </div>
          )}
        </PopoverContent>
      </Popover>

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
