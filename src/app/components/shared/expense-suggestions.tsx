"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Sparkles, TrendingDown, X, Loader2, Lightbulb, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ExpenseSuggestion {
  description: string
  currentAmount: number
  savingsAmount: number
  priority: "high" | "medium" | "low"
  reason: string
  category?: string
  recurrence?: "monthly" | "once"
}

interface ExpenseSuggestionsData {
  suggestions: ExpenseSuggestion[]
  totalPotentialSavings: number
  summary: string
  monthlyBalance: number
  totalIncomes: number
  totalExpenses: number
  cached?: boolean
}

interface ExpenseSuggestionsProps {
  month?: number
  year?: number
  userPlan: "free" | "pro"
  monthlyBalance?: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800"
    case "medium":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
    case "low":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
    default:
      return "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
  }
}

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Alta"
    case "medium":
      return "Média"
    case "low":
      return "Baixa"
    default:
      return priority
  }
}

export function ExpenseSuggestions({ month, year, userPlan, monthlyBalance: initialBalance }: ExpenseSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [checkingCache, setCheckingCache] = useState(false)
  const [data, setData] = useState<ExpenseSuggestionsData | null>(null)
  const [open, setOpen] = useState(false)
  const [monthlyBalance, setMonthlyBalance] = useState<number | null>(initialBalance ?? null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [needsNewAnalysis, setNeedsNewAnalysis] = useState(false)

  // Check for cached suggestions when modal opens
  useEffect(() => {
    if (!open || userPlan !== "pro") {
      return
    }

    if (initialBalance === undefined || initialBalance >= 0) {
      return
    }

    const checkCache = async () => {
      setCheckingCache(true)
      try {
        const params = new URLSearchParams()
        if (month) params.set("month", month.toString())
        if (year) params.set("year", year.toString())

        const response = await fetch(`/api/expense-suggestions?${params.toString()}`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.cached && result.suggestions && result.suggestions.length > 0) {
            setData(result)
            setMonthlyBalance(result.monthlyBalance)
            setHasAnalyzed(true)
            setNeedsNewAnalysis(false)
          } else if (result.suggestions && result.suggestions.length > 0) {
            setData(result)
            setMonthlyBalance(result.monthlyBalance)
            setHasAnalyzed(true)
            setNeedsNewAnalysis(false)
          } else {
            setNeedsNewAnalysis(true)
          }
        }
      } catch (error) {
        console.error("Error checking cache:", error)
        setNeedsNewAnalysis(true)
      } finally {
        setCheckingCache(false)
      }
    }

    checkCache()
  }, [open, month, year, userPlan, initialBalance])

  useEffect(() => {
    if (initialBalance !== undefined) {
      setMonthlyBalance(initialBalance)
      if (initialBalance < 0 && !data) {
        setHasAnalyzed(false)
        setNeedsNewAnalysis(true)
      }
    }
  }, [initialBalance])

  const handleAnalyze = async (forceNew = false) => {
    setLoading(true)
    setHasAnalyzed(true)
    try {
      const params = new URLSearchParams()
      if (month) params.set("month", month.toString())
      if (year) params.set("year", year.toString())
      if (forceNew) params.set("force", "true")

      const response = await fetch(`/api/expense-suggestions?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Esta funcionalidade está disponível apenas no plano Pro")
          return
        }
        throw new Error("Erro ao buscar sugestões")
      }

      const result = await response.json()
      setData(result)
      setMonthlyBalance(result.monthlyBalance)
      setNeedsNewAnalysis(false)
      
      if (result.cached) {
        toast.info("Sugestões carregadas do cache")
      } else {
        toast.success("Análise concluída!")
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast.error("Erro ao analisar gastos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not Pro
  if (userPlan !== "pro") {
    return null
  }

  // Only show button if user is in the red
  if (monthlyBalance === null || monthlyBalance >= 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-800 dark:hover:bg-orange-950/30"
        >
          <Lightbulb className="w-4 h-4" />
          Sugestões de Economia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">Sugestões de Economia</DialogTitle>
              <DialogDescription className="mt-1">
                {data?.summary || "Análise inteligente dos seus gastos para identificar oportunidades de economia"}
              </DialogDescription>
            </div>
            {data?.cached && (
              <Badge variant="outline" className="text-xs">
                Cache
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Loading State */}
          {checkingCache && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                <p className="text-sm text-muted-foreground">Verificando dados do mês atual...</p>
              </div>
            </div>
          )}

          {/* No Data - Show Analyze Button */}
          {!checkingCache && (!data || needsNewAnalysis) && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Análise de Economia Disponível</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Você está gastando mais do que ganha este mês. Nossa IA pode analisar seus gastos e sugerir onde economizar.
                </p>
              </div>
              <Button
                onClick={() => handleAnalyze(false)}
                disabled={loading}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analisar meus gastos
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {!checkingCache && data && data.suggestions.length > 0 && (
            <>
              {/* Total Savings Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-200/50 dark:border-green-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Economia Potencial</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(data.totalPotentialSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Se você seguir as sugestões de alta e média prioridade
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <TrendingDown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base">Sugestões de Corte</h3>
                  {data.cached && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnalyze(true)}
                      disabled={loading}
                      className="gap-2 text-xs"
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Atualizar análise
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {data.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-xl border bg-card hover:border-orange-300 dark:hover:border-orange-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-semibold text-base">{suggestion.description}</h4>
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-medium", getPriorityColor(suggestion.priority))}
                              >
                                {getPriorityLabel(suggestion.priority)}
                              </Badge>
                              {suggestion.category && (
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {suggestion.reason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Gasto Atual</p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(suggestion.currentAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Economia</p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(suggestion.savingsAmount)}
                            </p>
                          </div>
                          {suggestion.recurrence === "monthly" && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Recorrência</p>
                              <p className="text-xs font-medium">Mensal</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">💡 Dica</p>
                    <p className="text-xs text-muted-foreground">
                      Comece cortando as sugestões de alta prioridade para maior impacto. Foque especialmente em gastos recorrentes no cartão de crédito.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
