"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Save, PiggyBank, Sparkles, ChevronRight, Shield, FolderTree, Lock, CreditCard, Crown, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { PLAN_PRICES } from "@/config/plans"

interface UserSettings {
  emergencyFundMonths: string
  emergencyFundTarget: string | null
  currentSavings: string
}

interface SubscriptionInfo {
  plan: "free" | "pro"
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeCurrentPeriodEnd: Date | null
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
  userPlan: "free" | "pro"
  subscriptionInfo: SubscriptionInfo
}

export function ConfiguracoesClient({ initialSettings, userPlan, subscriptionInfo }: ConfiguracoesClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao abrir portal")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao abrir portal de assinatura")
    } finally {
      setLoadingPortal(false)
    }
  }

  const handleUpgrade = async () => {
    setLoadingCheckout(true)
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
      
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao criar checkout")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao processar. Tente novamente.")
    } finally {
      setLoadingCheckout(false)
    }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">
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
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
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

            <div className="rounded-xl bg-muted/50 p-4 border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sua reserva atual</p>
                  <p className="text-xl font-bold text-primary">
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
          interactive={userPlan === "pro"}
          onClick={() => {
            if (userPlan === "free") {
              toast.error("Funcionalidade Premium", {
                description: "Personalização de categorias é exclusiva do plano Pro.",
                action: { label: "Ser Pro", onClick: () => { } }
              })
              return
            }
            router.push("/configuracoes/categorias")
          }}
          className={`group transition-all ${userPlan === "free" ? "opacity-90 grayscale-[0.5]" : "cursor-pointer"}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center relative">
                  <FolderTree className="h-5 w-5 text-primary-foreground" />
                  {userPlan === "free" && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-background">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Categorias
                    {userPlan === "free" && <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Pro</span>}
                  </CardTitle>
                  <CardDescription>
                    {userPlan === "free"
                      ? "Desbloqueie para criar suas próprias categorias"
                      : "Gerencie suas categorias de despesas e receitas"}
                  </CardDescription>
                </div>
              </div>
              {userPlan === "pro" ? (
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Subscription Card */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userPlan === "pro" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-muted"}`}>
                {userPlan === "pro" ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Plano {userPlan === "pro" ? "Pro" : "Free"}
                  {userPlan === "pro" && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {userPlan === "pro"
                    ? "Você tem acesso a todos os recursos premium"
                    : "Faça upgrade para desbloquear todos os recursos"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {userPlan === "pro" ? (
              <>
                {subscriptionInfo.stripeCurrentPeriodEnd && (
                  <div className="rounded-xl bg-muted/50 p-4 border">
                    <p className="text-sm text-muted-foreground">
                      Sua assinatura renova em{" "}
                      <span className="font-medium text-foreground">
                        {format(new Date(subscriptionInfo.stripeCurrentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="gap-2"
                >
                  {loadingPortal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Gerenciar assinatura
                </Button>
                <p className="text-xs text-muted-foreground">
                  Altere seu método de pagamento, veja faturas ou cancele sua assinatura
                </p>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    Recursos do Plano Pro
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Faturas ilimitadas com IA</li>
                    <li>• Categorias personalizadas</li>
                    <li>• Exportação PDF/Excel</li>
                    <li>• Navegação histórica</li>
                    <li>• Suporte prioritário</li>
                  </ul>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleUpgrade}
                    disabled={loadingCheckout}
                    className="gap-2"
                  >
                    {loadingCheckout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    Fazer upgrade - {PLAN_PRICES.proMonthly.label}/mês
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cancele quando quiser. Garantia de 7 dias.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2"
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
