import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Controle financeiro inteligente com IA</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Organize suas finanças{" "}
            <span className="text-primary">sem complicação</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Gerencie despesas, acompanhe receitas e tenha uma visão clara do seu dinheiro. 
            Nossa IA lê suas faturas automaticamente e categoriza tudo para você.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="w-full sm:w-auto text-base px-8" asChild>
              <Link href="/login">
                Começar grátis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8" asChild>
              <a href="#precos">Ver planos</a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <TrustIndicator icon={<TrendingUp className="w-5 h-5" />} value="10k+" label="Transações" />
            <TrustIndicator icon={<Shield className="w-5 h-5" />} value="100%" label="Seguro" />
            <TrustIndicator icon={<Zap className="w-5 h-5" />} value="< 1s" label="Tempo de resposta" />
            <TrustIndicator icon={<Sparkles className="w-5 h-5" />} value="IA" label="Powered" />
          </div>
        </div>

        {/* App Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="pt-8 p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mock Dashboard Cards */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">R$ 8.450,00</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Despesas</p>
                    <p className="text-2xl font-bold text-red-600">R$ 5.230,00</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                    <p className="text-2xl font-bold text-primary">R$ 3.220,00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustIndicator({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode
  value: string
  label: string 
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
