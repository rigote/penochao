"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { LogOut, ChevronRight, Sun, Moon } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface UserData {
  name: string | null
  email: string | null
  image: string | null
}

export function UserMenu({ user }: { user: UserData }) {
  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="p-4 mt-auto space-y-3">
      {/* Theme Toggle */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">Tema</span>
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              mounted && theme === "light" ? "bg-background shadow-sm" : "hover:bg-background/50"
            )}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              mounted && theme === "dark" ? "bg-background shadow-sm" : "hover:bg-background/50"
            )}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  )
}
