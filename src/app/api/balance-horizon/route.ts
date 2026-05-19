import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/db"
import { incomes, expenses } from "@/db/schema/finance"
import { eq, and, gte, lte } from "drizzle-orm"
import { decryptNumber } from "@/lib/encryption"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns"

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const startMonth = searchParams.get("start") // yyyy-MM
  const monthsCount = Math.min(
    parseInt(searchParams.get("months") || "3"),
    6
  )

  const baseDate = startMonth
    ? new Date(parseInt(startMonth.split("-")[0]), parseInt(startMonth.split("-")[1]) - 1, 15)
    : new Date()

  const rangeStart = startOfMonth(baseDate)
  const rangeEnd = endOfMonth(addMonths(baseDate, monthsCount - 1))

  const startDateStr = format(rangeStart, "yyyy-MM-dd")
  const endDateStr = format(rangeEnd, "yyyy-MM-dd")

  // Fetch PAST transactions to calculate the true starting balance
  const [pastIncomes, pastExpenses] = await Promise.all([
    db
      .select({ amount: incomes.amount, recurrence: incomes.recurrence, occurrenceDate: incomes.occurrenceDate })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          lte(incomes.occurrenceDate, format(new Date(rangeStart.getTime() - 86400000), "yyyy-MM-dd"))
        )
      ),
    db
      .select({ amount: expenses.amount, recurrence: expenses.recurrence, occurrenceDate: expenses.occurrenceDate })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, user.id),
          lte(expenses.occurrenceDate, format(new Date(rangeStart.getTime() - 86400000), "yyyy-MM-dd"))
        )
      ),
  ])

  // Calculate initial balance from all past transactions
  let initialBalance = 0

  for (const income of pastIncomes) {
    try {
      const amount = parseFloat(decryptNumber(income.amount))
      if (income.recurrence === "monthly") {
        const start = new Date(income.occurrenceDate + "T00:00:00")
        let occurrences = 0
        let current = new Date(start)
        while (current < rangeStart) {
          occurrences++
          current.setMonth(current.getMonth() + 1)
        }
        initialBalance += amount * occurrences
      } else {
        initialBalance += amount
      }
    } catch { /* skip */ }
  }

  for (const expense of pastExpenses) {
    try {
      const amount = parseFloat(decryptNumber(expense.amount))
      if (expense.recurrence === "monthly") {
        const start = new Date(expense.occurrenceDate + "T00:00:00")
        let occurrences = 0
        let current = new Date(start)
        while (current < rangeStart) {
          occurrences++
          current.setMonth(current.getMonth() + 1)
        }
        initialBalance -= amount * occurrences
      } else {
        initialBalance -= amount
      }
    } catch { /* skip */ }
  }

  // Fetch all incomes and expenses in the CURRENT range
  const [allIncomes, allExpenses] = await Promise.all([
    db
      .select({
        amount: incomes.amount,
        occurrenceDate: incomes.occurrenceDate,
        recurrence: incomes.recurrence,
      })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          gte(incomes.occurrenceDate, startDateStr),
          lte(incomes.occurrenceDate, endDateStr)
        )
      ),
    db
      .select({
        amount: expenses.amount,
        occurrenceDate: expenses.occurrenceDate,
        recurrence: expenses.recurrence,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, user.id),
          gte(expenses.occurrenceDate, startDateStr),
          lte(expenses.occurrenceDate, endDateStr)
        )
      ),
  ])

  // Also fetch monthly recurring transactions that started before our range
  const [recurringIncomes, recurringExpenses] = await Promise.all([
    db
      .select({
        amount: incomes.amount,
        occurrenceDate: incomes.occurrenceDate,
        recurrence: incomes.recurrence,
      })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          eq(incomes.recurrence, "monthly"),
          lte(incomes.occurrenceDate, endDateStr)
        )
      ),
    db
      .select({
        amount: expenses.amount,
        occurrenceDate: expenses.occurrenceDate,
        recurrence: expenses.recurrence,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, user.id),
          eq(expenses.recurrence, "monthly"),
          lte(expenses.occurrenceDate, endDateStr)
        )
      ),
  ])

  // Build a map of date -> net change (income - expense)
  const dailyNet: Record<string, number> = {}

  // Initialize all days to 0
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  for (const day of allDays) {
    dailyNet[format(day, "yyyy-MM-dd")] = 0
  }

  // Add one-time incomes
  for (const income of allIncomes) {
    if (income.recurrence === "monthly") continue // handled separately
    const dateKey = income.occurrenceDate
    if (dailyNet[dateKey] !== undefined) {
      try {
        dailyNet[dateKey] += parseFloat(decryptNumber(income.amount))
      } catch {
        // skip
      }
    }
  }

  // Add one-time expenses
  for (const expense of allExpenses) {
    if (expense.recurrence === "monthly") continue // handled separately
    const dateKey = expense.occurrenceDate
    if (dailyNet[dateKey] !== undefined) {
      try {
        dailyNet[dateKey] -= parseFloat(decryptNumber(expense.amount))
      } catch {
        // skip
      }
    }
  }

  // Add recurring monthly incomes: repeat on the same day of each month in range
  for (const income of recurringIncomes) {
    try {
      const amount = parseFloat(decryptNumber(income.amount))
      const origDay = parseInt(income.occurrenceDate.split("-")[2])
      const startDateObj = new Date(income.occurrenceDate + "T00:00:00")

      for (let m = 0; m < monthsCount; m++) {
        const monthDate = addMonths(rangeStart, m)
        // Skip if this month is before the transaction even started
        if (
          monthDate.getFullYear() < startDateObj.getFullYear() ||
          (monthDate.getFullYear() === startDateObj.getFullYear() && monthDate.getMonth() < startDateObj.getMonth())
        ) {
          continue
        }

        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        const lastDay = new Date(year, month + 1, 0).getDate()
        const day = Math.min(origDay, lastDay)
        const dateKey = format(new Date(year, month, day), "yyyy-MM-dd")

        if (dailyNet[dateKey] !== undefined) {
          dailyNet[dateKey] += amount
        }
      }
    } catch {
      // skip
    }
  }

  // Add recurring monthly expenses
  for (const expense of recurringExpenses) {
    try {
      const amount = parseFloat(decryptNumber(expense.amount))
      const origDay = parseInt(expense.occurrenceDate.split("-")[2])
      const startDateObj = new Date(expense.occurrenceDate + "T00:00:00")

      for (let m = 0; m < monthsCount; m++) {
        const monthDate = addMonths(rangeStart, m)
        // Skip if this month is before the transaction even started
        if (
          monthDate.getFullYear() < startDateObj.getFullYear() ||
          (monthDate.getFullYear() === startDateObj.getFullYear() && monthDate.getMonth() < startDateObj.getMonth())
        ) {
          continue
        }

        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        const lastDay = new Date(year, month + 1, 0).getDate()
        const day = Math.min(origDay, lastDay)
        const dateKey = format(new Date(year, month, day), "yyyy-MM-dd")

        if (dailyNet[dateKey] !== undefined) {
          dailyNet[dateKey] -= amount
        }
      }
    } catch {
      // skip
    }
  }

  // Build cumulative balance per month
  const months: Array<{
    month: string // "yyyy-MM"
    label: string // "Mai/26"
    days: Array<{
      day: number
      balance: number
    }>
  }> = []

  let runningBalance = initialBalance

  for (let m = 0; m < monthsCount; m++) {
    const monthDate = addMonths(rangeStart, m)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const monthKey = format(monthDate, "yyyy-MM")
    const monthLabel = format(monthDate, "MMM/yy")
    const daysArr: Array<{ day: number; balance: number }> = []

    for (const day of daysInMonth) {
      const dateKey = format(day, "yyyy-MM-dd")
      runningBalance += dailyNet[dateKey] || 0
      daysArr.push({
        day: day.getDate(),
        balance: Math.round(runningBalance * 100) / 100,
      })
    }

    months.push({
      month: monthKey,
      label: monthLabel,
      days: daysArr,
    })
  }

  return NextResponse.json({ months })
}
