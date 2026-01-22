
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addMonths, format, parse, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"

interface MonthSelectorProps {
  className?: string
}

export function MonthSelector({ className }: MonthSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current date from URL or default to current month
  const currentMonthStr = searchParams.get("month")
  const date = currentMonthStr
    ? parse(currentMonthStr, "yyyy-MM", new Date())
    : new Date()

  const handleMonthChange = (newDate: Date | undefined) => {
    if (!newDate) return
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="capitalize">
              {format(date, "MMMM yyyy", { locale: ptBR })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleMonthChange}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
