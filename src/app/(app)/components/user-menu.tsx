"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { ThemeToggle } from "@/app/components/shared/theme-toggle"
import { LogOut, ChevronRight } from "lucide-react"
import { signOut } from "next-auth/react"

interface UserData {
  name: string | null
  email: string | null
  image: string | null
}

export function UserMenu({ user }: { user: UserData }) {
  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()

  return (
    <div className="p-4 mt-auto space-y-3">
      {/* User Card - Clickable to go to profile */}
      <Link href="/perfil" className="block group">
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border">
            {user.image ? (
              <Image
                src={user.image}
                alt="Avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user.name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </Link>

      {/* Theme Toggle & Logout Row */}
      <div className="flex items-center gap-2">
        <ThemeToggle variant="compact" />

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
