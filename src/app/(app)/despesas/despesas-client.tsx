"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { MonthSelector } from "@/app/components/shared/month-selector"
import { Checkbox } from "@/app/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination"
import { Plus, Pencil, Trash2, ArrowDownCircle, Wallet, AlertTriangle, Sparkles, TrendingDown, Zap, Repeat, Minus } from "lucide-react"
import { CategoryIcon } from "@/app/components/shared/category-icon"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Expense {
  id: string
  description: string
  amount: string
  occurrenceDate: string
  baseOccurrenceDate?: string
  type: "essential" | "non_essential"
  recurrence: string | null
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
}

interface Category {
  id: string
  name: string
  type: string
  parentId: string | null
  icon: string | null
  color: string | null
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface Stats {
  essential: number
  nonEssential: number
  total: number
}

interface DespesasClientProps {
  initialExpenses: Expense[]
  categories: Category[]
  currentMonth: Date
  pagination: PaginationData
  stats: Stats
  currentType: "all" | "essential" | "non_essential"
  userPlan?: "free" | "pro"
}

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue)
}

const formatDate = (date: string) => {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR")
}

export function DespesasClient({
  initialExpenses,
  categories,
  currentMonth,
  pagination,
  stats,
  currentType,
  userPlan = "free"
}: DespesasClientProps) {
  const router = useRouter()
  const expenses = initialExpenses
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isBulkDelete, setIsBulkDelete] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  // Reset selection when pagination/month changes
  useEffect(() => {
    setSelectedIds([])
  }, [pagination.currentPage, currentMonth, currentType])

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [occurrenceDate, setOccurrenceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [categoryId, setCategoryId] = useState("")
  const [type, setType] = useState<"essential" | "non_essential">("essential")
  const [recurrence, setRecurrence] = useState("once")
  const [repetitions, setRepetitions] = useState(1)

  function resetForm() {
    setDescription("")
    setAmount("")
    setOccurrenceDate(format(new Date(), "yyyy-MM-dd"))
    setCategoryId("")
    setType("essential")
    setRecurrence("once")
    setRepetitions(1)
    setEditingExpense(null)
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense)
    setDescription(expense.description)
    setAmount(expense.amount)
    setOccurrenceDate(expense.baseOccurrenceDate || expense.occurrenceDate)
    setCategoryId(expense.categoryId || "")
    setType(expense.type)
    setRecurrence(expense.recurrence || "once")
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      description,
      amount: parseFloat(amount),
      occurrenceDate,
      categoryId: categoryId || undefined,
      type,
      recurrence: repetitions > 1 ? "once" : recurrence,
      repetitions: recurrence === "monthly" ? repetitions : 1,
    }

    try {
      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      setDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Error saving expense:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initial trigger for single delete
  function confirmDelete(id: string) {
    setItemToDelete(id)
    setIsBulkDelete(false)
    setDeleteDialogOpen(true)
  }

  // Initial trigger for bulk delete
  function confirmBulkDelete() {
    setIsBulkDelete(true)
    setItemToDelete(null)
    setDeleteDialogOpen(true)
  }

  // Real execution logic
  async function executeDelete() {
    if (isBulkDelete) {
      setIsDeletingBulk(true)
      try {
        await fetch('/api/expenses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        })
        setSelectedIds([])
        router.refresh()
      } catch (error) {
        console.error("Error bulk deleting:", error)
      } finally {
        setIsDeletingBulk(false)
        setDeleteDialogOpen(false)
      }
    } else if (itemToDelete) {
      try {
        await fetch(`/api/expenses/${itemToDelete}`, { method: "DELETE" })
        router.refresh()
      } catch (error) {
        console.error("Error deleting expense:", error)
      } finally {
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      }
    }
  }

  // --- Bulk Selection Logic ---

  const toggleSelectAll = () => {
    if (selectedIds.length === expenses.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(expenses.map(e => e.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams()
    if (value !== "all") params.set("type", value)
    params.set("month", format(currentMonth, "yyyy-MM"))
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  // Categories are filtered in the Select component directly

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDelete
                ? `Você está prestes a excluir ${selectedIds.length} despesas. Esta ação não pode ser desfeita.`
                : "Esta ação não pode ser desfeita. Isso excluirá permanentemente a despesa."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                executeDelete()
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingBulk ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-600">Gastos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
              <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="break-words">Despesas</span>
          </h1>
          <p className="text-muted-foreground mt-1">Controle seus gastos mensais</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <MonthSelector userPlan={userPlan} />
          </div>

          {selectedIds.length > 0 ? (
            <Button
              className="gap-2 shadow-sm animate-in fade-in slide-in-from-right-2 w-full sm:w-auto"
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isDeletingBulk}
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Excluir ({selectedIds.length})</span>
            </Button>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-md bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Nova Despesa</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-900 border shadow-xl z-50">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? "Editar Despesa" : "Nova Despesa"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExpense ? "Atualize os dados da despesa" : "Registre um novo gasto"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Conta de luz, Supermercado..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={occurrenceDate}
                        onChange={(e) => setOccurrenceDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Despesa</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={type === "essential" ? "default" : "outline"}
                        className={`gap-2 ${type === "essential" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                        onClick={() => {
                          setType("essential")
                          setCategoryId("")
                        }}
                      >
                        <Wallet className="w-4 h-4" />
                        Essencial
                      </Button>
                      <Button
                        type="button"
                        variant={type === "non_essential" ? "default" : "outline"}
                        className={`gap-2 ${type === "non_essential" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                        onClick={() => {
                          setType("non_essential")
                          setCategoryId("")
                        }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Não Essencial
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[60]">
                          {categories
                            .filter(c => c.type === type && !c.parentId)
                            .map((root) => (
                              <div key={root.id}>
                                <SelectItem value={root.id}>
                                  <span className="flex items-center gap-2">
                                    <span style={{ color: root.color || undefined }}>
                                      <CategoryIcon icon={root.icon} className="w-4 h-4" />
                                    </span>
                                    <span className="font-semibold">{root.name}</span>
                                  </span>
                                </SelectItem>
                                {categories
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
                      <Label htmlFor="recurrence">Recorrência</Label>
                      <Select value={recurrence} onValueChange={(val) => {
                        setRecurrence(val)
                        if (val !== "monthly") setRepetitions(1)
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[60]">
                          <SelectItem value="once">Única vez</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Repetitions - appears when recurrence is monthly and not editing */}
                  {recurrence === "monthly" && !editingExpense && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Label className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-muted-foreground" />
                        Repetições
                      </Label>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground flex-1">
                          {repetitions === 1
                            ? "Repete indefinidamente todo mês"
                            : `Criará ${repetitions} lançamentos (um por mês)`}
                        </p>
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => setRepetitions(Math.max(1, repetitions - 1))}
                            disabled={repetitions <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm tabular-nums">
                            {repetitions}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => setRepetitions(Math.min(48, repetitions + 1))}
                            disabled={repetitions >= 48}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} variant="destructive">
                      {isSubmitting ? "Salvando..." : editingExpense ? "Salvar Alterações" : "Adicionar Despesa"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Essenciais */}
        <Card variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="relative pt-4 sm:pt-5 pb-4 sm:pb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">Essenciais</p>
                <div className="text-xl sm:text-2xl font-bold text-orange-600 break-words">
                  {formatCurrency(stats.essential)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize break-words">
                  {format(currentMonth, "MMMM", { locale: ptBR })}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Não Essenciais */}
        <Card variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="relative pt-4 sm:pt-5 pb-4 sm:pb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">Não Essenciais</p>
                <div className="text-xl sm:text-2xl font-bold text-red-600 break-words">
                  {formatCurrency(stats.nonEssential)}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card variant="elevated" className="relative overflow-hidden bg-muted/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="relative pt-4 sm:pt-5 pb-4 sm:pb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Geral</p>
                <div className="text-xl sm:text-2xl font-bold break-words">
                  {formatCurrency(stats.total)}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg shadow-gray-500/20 flex-shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="shadow-sm border-none sm:border bg-transparent sm:bg-card">
        <CardHeader className="hidden sm:block px-6">
          <CardTitle>Suas Despesas</CardTitle>
          <CardDescription>Gerencie todos os seus gastos do mês</CardDescription>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          <Tabs value={currentType} onValueChange={handleTabChange} className="w-full">
            <div className="px-4 sm:px-0 mb-4 overflow-x-auto">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="essential">Essenciais</TabsTrigger>
                <TabsTrigger value="non_essential">Não Essenciais</TabsTrigger>
              </TabsList>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-16 mx-4 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <ArrowDownCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
                <p className="text-sm">Clique em "Nova Despesa" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Desktop View */}
                <div className="hidden sm:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedIds.length === expenses.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id} className="group hover:bg-muted/50 transition-colors" data-state={selectedIds.includes(expense.id) && "selected"}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(expense.id)}
                              onCheckedChange={() => toggleSelect(expense.id)}
                              aria-label={`Select ${expense.description}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            {expense.categoryName ? (
                              <Badge
                                variant="secondary"
                                className="font-normal gap-1 transition-all"
                                style={{
                                  backgroundColor: expense.categoryColor ? `${expense.categoryColor}20` : undefined,
                                  color: expense.categoryColor || undefined
                                }}
                              >
                                {expense.categoryIcon && (
                                  <span style={{ color: expense.categoryColor || undefined }}>
                                    <CategoryIcon icon={expense.categoryIcon} className="w-4 h-4" />
                                  </span>
                                )}
                                {expense.categoryName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={expense.type === "essential" ? "outline" : "outline"} className={expense.type === 'essential' ? 'border-red-200 text-red-700 bg-red-50' : 'border-orange-200 text-orange-700 bg-orange-50'}>
                              {expense.type === "essential" ? "Essencial" : "Não Essencial"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(expense.occurrenceDate)}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            -{formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditDialog(expense)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => confirmDelete(expense.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View - Card List */}
                <div className="sm:hidden space-y-3 px-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={`bg-card text-card-foreground shadow-sm border rounded-xl p-4 flex flex-col gap-3 transition-transform ${selectedIds.includes(expense.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <Checkbox
                              checked={selectedIds.includes(expense.id)}
                              onCheckedChange={() => toggleSelect(expense.id)}
                              aria-label={`Select ${expense.description}`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="p-1.5 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: expense.categoryColor ? `${expense.categoryColor}20` : (expense.type === 'essential' ? '#fee2e2' : '#ffedd5'),
                                  color: expense.categoryColor || (expense.type === 'essential' ? '#dc2626' : '#ea580c')
                                }}
                              >
                                {expense.categoryIcon ? <CategoryIcon icon={expense.categoryIcon} className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                              </div>
                              <h4 className="font-semibold text-sm line-clamp-1">{expense.description}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground ml-7">{formatDate(expense.occurrenceDate)}</p>
                          </div>
                        </div>
                        <span className="font-bold text-red-600 text-sm">-{formatCurrency(expense.amount)}</span>
                      </div>

                      <div className="flex justify-between items-center border-t pt-3 pl-9">
                        <Badge variant="outline" className={`text-xs ${expense.type === 'essential' ? 'border-red-200 text-red-700 bg-red-50' : 'border-orange-200 text-orange-700 bg-orange-50'}`}>
                          {expense.type === "essential" ? "Essencial" : "Não Essencial"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(expense)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="py-6 px-4 sm:px-0">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (pagination.currentPage > 1) handlePageChange(pagination.currentPage - 1)
                            }}
                            className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page} className="hidden sm:block">
                            <PaginationLink
                              href="#"
                              isActive={page === pagination.currentPage}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem className="sm:hidden">
                          <span className="px-4 text-sm text-muted-foreground">
                            {pagination.currentPage} / {pagination.totalPages}
                          </span>
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (pagination.currentPage < pagination.totalPages) handlePageChange(pagination.currentPage + 1)
                            }}
                            className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
