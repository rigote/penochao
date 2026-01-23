"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Icons } from "@/app/components/icons"

interface FormData {
  email: string
  code: string
}

export function UserAuthForm({ className }: { className?: string }) {
  const router = useRouter()
  const [step, setStep] = React.useState<"email" | "code">("email")
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, setFocus } = useForm<FormData>()

  // Step 1: Send OTP
  async function onSendOtp(data: FormData) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })

      if (!response.ok) throw new Error("Falha ao enviar código")

      setEmail(data.email)
      setStep("code")
      toast.success("Código enviado para seu e-mail!")
      // Focus on code input after small delay
      setTimeout(() => setFocus("code"), 100)
    } catch (_error) {
      toast.error("Erro ao enviar código. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  async function onVerifyOtp(data: FormData) {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: email,
        code: data.code,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Código inválido ou expirado.")
      } else {
        toast.success("Login realizado com sucesso!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (_error) {
      toast.error("Erro ao fazer login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)}>
      <form onSubmit={handleSubmit(step === "email" ? onSendOtp : onVerifyOtp)}>
        <div className="grid gap-4">

          {step === "email" && (
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="nome@exemplo.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
                {...register("email")}
              />
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="code">
                  Código de 6 dígitos
                </Label>
                <Input
                  id="code"
                  placeholder="000000"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoComplete="one-time-code"
                  disabled={isLoading}
                  required
                  {...register("code")}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Enviamos um código para <strong>{email}</strong>
              </p>
            </div>
          )}

          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {step === "email" ? "Continuar com Email" : "Verificar Código"}
          </Button>

          {step === "code" && (
            <Button
              variant="ghost"
              type="button"
              size="sm"
              className="text-xs"
              onClick={() => setStep("email")}
              disabled={isLoading}
            >
              Voltar e corrigir e-mail
            </Button>
          )}

        </div>
      </form>

      {step === "email" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            <Button variant="outline" type="button" disabled={isLoading} onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 