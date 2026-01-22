"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  type: "income" | "expense" | "essential" | "non_essential" | "balance"
  className?: string
}

const iconMap = {
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
  essential: Wallet,
  non_essential: ArrowDownCircle,
  balance: TrendingUp,
}

const colorMap = {
  income: {
    bg: "from-green-500/10 to-emerald-500/5",
    border: "border-green-200/50 dark:border-green-800/30",
    icon: "from-green-500 to-emerald-600",
    iconShadow: "shadow-green-500/20",
    text: "text-green-600",
    accent: "bg-green-500",
  },
  expense: {
    bg: "from-red-500/10 to-rose-500/5",
    border: "border-red-200/50 dark:border-red-800/30",
    icon: "from-red-500 to-rose-600",
    iconShadow: "shadow-red-500/20",
    text: "text-red-600",
    accent: "bg-red-500",
  },
  essential: {
    bg: "from-orange-500/10 to-amber-500/5",
    border: "border-orange-200/50 dark:border-orange-800/30",
    icon: "from-orange-500 to-amber-600",
    iconShadow: "shadow-orange-500/20",
    text: "text-orange-600",
    accent: "bg-orange-500",
  },
  non_essential: {
    bg: "from-red-500/10 to-rose-500/5",
    border: "border-red-200/50 dark:border-red-800/30",
    icon: "from-red-500 to-rose-600",
    iconShadow: "shadow-red-500/20",
    text: "text-red-600",
    accent: "bg-red-500",
  },
  balance: {
    bg: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-200/50 dark:border-emerald-800/30",
    icon: "from-emerald-500 to-teal-600",
    iconShadow: "shadow-emerald-500/20",
    text: "text-emerald-600",
    accent: "bg-emerald-500",
  },
}

export function StatCard({ title, value, subtitle, trend, type, className }: StatCardProps) {
  const Icon = iconMap[type]
  const colors = colorMap[type]

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]",
        `bg-gradient-to-br ${colors.bg}`,
        `border ${colors.border}`,
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
          `bg-gradient-to-br ${colors.icon}`,
          `shadow-lg ${colors.iconShadow}`
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className={cn("text-2xl font-bold tracking-tight", colors.text)}>
        {value}
      </p>

      {/* Subtitle or Trend */}
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                trend.isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  className?: string
}

export function StatsGrid({ children, className }: StatsGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  )
}
