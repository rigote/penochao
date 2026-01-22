"use client"

import { Button } from "@/app/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface User {
  name: string | null
  email: string | null
  image: string | null
}

export function UserMenu({ user }: { user: User }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold">
            {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  )
}
