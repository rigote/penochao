import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { incomes, expenses, userSettings } from "@/db/schema/finance"
import { eq, and, gte, lte, sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || String(new Date().getMonth() + 1)
    const year = searchParams.get("year") || String(new Date().getFullYear())

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const startDate = `${year}-${month.padStart(2, "0")}-01`
    const endDate = `${year}-${month.padStart(2, "0")}-31`

    // Get total incomes for the month
    const [incomesResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${incomes.amount}), 0)`,
      })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
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
          eq(expenses.userId, user.id),
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
          eq(expenses.userId, user.id),
          eq(expenses.type, "non_essential"),
          gte(expenses.occurrenceDate, startDate),
          lte(expenses.occurrenceDate, endDate)
        )
      )

    // Get user settings
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
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

    return NextResponse.json({
      month: parseInt(month),
      year: parseInt(year),
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
    })
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
}
