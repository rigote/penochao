import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Home, ArrowLeft, HelpCircle } from "lucide-react"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md text-center space-y-8">
        {/* 404 Icon */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-muted rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-muted-foreground/50">404</span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida para outro endereço.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir para o início
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        {/* Help link */}
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda?{" "}
          <a
            href="mailto:contato@penochao.app.br"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  )
}
