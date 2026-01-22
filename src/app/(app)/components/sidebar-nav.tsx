"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: string
}

const iconMap = {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
}

export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-4 py-4 space-y-1.5">
      {navItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap]
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {/* Active indicator glow */}
            {isActive && (
              <span className="absolute inset-0 rounded-xl bg-primary/20 blur-lg -z-10" />
            )}

            {/* Icon with animation */}
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive
                    ? "drop-shadow-sm"
                    : "group-hover:scale-110 group-hover:text-primary"
                )}
              />
            )}

            {/* Label */}
            <span className="font-medium">{item.label}</span>

            {/* Hover indicator */}
            {!isActive && (
              <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
