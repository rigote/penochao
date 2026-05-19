import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border bg-primary px-8 py-14 sm:px-16 sm:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Faça seu Raio-X antes da próxima decisão financeira
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Comece grátis, importe faturas e veja o que precisa mudar para o mês fechar com mais folga.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base px-8"
                asChild
              >
                <Link href="/login">
                  Criar conta grátis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="#precos">Ver planos</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
