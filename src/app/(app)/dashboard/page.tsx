import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { incomes, expenses, userSettings } from "@/db/schema/finance"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { DashboardClient } from "./dashboard-client"

async function getDashboardData(userId: string, month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`

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

  // Get user settings
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })

  const totalIncomes = parseFloat(incomesResult.total)
  const totalEssential = parseFloat(essentialResult.total)
  const totalNonEssential = parseFloat(nonEssentialResult.total)
  const totalExpenses = totalEssential + totalNonEssential
  const monthlyBalance = totalIncomes - totalExpenses

  // Calculate emergency fund (6 months of essential expenses by default)
  const emergencyFundMonths = settings?.emergencyFundMonths
    ? parseFloat(settings.emergencyFundMonths)
    : 6
  const idealEmergencyFund = totalEssential * emergencyFundMonths
  const currentSavings = settings?.currentSavings
    ? parseFloat(settings.currentSavings)
    : 0
  const emergencyFundProgress =
    idealEmergencyFund > 0 ? (currentSavings / idealEmergencyFund) * 100 : 0

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
  }
}

import { startOfMonth, parse } from "date-fns"

// ... imports ...

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

  const month = currentMonthDate.getMonth() + 1
  const year = currentMonthDate.getFullYear()

  const data = await getDashboardData(user.id, month, year)

  return <DashboardClient data={data} currentMonth={currentMonthDate} />
}
