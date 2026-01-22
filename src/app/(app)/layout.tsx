import Link from "next/link"
import { getServerSession } from "next-auth"
import { PiggyBank } from "lucide-react"
import { Separator } from "@/app/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { UserMenu } from "./components/user-menu"
import { MobileNav } from "./components/mobile-nav"
import { redirect } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/entradas", label: "Entradas", icon: "ArrowUpCircle" },
  { href: "/despesas", label: "Despesas", icon: "ArrowDownCircle" },
  { href: "/faturas", label: "Upload de Faturas", icon: "FileText" },
  { href: "/configuracoes", label: "Configurações", icon: "Settings" },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  const user = {
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileNav navItems={navItems} user={user} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r bg-background">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                <PiggyBank className="h-8 w-8 text-primary" />
                <span>Penochão</span>
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                Controle Financeiro Pessoal
              </p>
            </div>

            <Separator />

            <SidebarNav navItems={navItems} />

            <Separator />

            <UserMenu user={user} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          <div className="container py-6 px-4 lg:px-8 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
