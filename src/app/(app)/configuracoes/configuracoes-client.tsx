"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Settings as SettingsIcon, Save, PiggyBank, Sparkles, ChevronRight, Shield, FolderTree } from "lucide-react"

interface UserSettings {
  emergencyFundMonths: string
  emergencyFundTarget: string | null
  currentSavings: string
}

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue || 0)
}

interface ConfiguracoesClientProps {
  initialSettings: UserSettings
}

export function ConfiguracoesClient({ initialSettings }: ConfiguracoesClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyFundMonths: parseFloat(settings.emergencyFundMonths),
          emergencyFundTarget: settings.emergencyFundTarget
            ? parseFloat(settings.emergencyFundTarget)
            : undefined,
          currentSavings: parseFloat(settings.currentSavings),
        }),
      })

      if (res.ok) {
        setMessage("Configurações salvas com sucesso!")
        router.refresh()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Preferências</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <SettingsIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize suas metas financeiras
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Fund Card */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Reserva de Emergência</CardTitle>
                <CardDescription>
                  Configure suas metas de reserva de emergência
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="months">Meses de Reserva</Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={settings.emergencyFundMonths}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emergencyFundMonths: e.target.value
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Quantos meses de despesas essenciais você quer ter de reserva
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Meta Personalizada (opcional)</Label>
                <Input
                  id="target"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Calculado automaticamente"
                  value={settings.emergencyFundTarget || ""}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emergencyFundTarget: e.target.value || null
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para calcular automaticamente
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="savings">Valor Atual da Reserva (R$)</Label>
              <Input
                id="savings"
                type="number"
                min="0"
                step="0.01"
                value={settings.currentSavings}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  currentSavings: e.target.value
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Quanto você já tem guardado de reserva de emergência
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sua reserva atual</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(settings.currentSavings)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card
          variant="elevated"
          interactive
          onClick={() => router.push("/configuracoes/categorias")}
          className="cursor-pointer group"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <FolderTree className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>
                    Gerencie suas categorias de despesas e receitas
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </CardHeader>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
          {message && (
            <p className={`text-sm ${message.includes("sucesso") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
