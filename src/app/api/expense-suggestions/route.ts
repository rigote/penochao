import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { expenses, incomes, categories, expenseSuggestions } from "@/db/schema/finance"
import { eq, and, gte, lte } from "drizzle-orm"
import { decrypt, decryptNumber } from "@/lib/encryption"
import { analyzeExpensesForSavings } from "@/lib/gemini"
import { startOfMonth, endOfMonth, format } from "date-fns"
import crypto from "crypto"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const force = searchParams.get("force") === "true" // Force new analysis even if cached

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if user is on Pro plan
    if (user.plan !== "pro") {
      return NextResponse.json(
        { error: "Esta funcionalidade está disponível apenas no plano Pro" },
        { status: 403 }
      )
    }

    // Get current month or specified month
    const currentDate = month && year
      ? new Date(parseInt(year), parseInt(month) - 1, 1)
      : new Date()
    
    const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd")
    const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd")

    // Get all incomes for the month
    const allIncomes = await db
      .select({ amount: incomes.amount })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          gte(incomes.occurrenceDate, startDate),
          lte(incomes.occurrenceDate, endDate)
        )
      )

    // Get all expenses for the month with category info
    const allExpenses = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        type: expenses.type,
        recurrence: expenses.recurrence,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, user.id),
          gte(expenses.occurrenceDate, startDate),
          lte(expenses.occurrenceDate, endDate)
        )
      )

    // Decrypt and calculate totals
    const totalIncomes = allIncomes.reduce((sum, income) => {
      try {
        return sum + parseFloat(decryptNumber(income.amount))
      } catch {
        return sum
      }
    }, 0)

    const decryptedExpenses = allExpenses.map((expense) => ({
      description: decrypt(expense.description),
      amount: parseFloat(decryptNumber(expense.amount)),
      type: expense.type as "essential" | "non_essential",
      recurrence: expense.recurrence as "monthly" | "once",
      category: expense.categoryName || undefined,
    }))

    const totalExpenses = decryptedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const monthlyBalance = totalIncomes - totalExpenses

    // Only generate suggestions if user is in the red
    if (monthlyBalance >= 0) {
      return NextResponse.json({
        suggestions: [],
        totalPotentialSavings: 0,
        summary: "Seu saldo está positivo! Continue assim.",
        monthlyBalance,
        totalIncomes,
        totalExpenses,
        cached: false,
      })
    }

    // Generate hash of expenses to detect changes
    const expensesHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify(
          decryptedExpenses
            .map((e) => `${e.description}:${e.amount}:${e.type}:${e.recurrence}`)
            .sort()
        )
      )
      .digest("hex")

    const monthKey = format(currentDate, "yyyy-MM")

    // Check if we have cached suggestions for this month
    const cachedSuggestion = await db.query.expenseSuggestions.findFirst({
      where: and(
        eq(expenseSuggestions.userId, user.id),
        eq(expenseSuggestions.month, monthKey)
      ),
    })

    // If cached and expenses haven't changed, return cached data (unless forced)
    if (!force && cachedSuggestion && cachedSuggestion.expensesHash === expensesHash) {
      return NextResponse.json({
        suggestions: cachedSuggestion.suggestions as any,
        totalPotentialSavings: parseFloat(cachedSuggestion.totalPotentialSavings),
        summary: cachedSuggestion.summary,
        monthlyBalance: parseFloat(cachedSuggestion.monthlyBalance),
        totalIncomes: parseFloat(cachedSuggestion.totalIncomes),
        totalExpenses: parseFloat(cachedSuggestion.totalExpenses),
        cached: true,
      })
    }

    // Analyze expenses with AI (expenses changed or no cache)
    const analysis = await analyzeExpensesForSavings(
      decryptedExpenses,
      totalIncomes,
      totalExpenses,
      monthlyBalance
    )

    // Save or update cache
    if (cachedSuggestion) {
      // Update existing cache
      await db
        .update(expenseSuggestions)
        .set({
          suggestions: analysis.suggestions as any,
          totalPotentialSavings: analysis.totalPotentialSavings.toString(),
          summary: analysis.summary,
          expensesHash,
          monthlyBalance: monthlyBalance.toString(),
          totalIncomes: totalIncomes.toString(),
          totalExpenses: totalExpenses.toString(),
          updatedAt: new Date(),
        })
        .where(eq(expenseSuggestions.id, cachedSuggestion.id))
    } else {
      // Create new cache entry
      await db.insert(expenseSuggestions).values({
        userId: user.id,
        month: monthKey,
        suggestions: analysis.suggestions as any,
        totalPotentialSavings: analysis.totalPotentialSavings.toString(),
        summary: analysis.summary,
        expensesHash,
        monthlyBalance: monthlyBalance.toString(),
        totalIncomes: totalIncomes.toString(),
        totalExpenses: totalExpenses.toString(),
      })
    }

    return NextResponse.json({
      ...analysis,
      monthlyBalance,
      totalIncomes,
      totalExpenses,
      cached: false,
    })
  } catch (error) {
    console.error("Error generating expense suggestions:", error)
    return NextResponse.json(
      { error: "Erro ao gerar sugestões de economia" },
      { status: 500 }
    )
  }
}
