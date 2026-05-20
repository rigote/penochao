"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
  ShieldCheck,
  Crown,
  Activity,
  PiggyBank,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  LucideIcon,
  ChevronRight,
  Calculator,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { useTheme } from "@/app/context/theme-provider"
import { FeedbackDialog } from "@/app/components/shared/feedback-dialog"

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
  ShieldCheck,
  Crown,
  Activity,
  Calculator,
  TrendingUp,
  MessageSquare,
}

// Clean accent colors removed

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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PiggyBank className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Penochão</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}

            {/* User avatar */}
            <Link href="/perfil" className="block">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-1 ring-border">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-primary">
                    {initials}
                  </span>
                )}
              </div>
            </Link>

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
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
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

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center w-5 h-5">
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}

              <div className="pt-2">
                <FeedbackDialog onOpen={() => setMobileMenuOpen(false)} />
              </div>
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
            <Link href="/perfil" className="block group" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>

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
