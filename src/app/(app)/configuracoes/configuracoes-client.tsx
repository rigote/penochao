"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Settings as SettingsIcon, Save, PiggyBank } from "lucide-react"

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-gray-500" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize suas metas financeiras
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Fund Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-500" />
              Reserva de Emergência
            </CardTitle>
            <CardDescription>
              Configure suas metas de reserva de emergência
            </CardDescription>
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

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Sua reserva atual:</strong>{" "}
                <span className="text-blue-600">
                  {formatCurrency(settings.currentSavings)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
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
