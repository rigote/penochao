"use client"

import { Button } from "@/app/components/ui/button"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface User {
  name: string | null
  email: string | null
  image: string | null
}

export function UserMenu({ user }: { user: User }) {
  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()

  return (
    <div className="p-4 mt-auto space-y-4">
      {/* User Card */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <span className="text-sm font-semibold text-primary-foreground">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <ThemeToggle variant="compact" />
      </div>

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </Button>
    </div>
  )
}
