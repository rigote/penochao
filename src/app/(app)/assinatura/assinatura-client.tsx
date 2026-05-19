"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
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
  Crown, 
  Check, 
  Loader2, 
  ExternalLink, 
  Sparkles,
  Zap,
  FileText,
  FolderTree,
  Clock,
  Headphones,
  Shield,
  XCircle,
  AlertTriangle,
  Ticket,
  Gift
} from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PLAN_PRICES, PRO_TRIAL_DAYS } from "@/config/plans"

interface CourtesyInfo {
  expiresAt: string
  invoiceLimit: number | null
  couponCode: string | null
  redeemedAt: string
}

interface SubscriptionInfo {
  plan: "free" | "pro"
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeCurrentPeriodEnd: Date | null
  subscriptionStartDate: Date | null
  cancelAtPeriodEnd: boolean
  courtesyInfo: CourtesyInfo | null
  hasUsedProTrial: boolean
}

interface AssinaturaClientProps {
  subscriptionInfo: SubscriptionInfo
}

const proFeatures = [
  { icon: Zap, text: "Faturas ilimitadas com IA", description: "Processe quantas faturas quiser" },
  { icon: FolderTree, text: "Categorias personalizadas", description: "Crie e organize suas próprias categorias" },
  { icon: FileText, text: "Exportação PDF/Excel", description: "Exporte seus dados quando precisar" },
  { icon: Clock, text: "Navegação histórica", description: "Acesse dados de meses anteriores" },
  { icon: Headphones, text: "Suporte prioritário", description: "Resposta em até 24h úteis" },
  { icon: Sparkles, text: "Acesso antecipado", description: "Novidades antes de todo mundo" },
]

interface CouponInfo {
  id: string
  code: string
  type: "discount" | "courtesy"
  discountPercent: number | null
  courtesyDays: number | null
  description: string | null
}

