"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { Github } from "lucide-react"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Icons } from "@/app/components/icons"

interface FormData {
  email: string
  password: string
}

export function UserAuthForm({ onSubmit, className }: { onSubmit: (data: FormData) => void, className?: string }) {
  const { handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={cn("grid gap-6", className)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isSubmitting}
            />
          </div>
          <Button disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Entrar com Email
          </Button>
        </div>
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
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={() => signIn("github")}>
            <Github className="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={() => signIn("google")}>
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </div>
    </form>
  )
} 