"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Settings,
  ShieldCheck,
  Crown,
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
  ShieldCheck,
  Crown,
}

export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              )}

              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