export function AssinaturaClient({ subscriptionInfo }: AssinaturaClientProps) {
  const router = useRouter()
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState<"monthly" | "annual" | null>(null)
  const [loadingCancel, setLoadingCancel] = useState(false)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [validCoupon, setValidCoupon] = useState<CouponInfo | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [redeemingCoupon, setRedeemingCoupon] = useState(false)
  const trialAvailable = !subscriptionInfo.hasUsedProTrial

  // The checkout starts new Stripe subscriptions with a free trial.
  const daysActive = subscriptionInfo.subscriptionStartDate
    ? differenceInDays(new Date(), new Date(subscriptionInfo.subscriptionStartDate))
    : 0
  const isWithinTrialWindow = daysActive <= PRO_TRIAL_DAYS
  const daysRemaining = Math.max(0, PRO_TRIAL_DAYS - daysActive)

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom")
      return
    }

    setValidatingCoupon(true)
    setCouponError(null)
    setValidCoupon(null)

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        setValidCoupon(data.coupon)
        toast.success("Cupom válido!", {
          description: data.coupon.type === "courtesy"
            ? `${data.coupon.courtesyDays} dias de Pro grátis`
            : `${data.coupon.discountPercent}% de desconto`,
        })
      } else {
        setCouponError(data.error || "Cupom inválido")
      }
    } catch (error) {
      setCouponError("Erro ao validar cupom")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRedeemCourtesy = async () => {
    if (!validCoupon || validCoupon.type !== "courtesy") return

    setRedeemingCoupon(true)
    try {
      const response = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: validCoupon.code }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        router.refresh()
      } else {
        toast.error(data.error || "Erro ao resgatar cupom")
      }
    } catch (error) {
      toast.error("Erro ao resgatar cupom")
    } finally {
      setRedeemingCoupon(false)
    }
  }

  const clearCoupon = () => {
    setCouponCode("")
    setValidCoupon(null)
    setCouponError(null)
  }

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

  const handleUpgrade = async (period: "monthly" | "annual") => {
    setLoadingCheckout(period)
    try {
      const priceId = period === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
      
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          priceId,
          couponCode: validCoupon?.type === "discount" ? validCoupon.code : null,
        }),
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
      setLoadingCheckout(null)
    }
  }

  const handleCancelSubscription = async () => {
    setLoadingCancel(true)
    try {
      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
      })
      const data = await response.json()
      
      if (data.success) {
        if (data.refunded) {
          toast.success("Assinatura cancelada", {
            description: "O valor foi reembolsado para seu cartão.",
          })
        } else if (data.cancelAt) {
          toast.success("Assinatura cancelada", {
            description: `Você manterá acesso ao Pro até ${format(new Date(data.cancelAt), "dd/MM/yyyy")}.`,
          })
        } else {
          toast.success("Assinatura cancelada", {
            description: data.message || "Seu teste gratuito foi encerrado sem cobrança.",
          })
        }
        router.refresh()
      } else {
        throw new Error(data.error || "Erro ao cancelar")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar assinatura")
    } finally {
      setLoadingCancel(false)
    }
  }

  const isPro = subscriptionInfo.plan === "pro"

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Assinatura</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Meu Plano
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua assinatura do Penochão
        </p>
      </div>

      {/* Current Plan Status */}
      <Card variant="elevated" className={cn(
        "overflow-hidden",
        isPro && "border-amber-500/50"
      )}>
        {isPro && (
          <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isPro 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                  : "bg-muted"
              )}>
                <Crown className={cn("h-6 w-6", isPro ? "text-white" : "text-muted-foreground")} />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Plano {isPro ? "Pro" : "Free"}
                  {isPro && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {isPro
                    ? "Você tem acesso completo a todos os recursos"
                    : "Recursos básicos para começar"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="space-y-4">
              {/* Cancel at period end notice */}
              {subscriptionInfo.cancelAtPeriodEnd && subscriptionInfo.stripeCurrentPeriodEnd && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600">Cancelamento agendado</p>
                    <p className="text-sm text-muted-foreground">
                      Sua assinatura será cancelada em {format(new Date(subscriptionInfo.stripeCurrentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}. Você manterá acesso ao Pro até essa data.
                    </p>
                  </div>
                </div>
              )}

              {/* Next renewal / guarantee info - only show if has Stripe subscription */}
              {!subscriptionInfo.cancelAtPeriodEnd && subscriptionInfo.stripeSubscriptionId && (
                <>
                  {subscriptionInfo.stripeCurrentPeriodEnd && (
                    <div className="rounded-xl bg-muted/50 p-4 border flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Próxima renovação</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(subscriptionInfo.stripeCurrentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {isWithinTrialWindow && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Teste gratuito ativo</p>
                        <p className="text-sm text-muted-foreground">
                          Você ainda tem {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"} antes da primeira cobrança.
                          Cancele antes do fim do teste para não ser cobrado.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Courtesy plan info */}
              {!subscriptionInfo.stripeSubscriptionId && subscriptionInfo.courtesyInfo && (
                <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 border border-purple-500/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Plano Cortesia</p>
                        {subscriptionInfo.courtesyInfo.couponCode && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            {subscriptionInfo.courtesyInfo.couponCode}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acesso Pro gratuito até{" "}
                        <strong>{format(new Date(subscriptionInfo.courtesyInfo.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
                      </p>
                    </div>
                  </div>
                  
                  {/* Days remaining */}
                  {(() => {
                    const daysLeft = differenceInDays(new Date(subscriptionInfo.courtesyInfo.expiresAt), new Date())
                    const totalDays = differenceInDays(new Date(subscriptionInfo.courtesyInfo.expiresAt), new Date(subscriptionInfo.courtesyInfo.redeemedAt))
                    const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100))
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Tempo restante</span>
                          <span className={cn(
                            "font-medium",
                            daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : "text-green-500"
                          )}>
                            {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              daysLeft <= 3 ? "bg-red-500" : daysLeft <= 7 ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-blue-500"
                            )}
                            style={{ width: `${100 - progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* Invoice limit if applicable */}
                  {subscriptionInfo.courtesyInfo.invoiceLimit && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Limite: {subscriptionInfo.courtesyInfo.invoiceLimit} faturas IA por mês</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Manual upgrade without courtesy info */}
              {!subscriptionInfo.stripeSubscriptionId && !subscriptionInfo.courtesyInfo && (
                <div className="rounded-xl bg-muted/50 p-4 border flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Plano cortesia</p>
                    <p className="text-sm text-muted-foreground">
                      Seu acesso Pro foi concedido manualmente. Aproveite todos os recursos!
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons - only show if has Stripe subscription */}
              {subscriptionInfo.stripeSubscriptionId && (
                <div className="flex flex-wrap gap-3">
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
                    Gerenciar pagamento
                  </Button>

                  {!subscriptionInfo.cancelAtPeriodEnd && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            {isWithinTrialWindow ? (
                              <>
                                <p>
                                  Você está dentro do <strong>teste gratuito de {PRO_TRIAL_DAYS} dias</strong>.
                                </p>
                                <p>
                                  Ao cancelar agora, sua assinatura será encerrada imediatamente e não haverá cobrança do plano Pro.
                                </p>
                              </>
                            ) : (
                              <>
                                <p>
                                  Sua assinatura será cancelada, mas você <strong>manterá acesso ao plano Pro</strong> até o final do período atual.
                                </p>
                                {subscriptionInfo.stripeCurrentPeriodEnd && (
                                  <p>
                                    Acesso Pro até: <strong>{format(new Date(subscriptionInfo.stripeCurrentPeriodEnd), "dd/MM/yyyy")}</strong>
                                  </p>
                                )}
                              </>
                            )}
                            <p className="text-sm">
                              Tem certeza que deseja continuar?
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={loadingCancel}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {loadingCancel ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {isWithinTrialWindow ? "Cancelar teste" : "Confirmar cancelamento"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </div>
              )}

              {subscriptionInfo.stripeSubscriptionId && (
                <p className="text-xs text-muted-foreground">
                  {isWithinTrialWindow
                    ? "Cancele antes do fim do teste para não ser cobrado."
                    : "Altere método de pagamento ou veja faturas no portal Stripe."}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {trialAvailable
                ? `Teste o plano Pro por ${PRO_TRIAL_DAYS} dias grátis e desbloqueie todos os recursos premium.`
                : "Assine o plano Pro para desbloquear todos os recursos premium."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pro Features */}
      {!isPro && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-4">Recursos do Plano Pro</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {proFeatures.map((feature) => (
                <div 
                  key={feature.text}
                  className="flex items-start gap-3 p-4 rounded-xl border bg-card"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.text}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Section */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Tem um cupom?
              </CardTitle>
              <CardDescription>
                Insira seu código de desconto ou cortesia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponError(null)
                  }}
                  className="uppercase"
                  disabled={!!validCoupon}
                />
                {validCoupon ? (
                  <Button variant="outline" onClick={clearCoupon}>
                    Limpar
                  </Button>
                ) : (
                  <Button 
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                )}
              </div>

              {couponError && (
                <p className="text-sm text-destructive">{couponError}</p>
              )}

              {validCoupon && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      {validCoupon.type === "courtesy" ? (
                        <Gift className="w-5 h-5 text-green-600" />
                      ) : (
                        <Ticket className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-600">
                        Cupom {validCoupon.code} aplicado!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {validCoupon.type === "courtesy"
                          ? `${validCoupon.courtesyDays} dias de Plano Pro grátis`
                          : `${validCoupon.discountPercent}% de desconto na assinatura`}
                      </p>
                      
                      {validCoupon.type === "courtesy" && (
                        <Button
                          className="mt-3 gap-2"
                          onClick={handleRedeemCourtesy}
                          disabled={redeemingCoupon}
                        >
                          {redeemingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Gift className="w-4 h-4" />
                          )}
                          Ativar Pro Grátis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {validCoupon?.type === "discount" 
                ? `Escolha seu plano (${validCoupon.discountPercent}% de desconto)`
                : "Escolha seu plano"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Monthly */}
              <Card variant="elevated" className="relative">
                <CardHeader>
                  <CardTitle>Mensal</CardTitle>
                  <CardDescription>
                    {trialAvailable ? `${PRO_TRIAL_DAYS} dias grátis, depois mensal` : "Cobrança mensal"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">{PLAN_PRICES.proMonthly.label}</span>
                    <span className="text-muted-foreground">{PLAN_PRICES.proMonthly.intervalLabel}</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Todos os recursos Pro
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      {trialAvailable ? "Cancele antes da cobrança" : "Cancele quando quiser"}
                    </li>
                  </ul>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => handleUpgrade("monthly")}
                    disabled={loadingCheckout !== null}
                  >
                    {loadingCheckout === "monthly" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    {trialAvailable ? "Testar Mensal" : "Assinar Mensal"}
                  </Button>
                </CardContent>
              </Card>

              {/* Annual */}
              <Card variant="elevated" className="relative border-primary">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    Economia de 20%
                  </span>
                </div>
                <CardHeader>
                  <CardTitle>Anual</CardTitle>
                  <CardDescription>
                    {trialAvailable ? `${PRO_TRIAL_DAYS} dias grátis, depois anual` : "Cobrança anual"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">{PLAN_PRICES.proAnnual.label}</span>
                    <span className="text-muted-foreground">{PLAN_PRICES.proAnnual.intervalLabel}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equivale a {PLAN_PRICES.proAnnual.equivalentMonthlyLabel}/mês
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Todos os recursos Pro
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      2 meses grátis
                    </li>
                  </ul>
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleUpgrade("annual")}
                    disabled={loadingCheckout !== null}
                  >
                    {loadingCheckout === "annual" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    {trialAvailable ? "Testar Anual" : "Assinar Anual"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Guarantee */}
          <div className="rounded-xl bg-muted/50 border p-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {trialAvailable ? `${PRO_TRIAL_DAYS} dias grátis antes da cobrança` : "Assinatura protegida pelo Stripe"}
              </p>
              <p className="text-xs text-muted-foreground">
                {trialAvailable
                  ? "O Stripe só cobra após o período de teste. Você pode cancelar antes pelo portal."
                  : "Como o teste grátis já foi usado nesta conta, a cobrança começa no checkout."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
