import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { expenses, categories } from "@/db/schema/finance"
import { createExpenseSchema } from "@/lib/validations/finance"
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const type = searchParams.get("type") // essential | non_essential

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const conditions = [eq(expenses.userId, user.id)]

    // Filter by type if provided
    if (type === "essential" || type === "non_essential") {
      conditions.push(eq(expenses.type, type))
    }

    // Filter by month/year if provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`
      const endDate = `${year}-${month.padStart(2, "0")}-31`
      conditions.push(gte(expenses.occurrenceDate, startDate))
      conditions.push(lte(expenses.occurrenceDate, endDate))
    }

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
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.occurrenceDate))

    return NextResponse.json(allExpenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Erro ao buscar despesas" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Try to get ID from URL first (single delete)
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    // If request has a body, check for bulk IDs
    let loadIds: string[] = []
    try {
      const body = await request.json()
      if (body.ids && Array.isArray(body.ids)) {
        loadIds = body.ids
      }
    } catch (e) {
      // No body or invalid JSON, ignore
    }

    // Single delete via URL param
    if (id && id !== 'expenses') {
      await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      return NextResponse.json({ success: true })
    }

    // Bulk delete via body
    if (loadIds.length > 0) {
      await db.delete(expenses).where(
        and(
          inArray(expenses.id, loadIds),
          eq(expenses.userId, user.id)
        )
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Erro ao deletar despesa" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    const [newExpense] = await db
      .insert(expenses)
      .values({
        userId: user.id,
        categoryId: validatedData.categoryId,
        description: validatedData.description,
        amount: validatedData.amount.toString(),
        occurrenceDate: validatedData.occurrenceDate,
        type: validatedData.type,
        recurrence: validatedData.recurrence,
      })
      .returning()

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 })
  }
}
