import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { incomes, expenses, categories } from "@/db/schema/finance"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import { decrypt, decryptNumber } from "@/lib/encryption"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!month || !year) {
      return NextResponse.json({ error: "Mês e ano são obrigatórios" }, { status: 400 })
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const startDate = `${year}-${month.padStart(2, "0")}-01`
    const endDate = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), "yyyy-MM-dd")

    // Fetch all incomes with categories
    const allIncomes = await db
      .select({
        id: incomes.id,
        description: incomes.description,
        amount: incomes.amount,
        occurrenceDate: incomes.occurrenceDate,
        recurrence: incomes.recurrence,
        categoryId: incomes.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(incomes)
      .leftJoin(categories, eq(incomes.categoryId, categories.id))
      .where(
        and(
          eq(incomes.userId, user.id),
          gte(incomes.occurrenceDate, startDate),
          lte(incomes.occurrenceDate, endDate)
        )
      )
      .orderBy(desc(incomes.occurrenceDate))

    // Fetch all expenses with categories
    const allExpenses = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        occurrenceDate: expenses.occurrenceDate,
        type: expenses.type,
        recurrence: expenses.recurrence,
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        categoryParentId: categories.parentId,
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
      .orderBy(desc(expenses.occurrenceDate))

    // Decrypt and process incomes
    const decryptedIncomes = allIncomes.map(income => {
      const amount = decryptNumber(income.amount)
      return {
        id: income.id,
        description: decrypt(income.description),
        amount: parseFloat(amount),
        occurrenceDate: income.occurrenceDate,
        recurrence: income.recurrence,
        category: income.categoryName || "Sem categoria",
        categoryIcon: income.categoryIcon,
        categoryColor: income.categoryColor,
      }
    })

    // Decrypt and process expenses
    const decryptedExpenses = allExpenses.map(expense => {
      const amount = decryptNumber(expense.amount)
      return {
        id: expense.id,
        description: decrypt(expense.description),
        amount: parseFloat(amount),
        occurrenceDate: expense.occurrenceDate,
        type: expense.type,
        recurrence: expense.recurrence,
        category: expense.categoryName || "Sem categoria",
        categoryIcon: expense.categoryIcon,
        categoryColor: expense.categoryColor,
      }
    })

    // Calculate totals
    const totalIncomes = decryptedIncomes.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = decryptedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalEssential = decryptedExpenses
      .filter(e => e.type === "essential")
      .reduce((sum, e) => sum + e.amount, 0)
    const totalNonEssential = decryptedExpenses
      .filter(e => e.type === "non_essential")
      .reduce((sum, e) => sum + e.amount, 0)
    const monthlyBalance = totalIncomes - totalExpenses

    // Group by category
    const incomesByCategory = decryptedIncomes.reduce((acc, income) => {
      const cat = income.category
      if (!acc[cat]) {
        acc[cat] = { total: 0, items: [] }
      }
      acc[cat].total += income.amount
      acc[cat].items.push(income)
      return acc
    }, {} as Record<string, { total: number; items: typeof decryptedIncomes }>)

    const expensesByCategory = decryptedExpenses.reduce((acc, expense) => {
      const cat = expense.category
      if (!acc[cat]) {
        acc[cat] = { total: 0, essential: 0, nonEssential: 0, items: [] }
      }
      acc[cat].total += expense.amount
      if (expense.type === "essential") {
        acc[cat].essential += expense.amount
      } else {
        acc[cat].nonEssential += expense.amount
      }
      acc[cat].items.push(expense)
      return acc
    }, {} as Record<string, { total: number; essential: number; nonEssential: number; items: typeof decryptedExpenses }>)

    // Calculate metrics
    const savingsRate = totalIncomes > 0 ? (monthlyBalance / totalIncomes) * 100 : 0
    const essentialPercentage = totalExpenses > 0 ? (totalEssential / totalExpenses) * 100 : 0
    const nonEssentialPercentage = totalExpenses > 0 ? (totalNonEssential / totalExpenses) * 100 : 0

    return NextResponse.json({
      month: parseInt(month),
      year: parseInt(year),
      period: format(new Date(parseInt(year), parseInt(month) - 1), "MMMM 'de' yyyy", { locale: ptBR }),
      summary: {
        totalIncomes,
        totalExpenses,
        totalEssential,
        totalNonEssential,
        monthlyBalance,
        savingsRate: Math.round(savingsRate * 10) / 10,
        essentialPercentage: Math.round(essentialPercentage * 10) / 10,
        nonEssentialPercentage: Math.round(nonEssentialPercentage * 10) / 10,
      },
      incomes: {
        list: decryptedIncomes,
        byCategory: incomesByCategory,
        count: decryptedIncomes.length,
      },
      expenses: {
        list: decryptedExpenses,
        byCategory: expensesByCategory,
        count: decryptedExpenses.length,
        essentialCount: decryptedExpenses.filter(e => e.type === "essential").length,
        nonEssentialCount: decryptedExpenses.filter(e => e.type === "non_essential").length,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
