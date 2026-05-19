import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { incomes, categories } from "@/db/schema/finance"
import { createIncomeSchema } from "@/lib/validations/finance"
import { eq, and, gte, lte, desc, SQL, inArray } from "drizzle-orm"
import { encrypt, decrypt, encryptNumber, decryptNumber } from "@/lib/encryption"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    // Get user ID from session
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Build conditions array
    const conditions: SQL[] = [eq(incomes.userId, user.id)]

    // Filter by month/year if provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`
      const endDate = `${year}-${month.padStart(2, "0")}-31`
      conditions.push(gte(incomes.occurrenceDate, startDate))
      conditions.push(lte(incomes.occurrenceDate, endDate))
    }

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
        createdAt: incomes.createdAt,
      })
      .from(incomes)
      .leftJoin(categories, eq(incomes.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(incomes.occurrenceDate))

    // Decrypt sensitive fields
    const decryptedIncomes = allIncomes.map((income) => ({
      ...income,
      description: decrypt(income.description),
      amount: decryptNumber(income.amount),
    }))

    return NextResponse.json(decryptedIncomes)
  } catch (error) {
    console.error("Error fetching incomes:", error)
    return NextResponse.json({ error: "Erro ao buscar entradas" }, { status: 500 })
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
    } catch (_e) {
      // No body or invalid JSON, ignore
    }

    // Single delete via URL param
    if (id && id !== 'incomes') {
      await db.delete(incomes).where(and(eq(incomes.id, id), eq(incomes.userId, user.id)))
      return NextResponse.json({ success: true })
    }

    // Bulk delete via body
    if (loadIds.length > 0) {
      await db.delete(incomes).where(
        and(
          inArray(incomes.id, loadIds),
          eq(incomes.userId, user.id)
        )
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  } catch (error) {
    console.error("Error deleting income:", error)
    return NextResponse.json({ error: "Erro ao deletar entrada" }, { status: 500 })
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
    const validatedData = createIncomeSchema.parse(body)

    const repetitions = validatedData.repetitions ?? 1

    // If repetitions > 1, create individual entries for each month
    if (repetitions > 1) {
      const baseDate = new Date(validatedData.occurrenceDate + "T00:00:00")
      const values = Array.from({ length: repetitions }, (_, i) => {
        const date = new Date(baseDate)
        date.setMonth(date.getMonth() + i)
        const dateStr = date.toISOString().split("T")[0]
        return {
          userId: user.id,
          categoryId: validatedData.categoryId,
          description: encrypt(validatedData.description),
          amount: encryptNumber(validatedData.amount.toString()),
          occurrenceDate: dateStr,
          recurrence: "once" as const,
        }
      })

      const created = await db.insert(incomes).values(values).returning()

      return NextResponse.json(
        created.map((e) => ({
          ...e,
          description: decrypt(e.description),
          amount: decryptNumber(e.amount),
        })),
        { status: 201 }
      )
    }

    // Single entry (default behavior)
    const [newIncome] = await db
      .insert(incomes)
      .values({
        userId: user.id,
        categoryId: validatedData.categoryId,
        description: encrypt(validatedData.description),
        amount: encryptNumber(validatedData.amount.toString()),
        occurrenceDate: validatedData.occurrenceDate,
        recurrence: validatedData.recurrence,
      })
      .returning()

    const decryptedIncome = {
      ...newIncome,
      description: decrypt(newIncome.description),
      amount: decryptNumber(newIncome.amount),
    }

    return NextResponse.json(decryptedIncome, { status: 201 })
  } catch (error) {
    console.error("Error creating income:", error)
    return NextResponse.json({ error: "Erro ao criar entrada" }, { status: 500 })
  }
}
