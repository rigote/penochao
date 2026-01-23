"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog"
import { 
  ArrowLeft, 
  Plus, 
  Ticket, 
  Trash2, 
  Pencil, 
  Loader2,
  Gift,
  Percent,
  Copy,
  Check
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/app/components/ui/switch"

interface Coupon {
  id: string
  code: string
  description: string | null
  type: string
  discountPercent: number | null
  courtesyDays: number | null
  invoiceLimit: number | null
  restrictedEmail: string | null
  maxUses: number | null
  usedCount: number
  validFrom: Date | null
  validUntil: Date | null
  isActive: boolean
  createdAt: Date
}

interface CuponsClientProps {
  initialCoupons: Coupon[]
}

export function CuponsClient({ initialCoupons }: CuponsClientProps) {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "courtesy" as "discount" | "courtesy",
    discountPercent: 20,
    courtesyDays: 30,
    invoiceLimit: "",
    restrictedEmail: "",
    maxUses: "",
    validFromDate: "",
    validFromTime: "00:00",
    validUntilDate: "",
    validUntilTime: "23:59",
    isActive: true,
  })

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      type: "courtesy",
      discountPercent: 20,
      courtesyDays: 30,
      invoiceLimit: "",
      restrictedEmail: "",
      maxUses: "",
      validFromDate: "",
      validFromTime: "00:00",
      validUntilDate: "",
      validUntilTime: "23:59",
      isActive: true,
    })
  }

  // Combine date and time into ISO string
  const combineDateAndTime = (date: string, time: string): string | null => {
    if (!date) return null
    return `${date}T${time || "00:00"}`
  }

  const handleCreate = async () => {
    if (!formData.code) {
      toast.error("Código é obrigatório")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          type: formData.type,
          discountPercent: formData.discountPercent,
          courtesyDays: formData.courtesyDays,
          invoiceLimit: formData.invoiceLimit ? parseInt(formData.invoiceLimit) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          validFrom: combineDateAndTime(formData.validFromDate, formData.validFromTime),
          validUntil: combineDateAndTime(formData.validUntilDate, formData.validUntilTime),
          restrictedEmail: formData.restrictedEmail || null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar cupom")
      }

      const newCoupon = await response.json()
      setCoupons([newCoupon, ...coupons])
      setIsCreateOpen(false)
      resetForm()
      toast.success("Cupom criado com sucesso!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar cupom")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingCoupon) return

    setLoading(true)
    try {
      const response = await fetch(`/api/coupons/${editingCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          type: formData.type,
          discountPercent: formData.discountPercent,
          courtesyDays: formData.courtesyDays,
          invoiceLimit: formData.invoiceLimit ? parseInt(formData.invoiceLimit) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          validFrom: combineDateAndTime(formData.validFromDate, formData.validFromTime),
          validUntil: combineDateAndTime(formData.validUntilDate, formData.validUntilTime),
          restrictedEmail: formData.restrictedEmail || null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar cupom")
      }

      const updated = await response.json()
      setCoupons(coupons.map(c => c.id === updated.id ? updated : c))
      setIsEditOpen(false)
      setEditingCoupon(null)
      resetForm()
      toast.success("Cupom atualizado!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar cupom")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar cupom")
      }

      setCoupons(coupons.filter(c => c.id !== id))
      toast.success("Cupom deletado!")
    } catch (error) {
      toast.error("Erro ao deletar cupom")
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar cupom")
      }

      const updated = await response.json()
      setCoupons(coupons.map(c => c.id === updated.id ? updated : c))
      toast.success(updated.isActive ? "Cupom ativado!" : "Cupom desativado!")
    } catch (error) {
      toast.error("Erro ao atualizar cupom")
    }
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    const validFromDate = coupon.validFrom ? new Date(coupon.validFrom) : null
    const validUntilDate = coupon.validUntil ? new Date(coupon.validUntil) : null
    
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type as "discount" | "courtesy",
      discountPercent: coupon.discountPercent || 20,
      courtesyDays: coupon.courtesyDays || 30,
      invoiceLimit: coupon.invoiceLimit?.toString() || "",
      restrictedEmail: coupon.restrictedEmail || "",
      maxUses: coupon.maxUses?.toString() || "",
      validFromDate: validFromDate ? format(validFromDate, "yyyy-MM-dd") : "",
      validFromTime: validFromDate ? format(validFromDate, "HH:mm") : "00:00",
      validUntilDate: validUntilDate ? format(validUntilDate, "yyyy-MM-dd") : "",
      validUntilTime: validUntilDate ? format(validUntilDate, "HH:mm") : "23:59",
      isActive: coupon.isActive,
    })
    setIsEditOpen(true)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

const formContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código *</Label>
          <Input
            id="code"
            placeholder="BEMVINDO30"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "discount" | "courtesy") => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="courtesy">
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4" /> Cortesia (dias grátis)
                </span>
              </SelectItem>
              <SelectItem value="discount">
                <span className="flex items-center gap-2">
                  <Percent className="w-4 h-4" /> Desconto (%)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type === "courtesy" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="courtesyDays">Dias de Pro grátis *</Label>
            <Input
              id="courtesyDays"
              type="number"
              min="1"
              value={formData.courtesyDays}
              onChange={(e) => setFormData(prev => ({ ...prev, courtesyDays: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceLimit">Limite faturas IA/mês</Label>
            <Input
              id="invoiceLimit"
              type="number"
              min="1"
              placeholder="Ilimitado"
              value={formData.invoiceLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceLimit: e.target.value }))}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Desconto (%) *</Label>
          <Input
            id="discountPercent"
            type="number"
            min="1"
            max="100"
            value={formData.discountPercent}
            onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (interno)</Label>
        <Input
          id="description"
          placeholder="Cupom para influenciadores"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="restrictedEmail">Email restrito (opcional)</Label>
        <Input
          id="restrictedEmail"
          type="email"
          placeholder="usuario@email.com"
          value={formData.restrictedEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, restrictedEmail: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Se preenchido, apenas este email poderá usar o cupom
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUses">Limite de usos (opcional)</Label>
        <Input
          id="maxUses"
          type="number"
          min="1"
          placeholder="Ilimitado"
          value={formData.maxUses}
          onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Válido a partir de</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="validFromDate"
              type="date"
              value={formData.validFromDate}
              onChange={(e) => setFormData(prev => ({ ...prev, validFromDate: e.target.value }))}
            />
            <Input
              id="validFromTime"
              type="time"
              value={formData.validFromTime}
              onChange={(e) => setFormData(prev => ({ ...prev, validFromTime: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Válido até</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="validUntilDate"
              type="date"
              value={formData.validUntilDate}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntilDate: e.target.value }))}
            />
            <Input
              id="validUntilTime"
              type="time"
              value={formData.validUntilTime}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntilTime: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Ativo</Label>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cupons</h1>
            <p className="text-muted-foreground text-sm">Gerencie cupons de desconto e cortesia</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Cupom</DialogTitle>
              <DialogDescription>
                Crie um novo cupom de desconto ou cortesia
              </DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((acc, c) => acc + c.usedCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Lista de Cupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cupom criado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                      )}
                      {coupon.restrictedEmail && (
                        <p className="text-xs text-amber-600 mt-1">📧 {coupon.restrictedEmail}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {coupon.type === "courtesy" ? (
                          <><Gift className="w-3 h-3" /> Cortesia</>
                        ) : (
                          <><Percent className="w-3 h-3" /> Desconto</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.type === "courtesy" ? (
                        <span className="font-medium">{coupon.courtesyDays} dias</span>
                      ) : (
                        <span className="font-medium">{coupon.discountPercent}%</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {coupon.usedCount}
                        {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {coupon.validFrom || coupon.validUntil ? (
                        <div className="text-xs space-y-0.5">
                          {coupon.validFrom && (
                            <div>De: {format(new Date(coupon.validFrom), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
                          )}
                          {coupon.validUntil && (
                            <div>Até: {format(new Date(coupon.validUntil), "dd/MM/yy HH:mm", { locale: ptBR })}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem limite</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={() => handleToggleActive(coupon)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar cupom?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O cupom {coupon.code} será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(coupon.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingCoupon(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
            <DialogDescription>
              Altere as configurações do cupom
            </DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
