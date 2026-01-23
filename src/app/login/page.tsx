"use client"

import Link from "next/link"
import { PiggyBank } from "lucide-react"
import { UserAuthForm } from "@/app/login/components/user-auth-form"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
              <PiggyBank className="w-6 h-6" />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Bem-vindo ao Penochão
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entre na sua conta para continuar
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <UserAuthForm />
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <Link
            href="/termos"
            className="underline underline-offset-4 hover:text-primary"
          >
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-4 hover:text-primary"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
