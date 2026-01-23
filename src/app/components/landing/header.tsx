"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Button } from "@/app/components/ui/button"
import { Menu, X, PiggyBank, Moon, Sun, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Recursos", href: "#recursos" },
  { name: "Preços", href: "#precos" },
  { name: "FAQ", href: "#faq" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  
  const isLoggedIn = status === "authenticated" && session?.user

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Penochão</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="mr-1"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            )}
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Usuário"}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-transparent group-hover:ring-primary/50 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {session.user.name?.split(" ")[0] || "Usuário"}
                  </span>
                </Link>
                <Button size="sm" asChild>
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Acessar Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/login">Começar grátis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            )}
            <button
              type="button"
              className="p-2 -m-2 text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Abrir menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "Usuário"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-medium text-primary">
                          {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{session.user.name || "Usuário"}</span>
                        <span className="text-xs text-muted-foreground">{session.user.email}</span>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/dashboard" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Acessar Dashboard
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/login">Começar grátis</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
