import Link from "next/link"
import { getServerSession } from "next-auth"
import { PiggyBank, Sparkles } from "lucide-react"
import { Separator } from "@/app/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { UserMenu } from "./components/user-menu"
import { MobileNav } from "./components/mobile-nav"
import { redirect } from "next/navigation"
import { db } from "@/db"

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

  const dbUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!dbUser) {
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
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r bg-gradient-to-b from-background to-muted/30">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />

          <div className="relative flex flex-col h-full">
            {/* Logo Area */}
            <div className="p-6">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
                    <PiggyBank className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <span className="font-bold text-xl text-gradient">Penochão</span>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Controle Financeiro
                  </p>
                </div>
              </Link>
            </div>

            <Separator className="opacity-50" />

            <SidebarNav navItems={navItems} />

            <Separator className="opacity-50" />

            <UserMenu user={user} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          <div className="container py-8 px-4 lg:px-8 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
