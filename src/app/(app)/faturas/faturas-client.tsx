"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible"
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wallet,
  ShoppingBag,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock
} from "lucide-react"
import { toast } from "sonner"
import { CategoryIcon } from "@/app/components/shared/category-icon"

interface ExtractedData {
  description?: string
  amount?: number
  date?: string
  categoryType?: "essential" | "non_essential"
  recurrence?: "monthly" | "once"
  confidence?: number
}

interface Invoice {
  id: string
  fileName: string
  status: "pending" | "processed" | "error" | "saved"
  extractedData?: ExtractedData
  createdAt: string
  // Editable fields
  editedDescription: string
  editedAmount: string
  editedDate: string
  editedType: "essential" | "non_essential"
  editedCategoryId: string
  editedRecurrence: string
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
}

interface FaturasClientProps {
  categories: Category[]
  userPlan: "free" | "pro"
  monthlyUsage: number
  invoiceLimit: number | null
  courtesyExpiresAt: string | null
}

export function FaturasClient({ categories, userPlan, monthlyUsage, invoiceLimit, courtesyExpiresAt }: FaturasClientProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [savingAll, setSavingAll] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)

  // Track local usage to prevent unlimited uploads in same session without refresh
  const [currentUsage, setCurrentUsage] = useState(monthlyUsage)
  
  // Determine the effective limit
  const effectiveLimit = invoiceLimit // null means unlimited
  const hasLimit = effectiveLimit !== null
  const isLimitReached = hasLimit && currentUsage >= effectiveLimit

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [currentUsage, userPlan]) // Add dependencies

  const handleFiles = async (files: FileList) => {
    // Check Limit
    if (hasLimit && (currentUsage + files.length) > effectiveLimit) {
      toast.error(`Limite de uploads atingido! (${currentUsage}/${effectiveLimit})`, {
        description: userPlan === "free" 
          ? "Faça o upgrade para o plano Pro para uploads ilimitados."
          : "Você atingiu o limite do seu cupom de cortesia.",
        action: userPlan === "free" ? {
          label: "Ver Planos",
          onClick: () => window.location.href = "/assinatura"
        } : undefined
      })
      return
    }

    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf")

    if (pdfFiles.length === 0) {
      toast.error("Por favor, selecione arquivos PDF válidos")
      return
    }

    setUploading(true)
    let processedCount = 0

    for (const file of pdfFiles) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/invoices/process", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Erro ao processar fatura")
        }

        const { data } = await response.json()

        setCurrentUsage(prev => prev + 1) // Increment usage tracking

        const newInvoice: Invoice = {
          id: Date.now().toString() + Math.random(),
          fileName: file.name,
          status: "processed",
          extractedData: data,
          createdAt: new Date().toISOString(),
          // Pre-fill editable fields
          editedDescription: data.description || "",
          editedAmount: data.amount?.toString() || "0",
          editedDate: data.date || new Date().toISOString().split('T')[0],
          editedType: data.categoryType || "essential",
          editedCategoryId: "",
          editedRecurrence: data.recurrence || "once"
        }

        setInvoices(prev => [newInvoice, ...prev]) // Add to top
        processedCount++

      } catch (error) {
        console.error("Upload error:", error)
        toast.error(`Erro ao processar ${file.name}`)

        const errorInvoice: Invoice = {
          id: Date.now().toString() + Math.random(),
          fileName: file.name,
          status: "error",
          createdAt: new Date().toISOString(),
          editedDescription: "",
          editedAmount: "0",
          editedDate: new Date().toISOString().split('T')[0],
          editedType: "essential",
          editedCategoryId: "",
          editedRecurrence: "once"
        }
        setInvoices(prev => [errorInvoice, ...prev])
      }
    }

    setUploading(false)
    if (processedCount > 0) {
      toast.success(`${processedCount} fatura(s) processada(s) com sucesso!`)
    }
  }

  const updateInvoice = (id: string, field: keyof Invoice, value: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === id ? { ...inv, [field]: value } : inv
    ))
  }

  const removeInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    toast.info("Fatura removida da lista")
  }

  const saveInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: invoice.editedDescription,
          amount: parseFloat(invoice.editedAmount),
          occurrenceDate: invoice.editedDate,
          type: invoice.editedType,
          categoryId: invoice.editedCategoryId || undefined,
          recurrence: invoice.editedRecurrence
        }),
      })

      if (!response.ok) throw new Error("Falha ao salvar")

      setInvoices(prev => prev.map(inv =>
        inv.id === invoice.id ? { ...inv, status: "saved" as const } : inv
      ))

      toast.success("Despesa salva com sucesso!")
      return true
    } catch (error) {
      console.error("Error saving expense:", error)
      toast.error("Erro ao salvar despesa")
      return false
    }
  }

  const saveAllInvoices = async () => {
    const pending = invoices.filter(inv => inv.status === "processed")
    if (pending.length === 0) return

    setSavingAll(true)
    let savedCount = 0

    for (const invoice of pending) {
      const success = await saveInvoice(invoice)
      if (success) savedCount++
    }

    setSavingAll(false)
    if (savedCount > 0) {
      toast.success(`${savedCount} despesas salvas com sucesso!`)
      setSavedOpen(true) // Auto-open saved section
    }
  }

  const pendingInvoices = invoices.filter(inv => inv.status === "processed" || inv.status === "error")
  const savedInvoices = invoices.filter(inv => inv.status === "saved")

  const getFilteredCategories = (type: "essential" | "non_essential") => {
    return categories.filter(cat => cat.type === type)
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Leitor Inteligente de Faturas
        </h1>
        <p className="text-muted-foreground text-lg">
          Arraste seus PDFs e deixe nossa IA organizar suas contas automaticamente.
        </p>
      </div>

      {/* Usage Progress - Show for users with limits */}
      {hasLimit && (
        <Card className={`${userPlan === "free" 
          ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-900/30" 
          : "border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900/30"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-full ${userPlan === "free" 
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" 
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className={`font-medium ${userPlan === "free" 
                  ? "text-orange-800 dark:text-orange-200" 
                  : "text-blue-800 dark:text-blue-200"}`}>
                  {userPlan === "free" ? "Uso do Plano Gratuito" : "Limite do Cupom de Cortesia"}
                </span>
                <span className="text-muted-foreground">
                  {currentUsage} de {effectiveLimit} faturas
                </span>
              </div>
              <div className={`h-2 w-full rounded-full overflow-hidden ${userPlan === "free" 
                ? "bg-orange-200 dark:bg-orange-950/30" 
                : "bg-blue-200 dark:bg-blue-950/30"}`}>
                <div
                  className={`h-full transition-all duration-500 ${userPlan === "free" ? "bg-orange-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min((currentUsage / effectiveLimit) * 100, 100)}%` }}
                />
              </div>
              {courtesyExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Cortesia válida até {new Date(courtesyExpiresAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            {userPlan === "free" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hidden sm:flex"
                onClick={() => window.location.href = "/assinatura"}
              >
                Fazer Upgrade
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Unlimited message for Pro without limit */}
      {userPlan === "pro" && !hasLimit && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-green-800 dark:text-green-200">
                Plano Pro - Faturas Ilimitadas
              </span>
              <p className="text-sm text-muted-foreground">
                Você já processou {currentUsage} {currentUsage === 1 ? "fatura" : "faturas"} este mês
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card
        className={`border-3 border-dashed transition-all duration-300 overflow-hidden relative
          ${dragActive
            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 scale-[0.99]'
            : 'border-muted-foreground/20 hover:border-purple-400 bg-white/50 dark:bg-zinc-900/50'
          }
          backdrop-blur-xl shadow-xl hover:shadow-2xl rounded-3xl
        `}
      >
        <CardContent className="flex flex-col items-center justify-center py-24 text-center relative z-10">
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 disabled:cursor-not-allowed"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading || isLimitReached}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          />

          {uploading ? (
            <div className="w-full max-w-sm mx-auto space-y-8 pointer-events-none">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative bg-white dark:bg-zinc-800 rounded-full w-full h-full flex items-center justify-center shadow-lg border-4 border-purple-100 dark:border-purple-900">
                  <Sparkles className="w-10 h-10 text-purple-600 animate-pulse" />
                </div>

                {/* Orbiting Loading Spinner */}
                <svg className="absolute inset-0 w-full h-full animate-spin duration-3000" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-200 dark:text-purple-900" />
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100 200" className="text-purple-600" />
                </svg>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  Processando com IA...
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground max-w-[200px] mx-auto">
                    <span>Extraindo dados</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1.5 w-full max-w-[200px] mx-auto bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 w-full animate-[loading_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pointer-events-none transition-all duration-300 group-hover:scale-105">
              <div className="relative inline-block">
                <div className={`p-8 rounded-full shadow-xl transition-all duration-500
                    ${isLimitReached
                    ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800'
                    : 'bg-gradient-to-br from-purple-100 to-white dark:from-purple-900/40 dark:to-zinc-900 text-purple-600 shadow-purple-500/20'
                  }
                 `}>
                  {isLimitReached ? (
                    <Lock className="h-12 w-12" />
                  ) : (
                    <Upload className="h-12 w-12" />
                  )}
                </div>
                {!isLimitReached && (
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-lg border border-purple-100 dark:border-purple-900 animate-bounce delay-700">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                )}
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-bold tracking-tight">
                  {isLimitReached ? "Limite Mensal Atingido" : "Arraste ou clique para enviar"}
                </h3>
                <p className="text-muted-foreground">
                  {isLimitReached
                    ? userPlan === "free"
                      ? "Você atingiu o limite gratuito de envios. Libere o poder ilimitado da IA com o plano Pro."
                      : "Você atingiu o limite do seu cupom de cortesia para este mês."
                    : "Suportamos faturas em PDF (Nubank, C6, etc). Nossa IA extrai tudo automaticamente."
                  }
                </p>
              </div>

              <Button
                size="lg"
                disabled={isLimitReached}
                className={`
                  rounded-full px-8 h-12 font-medium transition-all duration-300 transform
                  ${isLimitReached
                    ? "bg-muted text-muted-foreground hover:bg-muted"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1"
                  }
                `}
              >
                {isLimitReached ? (
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Bloqueado</span>
                ) : (
                  "Selecionar Arquivo PDF"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invoices List */}
      <div className="space-y-6">
        {invoices.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 text-sm">
                {pendingInvoices.length}
              </span>
              Em Análise
            </h2>

            {pendingInvoices.length > 1 && (
              <Button
                onClick={saveAllInvoices}
                disabled={savingAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20 rounded-full px-6"
              >
                {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Salvar Todas ({pendingInvoices.length})
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-6">
          {pendingInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className={`
                group transition-all duration-300 border-none shadow-lg hover:shadow-xl rounded-2xl overflow-hidden
                ${invoice.status === 'error' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-white dark:bg-zinc-900'}
              `}
            >
              <div className={`h-2 w-full ${invoice.status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} />

              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${invoice.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                      {invoice.status === 'error' ? <AlertCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{invoice.fileName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{new Date(invoice.createdAt).toLocaleString('pt-BR')}</span>
                        {invoice.extractedData?.confidence && (
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(invoice.extractedData.confidence * 100)}% confiança
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeInvoice(invoice.id)} className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {invoice.status !== "error" && (
                  <div className="space-y-6">
                    {/* Main Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</Label>
                          <Input
                            value={invoice.editedDescription}
                            onChange={(e) => updateInvoice(invoice.id, "editedDescription", e.target.value)}
                            className="text-lg font-medium border-0 bg-muted/30 focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:bg-white dark:focus-visible:bg-zinc-800 transition-all rounded-xl py-6"
                            placeholder="Ex: Conta de Luz"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                              <Input
                                type="number"
                                value={invoice.editedAmount}
                                onChange={(e) => updateInvoice(invoice.id, "editedAmount", e.target.value)}
                                className="pl-10 text-lg font-bold text-emerald-600 dark:text-emerald-400 border-0 bg-emerald-50/50 dark:bg-emerald-900/10 focus-visible:ring-emerald-500/30 rounded-xl py-6"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</Label>
                            <Input
                              type="date"
                              value={invoice.editedDate}
                              onChange={(e) => updateInvoice(invoice.id, "editedDate", e.target.value)}
                              className="border-0 bg-muted/30 focus-visible:ring-purple-500/20 rounded-xl py-6"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Classificação</Label>
                          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                            <Button
                              type="button"
                              variant="ghost"
                              className={`flex-1 rounded-lg gap-2 font-medium transition-all ${invoice.editedType === "essential" ? "bg-white dark:bg-zinc-800 shadow-sm text-red-600" : "text-muted-foreground hover:bg-white/50"}`}
                              onClick={() => updateInvoice(invoice.id, "editedType", "essential")}
                            >
                              <Wallet className="w-4 h-4" />
                              Essencial
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className={`flex-1 rounded-lg gap-2 font-medium transition-all ${invoice.editedType === "non_essential" ? "bg-white dark:bg-zinc-800 shadow-sm text-orange-500" : "text-muted-foreground hover:bg-white/50"}`}
                              onClick={() => updateInvoice(invoice.id, "editedType", "non_essential")}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              Não Essencial
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</Label>
                            <Select
                              value={invoice.editedCategoryId}
                              onValueChange={(v) => updateInvoice(invoice.id, "editedCategoryId", v)}
                            >
                              <SelectTrigger className="border-0 bg-muted/30 h-12 rounded-xl">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredCategories(invoice.editedType).map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <span className="flex items-center gap-2">
                                      <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                                      <span>{cat.name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recorrência</Label>
                            <Select
                              value={invoice.editedRecurrence}
                              onValueChange={(v) => updateInvoice(invoice.id, "editedRecurrence", v)}
                            >
                              <SelectTrigger className="border-0 bg-muted/30 h-12 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="once">Única vez</SelectItem>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => saveInvoice(invoice)}
                        className="rounded-full px-8 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 gap-2 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Salvar Despesa
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Saved Invoices Section */}
      {savedInvoices.length > 0 && (
        <Collapsible open={savedOpen} onOpenChange={setSavedOpen} className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs">
                {savedInvoices.length}
              </span>
              Salvas Recentemente
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0 rounded-full">
                {savedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-4">
            {savedInvoices.map((invoice) => (
              <Card key={invoice.id} className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">{invoice.editedDescription || invoice.fileName}</p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(invoice.editedAmount))} • {new Date(invoice.editedDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeInvoice(invoice.id)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
