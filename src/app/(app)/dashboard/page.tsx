import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { incomes, expenses, userSettings } from "@/db/schema/finance"
import { eq, and, gte, lte, sql, count } from "drizzle-orm"
import { DashboardClient } from "./dashboard-client"
import { startOfMonth, endOfMonth, parse, format, subMonths } from "date-fns"

async function getMonthData(userId: string, date: Date) {
  const startDate = format(startOfMonth(date), "yyyy-MM-dd")
  const endDate = format(endOfMonth(date), "yyyy-MM-dd")

  // Get total incomes for the month
  const [incomesResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${incomes.amount}), 0)`,
    })
    .from(incomes)
    .where(
      and(
        eq(incomes.userId, userId),
        gte(incomes.occurrenceDate, startDate),
        lte(incomes.occurrenceDate, endDate)
      )
    )

  // Get total essential expenses
  const [essentialResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.type, "essential"),
        gte(expenses.occurrenceDate, startDate),
        lte(expenses.occurrenceDate, endDate)
      )
    )

  // Get total non-essential expenses
  const [nonEssentialResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.type, "non_essential"),
        gte(expenses.occurrenceDate, startDate),
        lte(expenses.occurrenceDate, endDate)
      )
    )

  return {
    incomes: parseFloat(incomesResult.total),
    essential: parseFloat(essentialResult.total),
    nonEssential: parseFloat(nonEssentialResult.total),
  }
}

async function getDashboardData(userId: string, currentDate: Date) {
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  // Get current month data
  const currentMonthData = await getMonthData(userId, currentDate)

  // Get last 6 months for chart
  const historicalData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(currentDate, 5 - i)
      return getMonthData(userId, date).then(data => ({
        name: format(date, "MMM", { locale: undefined }),
        month: format(date, "yyyy-MM"),
        entradas: data.incomes,
        despesas: data.essential + data.nonEssential,
        saldo: data.incomes - (data.essential + data.nonEssential),
      }))
    })
  )

  // Get user settings
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })

  // Count transactions for gamification
  const [incomeCount] = await db
    .select({ count: count() })
    .from(incomes)
    .where(eq(incomes.userId, userId))

  const [expenseCount] = await db
    .select({ count: count() })
    .from(expenses)
    .where(eq(expenses.userId, userId))

  // Calculate streak (consecutive months with positive balance)
  let streak = 0
  for (let i = historicalData.length - 1; i >= 0; i--) {
    if (historicalData[i].saldo >= 0) {
      streak++
    } else {
      break
    }
  }

  const totalIncomes = currentMonthData.incomes
  const totalEssential = currentMonthData.essential
  const totalNonEssential = currentMonthData.nonEssential
  const totalExpenses = totalEssential + totalNonEssential
  const monthlyBalance = totalIncomes - totalExpenses

  // Calculate emergency fund
  const emergencyFundMonths = settings?.emergencyFundMonths
    ? parseFloat(settings.emergencyFundMonths)
    : 6
  const idealEmergencyFund = totalEssential * emergencyFundMonths
  const currentSavings = settings?.currentSavings
    ? parseFloat(settings.currentSavings)
    : 0
  const emergencyFundProgress =
    idealEmergencyFund > 0 ? (currentSavings / idealEmergencyFund) * 100 : 0

  // Previous month for comparison
  const prevMonthData = await getMonthData(userId, subMonths(currentDate, 1))
  const prevBalance = prevMonthData.incomes - (prevMonthData.essential + prevMonthData.nonEssential)

  return {
    month,
    year,
    totalIncomes,
    totalEssential,
    totalNonEssential,
    totalExpenses,
    monthlyBalance,
    emergencyFund: {
      current: currentSavings,
      target: settings?.emergencyFundTarget
        ? parseFloat(settings.emergencyFundTarget)
        : idealEmergencyFund,
      ideal: idealEmergencyFund,
      months: emergencyFundMonths,
      progress: Math.min(emergencyFundProgress, 100),
    },
    // New data for charts and gamification
    historicalData,
    comparison: {
      prevBalance,
      balanceChange: prevBalance !== 0
        ? ((monthlyBalance - prevBalance) / Math.abs(prevBalance)) * 100
        : monthlyBalance > 0 ? 100 : 0,
      prevIncomes: prevMonthData.incomes,
      prevExpenses: prevMonthData.essential + prevMonthData.nonEssential,
    },
    gamification: {
      streak,
      totalTransactions: Number(incomeCount.count) + Number(expenseCount.count),
      achievements: calculateAchievements({
        streak,
        totalTransactions: Number(incomeCount.count) + Number(expenseCount.count),
        emergencyFundProgress: Math.min(emergencyFundProgress, 100),
        savingsRate: totalIncomes > 0 ? (monthlyBalance / totalIncomes) * 100 : 0,
      }),
    },
  }
}

interface AchievementInput {
  streak: number
  totalTransactions: number
  emergencyFundProgress: number
  savingsRate: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
  target?: number
}

function calculateAchievements(input: AchievementInput): Achievement[] {
  return [
    {
      id: "first_steps",
      title: "Primeiros Passos",
      description: "Registre sua primeira transação",
      icon: "🎯",
      unlocked: input.totalTransactions >= 1,
      progress: Math.min(input.totalTransactions, 1),
      target: 1,
    },
    {
      id: "organized",
      title: "Organizado",
      description: "Registre 10 transações",
      icon: "📊",
      unlocked: input.totalTransactions >= 10,
      progress: Math.min(input.totalTransactions, 10),
      target: 10,
    },
    {
      id: "financial_master",
      title: "Mestre Financeiro",
      description: "Registre 100 transações",
      icon: "🏆",
      unlocked: input.totalTransactions >= 100,
      progress: Math.min(input.totalTransactions, 100),
      target: 100,
    },
    {
      id: "positive_month",
      title: "Mês Positivo",
      description: "Termine o mês no azul",
      icon: "💚",
      unlocked: input.streak >= 1,
    },
    {
      id: "streak_3",
      title: "Consistência",
      description: "3 meses consecutivos no positivo",
      icon: "🔥",
      unlocked: input.streak >= 3,
      progress: Math.min(input.streak, 3),
      target: 3,
    },
    {
      id: "streak_6",
      title: "Imparável",
      description: "6 meses consecutivos no positivo",
      icon: "⚡",
      unlocked: input.streak >= 6,
      progress: Math.min(input.streak, 6),
      target: 6,
    },
    {
      id: "emergency_25",
      title: "Reserva Iniciada",
      description: "Atingir 25% da reserva de emergência",
      icon: "🛡️",
      unlocked: input.emergencyFundProgress >= 25,
      progress: Math.round(input.emergencyFundProgress),
      target: 25,
    },
    {
      id: "emergency_50",
      title: "Meio Caminho",
      description: "Atingir 50% da reserva de emergência",
      icon: "🏅",
      unlocked: input.emergencyFundProgress >= 50,
      progress: Math.round(input.emergencyFundProgress),
      target: 50,
    },
    {
      id: "emergency_100",
      title: "Segurança Total",
      description: "Completar a reserva de emergência",
      icon: "🏰",
      unlocked: input.emergencyFundProgress >= 100,
      progress: Math.round(Math.min(input.emergencyFundProgress, 100)),
      target: 100,
    },
    {
      id: "saver_20",
      title: "Poupador",
      description: "Economizar 20% ou mais da renda",
      icon: "💰",
      unlocked: input.savingsRate >= 20,
      progress: Math.round(input.savingsRate),
      target: 20,
    },
  ]
}

type PageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  const params = await searchParams

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) {
    redirect("/login")
  }

  // Parse month from URL or default to current
  const currentMonthDate = params.month
    ? parse(params.month, "yyyy-MM", new Date())
    : new Date()

  const data = await getDashboardData(user.id, currentMonthDate)

  return <DashboardClient data={data} currentMonth={currentMonthDate} userName={user.name} userPlan={user.plan as "free" | "pro"} />
}
