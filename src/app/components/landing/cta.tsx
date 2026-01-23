import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Comece a organizar suas finanças hoje
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Junte-se a milhares de pessoas que já estão no controle do seu dinheiro. 
              É grátis para começar.
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
