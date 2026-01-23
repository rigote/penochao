"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
  LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: string
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
}

// Clean accent colors for each menu item
const accentColors: Record<string, { accent: string; bg: string }> = {
  "/dashboard": { accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  "/entradas": { accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  "/despesas": { accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  "/faturas": { accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  "/configuracoes": { accent: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10" },
}

export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const colors = accentColors[item.href] || accentColors["/dashboard"]

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? `${colors.bg} ${colors.accent}`
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                isActive ? colors.bg : "group-hover:bg-accent"
              )}>
                {Icon && (
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-colors",
                      isActive ? colors.accent : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span>{item.label}</span>

              {/* Active indicator */}
              {isActive && (
                <span className={cn(
                  "ml-auto w-1.5 h-1.5 rounded-full",
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
  )
}
