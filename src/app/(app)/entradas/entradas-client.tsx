"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Checkbox } from "@/app/components/ui/checkbox"
import { MonthSelector } from "@/app/components/shared/month-selector"
import { CategoryIcon } from "@/app/components/shared/category-icon"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination"
import { Plus, Pencil, Trash2, ArrowUpCircle, Sparkles, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Income {
  id: string
  description: string
  amount: string
  occurrenceDate: string
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
  total: number
}

interface EntradasClientProps {
  initialIncomes: Income[]
  categories: Category[]
  currentMonth: Date
  pagination: PaginationData
  stats: Stats
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

export function EntradasClient({
  initialIncomes,
  categories,
  currentMonth,
  pagination,
  stats,
  userPlan = "free"
}: EntradasClientProps) {
  const router = useRouter()
  const incomes = initialIncomes
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
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
  }, [pagination.currentPage, currentMonth])

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [occurrenceDate, setOccurrenceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [categoryId, setCategoryId] = useState("")
  const [recurrence, setRecurrence] = useState("once")

  function resetForm() {
    setDescription("")
    setAmount("")
    setOccurrenceDate(format(new Date(), "yyyy-MM-dd"))
    setCategoryId("")
    setRecurrence("once")
    setEditingIncome(null)
  }

  function openEditDialog(income: Income) {
    setEditingIncome(income)
    setDescription(income.description)
    setAmount(income.amount)
    setOccurrenceDate(income.occurrenceDate)
    setCategoryId(income.categoryId || "")
    setRecurrence(income.recurrence || "once")
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
      recurrence,
    }

    try {
      if (editingIncome) {
        await fetch(`/api/incomes/${editingIncome.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      setDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Error saving income:", error)
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
        await fetch('/api/incomes', {
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
        await fetch(`/api/incomes/${itemToDelete}`, { method: "DELETE" })
        router.refresh()
      } catch (error) {
        console.error("Error deleting income:", error)
      } finally {
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      }
    }
  }

  // --- Bulk Selection Logic ---

  const toggleSelectAll = () => {
    if (selectedIds.length === incomes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(incomes.map(i => i.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDelete
                ? `Você está prestes a excluir ${selectedIds.length} entradas. Esta ação não pode ser desfeita.`
                : "Esta ação não pode ser desfeita. Isso excluirá permanentemente a entrada."
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

      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">Receitas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="break-words">Entradas</span>
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas fontes de renda</p>
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
                <Button className="gap-2 shadow-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Nova Entrada</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border shadow-xl z-50">
                <DialogHeader>
                  <DialogTitle>
                    {editingIncome ? "Editar Entrada" : "Nova Entrada"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingIncome ? "Atualize os dados da entrada" : "Adicione uma nova fonte de renda"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Salário, Freelance..."
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[60]">
                          {categories
                            .filter(c => c.type === "income" && !c.parentId)
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
                      <Select value={recurrence} onValueChange={setRecurrence}>
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

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? "Salvando..." : editingIncome ? "Salvar Alterações" : "Adicionar Entrada"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

        </div>
      </div>

      {/* Summary Card */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative pt-4 sm:pt-6 pb-4 sm:pb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Entradas</p>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 tracking-tight break-words">
                {formatCurrency(stats.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-2 capitalize break-words">
                Referente a {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table & List */}
      <Card className="shadow-sm border-none sm:border bg-transparent sm:bg-card">
        <CardHeader className="hidden sm:block px-6">
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Lista de entradas para este mês.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          {incomes.length === 0 ? (
            <div className="text-center py-16 mx-4 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              <ArrowUpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma entrada neste mês</p>
              <p className="text-sm">Use o botão "Nova Entrada" para adicionar.</p>
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
                          checked={selectedIds.length === incomes.length}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Recorrência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((income) => (
                      <TableRow key={income.id} className="group hover:bg-muted/50 transition-colors" data-state={selectedIds.includes(income.id) && "selected"}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(income.id)}
                            onCheckedChange={() => toggleSelect(income.id)}
                            aria-label={`Select ${income.description}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{income.description}</TableCell>
                        <TableCell>
                          {income.categoryName ? (
                            <Badge
                              variant="secondary"
                              className="font-normal gap-1 transition-all"
                              style={{
                                backgroundColor: income.categoryColor ? `${income.categoryColor}20` : undefined,
                                color: income.categoryColor || undefined
                              }}
                            >
                              {income.categoryIcon && (
                                <span style={{ color: income.categoryColor || undefined }}>
                                  <CategoryIcon icon={income.categoryIcon} className="w-4 h-4" />
                                </span>
                              )}
                              {income.categoryName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(income.occurrenceDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {income.recurrence === "once" ? "Única" :
                              income.recurrence === "monthly" ? "Mensal" : "Anual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(income.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(income)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => confirmDelete(income.id)}
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
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className={`bg-card text-card-foreground shadow-sm border rounded-xl p-4 flex flex-col gap-3 transition-transform ${selectedIds.includes(income.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedIds.includes(income.id)}
                            onCheckedChange={() => toggleSelect(income.id)}
                            aria-label={`Select ${income.description}`}
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="p-1.5 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: income.categoryColor ? `${income.categoryColor}20` : '#dcfce7',
                                color: income.categoryColor || '#16a34a'
                              }}
                            >
                              {income.categoryIcon ? <CategoryIcon icon={income.categoryIcon} className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                            </div>
                            <h4 className="font-semibold text-sm line-clamp-1">{income.description}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground ml-7">{formatDate(income.occurrenceDate)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600 text-sm">+{formatCurrency(income.amount)}</span>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 pl-9">
                      <Badge variant="outline" className="text-xs">
                        {income.recurrence === "once" ? "Única" :
                          income.recurrence === "monthly" ? "Mensal" : "Anual"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(income)}
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
        </CardContent>
      </Card>
    </div>
  )
}
