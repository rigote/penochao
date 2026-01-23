"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/app/components/shared/category-icon"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  type: string
  parentId: string | null
  icon: string | null
  color: string | null
}

interface QuickAddProps {
  categories: Category[]
  /** If true, hides the floating action button (FAB) */
  hideFAB?: boolean
  /** External control: open dialog with specific type */
  externalOpen?: boolean
  /** External control: transaction type to open with */
  externalType?: "income" | "expense"
  /** Callback when external dialog closes */
  onExternalClose?: () => void
}

type TransactionType = "income" | "expense"
type ExpenseType = "essential" | "non_essential"

export function QuickAdd({ 
  categories, 
  hideFAB = false,
  externalOpen,
  externalType,
  onExternalClose
}: QuickAddProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>("income")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle external open control
  useEffect(() => {
    if (externalOpen && externalType) {
      setTransactionType(externalType)
      setDialogOpen(true)
    }
  }, [externalOpen, externalType])

  // Handle dialog close for external control
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open && onExternalClose) {
      onExternalClose()
    }
  }

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [occurrenceDate, setOccurrenceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [categoryId, setCategoryId] = useState("")
  const [expenseType, setExpenseType] = useState<ExpenseType>("essential")
  const [recurrence, setRecurrence] = useState("once")

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setDescription("")
      setAmount("")
      setOccurrenceDate(format(new Date(), "yyyy-MM-dd"))
      setCategoryId("")
      setExpenseType("essential")
      setRecurrence("once")
    }
  }, [dialogOpen])

  // Close FAB menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isExpanded) setIsExpanded(false)
    }
    if (isExpanded) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isExpanded])

  const handleFABClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleQuickAdd = (type: TransactionType) => {
    setTransactionType(type)
    setIsExpanded(false)
    setDialogOpen(true)
  }

  const filteredCategories = categories.filter(c => {
    if (transactionType === "income") return c.type === "income"
    return c.type === expenseType
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (transactionType === "income") {
        await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            amount: parseFloat(amount),
            occurrenceDate,
            categoryId: categoryId || undefined,
            recurrence,
          }),
        })
        toast.success("Entrada adicionada!", {
          description: `${description} - R$ ${parseFloat(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        })
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            amount: parseFloat(amount),
            occurrenceDate,
            categoryId: categoryId || undefined,
            type: expenseType,
            recurrence,
          }),
        })
        toast.success("Despesa adicionada!", {
          description: `${description} - R$ ${parseFloat(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        })
      }

      handleDialogChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Erro ao salvar", {
        description: "Tente novamente mais tarde.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* FAB Container - hidden when hideFAB is true */}
      {!hideFAB && (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
        {/* Quick Action Buttons - appear when expanded */}
        <div
          className={cn(
            "flex flex-col gap-3 transition-all duration-300",
            isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {/* Add Income */}
          <button
            onClick={() => handleQuickAdd("income")}
            className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: "50ms" }}
          >
            <span className="px-3 py-1.5 bg-card text-card-foreground rounded-lg shadow-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Nova Entrada
            </span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center hover:scale-110 transition-transform">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </button>

          {/* Add Expense */}
          <button
            onClick={() => handleQuickAdd("expense")}
            className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: "100ms" }}
          >
            <span className="px-3 py-1.5 bg-card text-card-foreground rounded-lg shadow-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Nova Despesa
            </span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center hover:scale-110 transition-transform">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Main FAB Button */}
        <button
          onClick={handleFABClick}
          className={cn(
            "w-14 h-14 rounded-full gradient-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
            isExpanded && "rotate-45 bg-muted"
          )}
        >
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-7 h-7" />
          )}
        </button>
      </div>
      )}

      {/* Backdrop when FAB is expanded */}
      {!hideFAB && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Quick Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[500px] bg-card border shadow-2xl z-50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                transactionType === "income"
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                  : "bg-gradient-to-br from-red-500 to-rose-600 text-white"
              )}>
                {transactionType === "income" ? (
                  <ArrowUpCircle className="w-5 h-5" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {transactionType === "income" ? "Nova Entrada" : "Nova Despesa"}
                </DialogTitle>
                <DialogDescription>
                  {transactionType === "income"
                    ? "Registre uma nova fonte de renda"
                    : "Registre um novo gasto"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="quick-description" className="text-sm font-medium">
                Descrição
              </Label>
              <Input
                id="quick-description"
                placeholder={transactionType === "income" ? "Ex: Salário, Freelance..." : "Ex: Supermercado, Conta de luz..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-12 text-base"
                autoFocus
              />
            </div>

            {/* Amount & Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-amount" className="text-sm font-medium">
                  Valor (R$)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="quick-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="h-12 pl-10 font-mono text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-date" className="text-sm font-medium">
                  Data
                </Label>
                <Input
                  id="quick-date"
                  type="date"
                  value={occurrenceDate}
                  onChange={(e) => setOccurrenceDate(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            </div>

            {/* Expense Type Selection (only for expenses) */}
            {transactionType === "expense" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Despesa</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseType("essential")
                      setCategoryId("")
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-medium transition-all",
                      expenseType === "essential"
                        ? "border-red-500 bg-red-500/10 text-red-600"
                        : "border-border hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                    )}
                  >
                    <Wallet className="w-4 h-4" />
                    Essencial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseType("non_essential")
                      setCategoryId("")
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-medium transition-all",
                      expenseType === "non_essential"
                        ? "border-orange-500 bg-orange-500/10 text-orange-600"
                        : "border-border hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    Não Essencial
                  </button>
                </div>
              </div>
            )}

            {/* Category & Recurrence Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-category" className="text-sm font-medium">
                  Categoria
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border shadow-xl z-[60]">
                    {filteredCategories
                      .filter(c => !c.parentId)
                      .map((root) => (
                        <div key={root.id}>
                          <SelectItem value={root.id}>
                            <span className="flex items-center gap-2">
                              <span style={{ color: root.color || undefined }}>
                                <CategoryIcon icon={root.icon} className="w-4 h-4" />
                              </span>
                              <span className="font-medium">{root.name}</span>
                            </span>
                          </SelectItem>
                          {filteredCategories
                            .filter(c => c.parentId === root.id)
                            .map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                <span className="flex items-center gap-2 pl-4">
                                  <span className="text-muted-foreground/50">↳</span>
                                  <span style={{ color: sub.color || undefined }}>
                                    <CategoryIcon icon={sub.icon} className="w-4 h-4" />
                                  </span>
                                  <span>{sub.name}</span>
                                </span>
                              </SelectItem>
                            ))
                          }
                        </div>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-recurrence" className="text-sm font-medium">
                  Recorrência
                </Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border shadow-xl z-[60]">
                    <SelectItem value="once">Única vez</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex-1 h-12 font-semibold",
                  transactionType === "income"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  `Adicionar ${transactionType === "income" ? "Entrada" : "Despesa"}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
