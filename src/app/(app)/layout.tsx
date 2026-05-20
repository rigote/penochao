import Link from "next/link"
import { getServerSession } from "next-auth"
import { PiggyBank, Sparkles } from "lucide-react"
import { Separator } from "@/app/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { UserMenu } from "./components/user-menu"
import { MobileNav } from "./components/mobile-nav"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { FeedbackDialog } from "@/app/components/shared/feedback-dialog"
import { AnalyticsProvider } from "@/app/components/analytics-provider"
import { resolveEffectiveUserPlan } from "@/lib/subscription"

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/assistente", label: "Assistente IA", icon: "MessageSquare" },
  { href: "/raio-x", label: "Raio-X", icon: "Activity" },
  { href: "/previsao-diaria", label: "Previsão Diária", icon: "Calculator" },
  { href: "/horizonte-saldos", label: "Horizonte de Saldos", icon: "TrendingUp" },
  { href: "/entradas", label: "Entradas", icon: "ArrowUpCircle" },
  { href: "/despesas", label: "Despesas", icon: "ArrowDownCircle" },
  { href: "/faturas", label: "Upload de Faturas", icon: "FileText" },
  { href: "/configuracoes", label: "Configurações", icon: "Settings" },
  { href: "/assinatura", label: "Meu Plano", icon: "Crown" },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  const foundUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!foundUser) {
    redirect("/login")
  }

  const dbUser = await resolveEffectiveUserPlan(foundUser)

  const user = {
    name: dbUser.name || session.user.name || null,
    email: dbUser.email || session.user.email || null,
    image: dbUser.image || null,
  }

  const navItems = [...baseNavItems]
  const ADMIN_EMAILS = ["matheus.rigote@gmail.com", "ipelabsapp@gmail.com"]

  if (user.email && ADMIN_EMAILS.includes(user.email)) {
    navItems.push({ href: "/admin", label: "Admin", icon: "ShieldCheck" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileNav navItems={navItems} user={user} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r bg-card">
          <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="p-6">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-bold text-xl">Penochão</span>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Controle Financeiro
                  </p>
                </div>
              </Link>
            </div>

            <Separator className="opacity-50" />

            <SidebarNav navItems={navItems} />

            <div className="px-3 pb-4">
              <FeedbackDialog />

            </div>

            <Separator className="opacity-50" />

            <UserMenu user={user} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          <div className="container py-8 px-4 lg:px-8 max-w-6xl">
            <AnalyticsProvider />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
