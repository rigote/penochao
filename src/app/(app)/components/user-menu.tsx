"use client"

import { Button } from "@/app/components/ui/button"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"
import { LogOut, Settings } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface User {
  name: string | null
  email: string | null
  image: string | null
}

export function UserMenu({ user }: { user: User }) {
  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()

  return (
    <div className="p-4 mt-auto">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
          <span className="text-sm font-bold text-primary-foreground">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <ThemeToggle variant="compact" />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link href="/configuracoes">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}

