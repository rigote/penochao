"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog"
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  CalendarDays,
  Send,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format, getDaysInMonth, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DailyItem {
  id: string
  description: string
  amount: number
}

const STORAGE_KEY = "penochao-previsao-diaria"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

export function PrevisaoDiariaClient({ userPlan = "free" }: { userPlan?: "free" | "pro" }) {
  const router = useRouter()
  const [items, setItems] = useState<DailyItem[]>([])
  const [days, setDays] = useState("30")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), "yyyy-MM")
  )

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.items) setItems(parsed.items)
        if (parsed.days) setDays(parsed.days)
      }
    } catch {
      // ignore parse errors
    }
    setMounted(true)
  }, [])

  // Save to localStorage
  const save = useCallback(
    (newItems: DailyItem[], newDays: string) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items: newItems, days: newDays })
        )
      } catch {
        // ignore quota errors
      }
    },
    []
  )

  const totalMensal = items.reduce((sum, item) => sum + item.amount, 0)
  const dailyBudget = Number(days) > 0 ? totalMensal / Number(days) : 0

  // Calculate month options (current + next 11 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = addMonths(new Date(), i)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR }),
    }
  })

  // Calculate how many days the selected month has
  const selectedMonthDate = new Date(selectedMonth + "-01T00:00:00")
  const daysInSelectedMonth = getDaysInMonth(selectedMonthDate)

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount.replace(",", "."))
    if (!description.trim() || isNaN(parsed) || parsed <= 0) return

    const newItem: DailyItem = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parsed,
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    save(newItems, days)
    setDescription("")
    setAmount("")
    setDialogOpen(false)
  }

  function handleRemoveItem(id: string) {
    const newItems = items.filter((i) => i.id !== id)
    setItems(newItems)
    save(newItems, days)
  }

  function handleDaysChange(val: string) {
    setDays(val)
    save(items, val)
  }

  async function handleApplyToPlan() {
    if (dailyBudget <= 0 || items.length === 0) return

    setIsApplying(true)
    try {
      // Create one expense per day in the selected month
      const promises = Array.from({ length: daysInSelectedMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, "0")
        const dateStr = `${selectedMonth}-${day}`

        return fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: "Previsão diária",
            amount: Math.round(dailyBudget * 100) / 100,
            occurrenceDate: dateStr,
            type: "non_essential",
            recurrence: "once",
          }),
        })
      })

      // Execute in batches of 5 to avoid overloading
      for (let i = 0; i < promises.length; i += 5) {
        const batch = promises.slice(i, i + 5)
        await Promise.all(batch)
      }

      toast.success(
        `${daysInSelectedMonth} lançamentos criados com sucesso!`,
        {
          description: `${formatCurrency(dailyBudget)}/dia em ${format(selectedMonthDate, "MMMM yyyy", { locale: ptBR })}`,
        }
      )
      setPlanDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error applying to plan:", error)
      toast.error("Erro ao criar lançamentos. Tente novamente.")
    } finally {
      setIsApplying(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Ferramenta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Previsão de Diário
        </h1>
        <p className="text-muted-foreground mt-1">
          Adicione seus gastos mensais aproximados para calcular a previsão
          diária.
        </p>
      </div>

      {/* Items List */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <CardContent className="relative pt-6 pb-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <button
                onClick={() => setDialogOpen(true)}
                className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <Plus className="w-6 h-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </button>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Adicione seus gastos mensais aproximados para calcular a
                previsão de diário.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3.5 group"
                >
                  <span className="text-sm font-medium truncate flex-1 mr-3">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Add button */}
        {items.length > 0 && (
          <div className="px-6 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Adicionar gasto
            </Button>
          </div>
        )}
      </Card>

      {/* Summary Card */}
      <Card
        variant="elevated"
        className="border-t-4 border-t-primary overflow-hidden"
      >
        <CardContent className="pt-6 space-y-4">
          {/* Total mensal */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total mensal
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatCurrency(totalMensal)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Dividido por */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Dividido por
            </span>
            <Select value={days} onValueChange={handleDaysChange}>
              <SelectTrigger className="w-[120px] h-9">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl">
                <SelectItem value="28">28 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="31">31 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Daily forecast */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Previsão diária</span>
            </div>
            <span
              className={cn(
                "text-2xl sm:text-3xl font-bold tracking-tight tabular-nums",
                dailyBudget > 0 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {formatCurrency(dailyBudget)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Apply to Plan Button */}
      {items.length > 0 && dailyBudget > 0 && (
        <Button
          className="w-full gap-2 h-12 text-base bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          onClick={() => {
            if (userPlan === "free") {
              setUpgradeDialogOpen(true)
            } else {
              setPlanDialogOpen(true)
            }
          }}
        >
          {userPlan === "free" ? (
            <>
              <Lock className="w-4 h-4" />
              Adicionar ao planejamento (Premium)
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Adicionar ao planejamento
            </>
          )}
        </Button>
      )}

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar gasto mensal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-description">Descrição</Label>
              <Input
                id="item-description"
                placeholder="Ex: Aluguel, Mercado, Transporte..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-amount">Valor mensal</Label>
              <Input
                id="item-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Apply to Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Adicionar ao planejamento
            </DialogTitle>
            <DialogDescription>
              Isso criará um lançamento de despesa por dia no mês selecionado com
              o valor da previsão diária.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Month selector */}
            <div className="space-y-2">
              <Label>Mês de referência</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl">
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="capitalize">{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor por dia</span>
                <span className="font-semibold">
                  {formatCurrency(dailyBudget)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dias no mês</span>
                <span className="font-semibold">{daysInSelectedMonth}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Lançamentos a criar
                </span>
                <span className="font-semibold text-primary">
                  {daysInSelectedMonth} despesas
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  {formatCurrency(dailyBudget * daysInSelectedMonth)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanDialogOpen(false)}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyToPlan}
              disabled={isApplying}
              className="gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade/Premium Dialog for Free Users */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Funcionalidade Premium
            </DialogTitle>
            <DialogDescription>
              O agendamento em lote de despesas no planejamento mensal é exclusivo para assinantes do plano Pro.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-4">
              Com o plano Pro, você pode transformar instantaneamente sua simulação de diário em lançamentos reais no seu calendário de despesas para qualquer mês.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Talvez depois
            </Button>
            <Button
              onClick={() => {
                setUpgradeDialogOpen(false)
                router.push("/assinatura")
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
            >
              Desbloquear Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
