import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { incomes, expenses, userSettings } from "@/db/schema/finance"
import { eq, and, gte, lte, sql, or } from "drizzle-orm"
import { decryptNumber } from "@/lib/encryption"

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
    const incomeMonthCondition = or(
      and(
        eq(incomes.recurrence, "monthly"),
        lte(incomes.occurrenceDate, endDate)
      ),
      and(
        eq(incomes.recurrence, "once"),
        gte(incomes.occurrenceDate, startDate),
        lte(incomes.occurrenceDate, endDate)
      )
    )
    const expenseMonthCondition = or(
      and(
        eq(expenses.recurrence, "monthly"),
        lte(expenses.occurrenceDate, endDate)
      ),
      and(
        eq(expenses.recurrence, "once"),
        gte(expenses.occurrenceDate, startDate),
        lte(expenses.occurrenceDate, endDate)
      )
    )

    // Since amounts are encrypted, we need to fetch all records and decrypt them
    // Get all incomes for the month
    const allIncomes = await db
      .select({ amount: incomes.amount })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          incomeMonthCondition
        )
      )

    // Get all essential expenses
    const allEssentialExpenses = await db
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, user.id),
          eq(expenses.type, "essential"),
          expenseMonthCondition
        )
      )

    // Get all non-essential expenses
    const allNonEssentialExpenses = await db
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, user.id),
          eq(expenses.type, "non_essential"),
          expenseMonthCondition
        )
      )

    // Decrypt and sum amounts
    const totalIncomes = allIncomes.reduce((sum, income) => {
      try {
        return sum + parseFloat(decryptNumber(income.amount))
      } catch {
        return sum
      }
    }, 0)

    const totalEssential = allEssentialExpenses.reduce((sum, expense) => {
      try {
        return sum + parseFloat(decryptNumber(expense.amount))
      } catch {
        return sum
      }
    }, 0)

    const totalNonEssential = allNonEssentialExpenses.reduce((sum, expense) => {
      try {
        return sum + parseFloat(decryptNumber(expense.amount))
      } catch {
        return sum
      }
    }, 0)

    // Get user settings
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    })

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
