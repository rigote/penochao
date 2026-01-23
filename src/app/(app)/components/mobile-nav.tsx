"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
  PiggyBank,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  LucideIcon,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"

interface NavItem {
  href: string
  label: string
  icon: string
}

interface User {
  name: string | null
  email: string | null
  image: string | null
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
}

// Clean accent colors matching desktop sidebar
const accentColors: Record<string, { accent: string; bg: string }> = {
  "/dashboard": { accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  "/entradas": { accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  "/despesas": { accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  "/faturas": { accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  "/configuracoes": { accent: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10" },
}

export function MobileNav({ navItems, user }: { navItems: NavItem[], user: User }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <PiggyBank className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-lg">Penochão</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative h-9 w-9"
            >
              <div className={cn(
                "transition-all duration-200",
                mobileMenuOpen ? "rotate-90" : "rotate-0"
              )}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-200 ease-out lg:hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Penochão</span>
              <p className="text-xs text-muted-foreground">Finanças Pessoais</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const colors = accentColors[item.href] || accentColors["/dashboard"]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? `${colors.bg} ${colors.accent}`
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-md transition-colors",
                      isActive ? colors.bg : "bg-muted/50"
                    )}>
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? colors.accent : "text-muted-foreground"
                          )}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <span className="flex-1">{item.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        colors.accent.includes("violet") ? "bg-violet-500" :
                          colors.accent.includes("emerald") ? "bg-emerald-500" :
                            colors.accent.includes("rose") ? "bg-rose-500" :
                              colors.accent.includes("blue") ? "bg-blue-500" :
                                "bg-slate-500"
                      )} />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Tema</span>
              <div className="flex gap-1 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    mounted && theme === "light" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    mounted && theme === "dark" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>

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
            </div>

            {/* Logout */}
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
        </div>
      </aside>
    </>
  )
}
