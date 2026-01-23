import Link from "next/link"
import { getServerSession } from "next-auth"
import { PiggyBank, Sparkles, MessageSquarePlus } from "lucide-react"
import { Separator } from "@/app/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { UserMenu } from "./components/user-menu"
import { MobileNav } from "./components/mobile-nav"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { FeedbackDialog } from "@/app/components/shared/feedback-dialog"

const baseNavItems = [
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
              <FeedbackDialog>
                <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent/50 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <MessageSquarePlus className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
                  Feedback
                </button>
              </FeedbackDialog>
            </div>

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
