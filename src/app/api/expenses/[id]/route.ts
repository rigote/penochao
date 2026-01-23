import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { expenses } from "@/db/schema/finance"
import { updateExpenseSchema } from "@/lib/validations/finance"
import { eq, and } from "drizzle-orm"
import { encrypt, decrypt, decryptNumber } from "@/lib/encryption"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params
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

    const expense = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.userId, user.id)),
      with: { category: true },
    })

    if (!expense) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    // Decrypt sensitive fields
    const decryptedExpense = {
      ...expense,
      description: decrypt(expense.description),
      amount: decryptNumber(expense.amount),
    }

    return NextResponse.json(decryptedExpense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json({ error: "Erro ao buscar despesa" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
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
    const validatedData = updateExpenseSchema.parse(body)

    // Prepare update data with encryption
    const updateData: Partial<typeof expenses.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (validatedData.description !== undefined) {
      updateData.description = encrypt(validatedData.description)
    }
    if (validatedData.amount !== undefined) {
      updateData.amount = encryptNumber(validatedData.amount.toString())
    }
    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId
    }
    if (validatedData.occurrenceDate !== undefined) {
      updateData.occurrenceDate = validatedData.occurrenceDate
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type
    }
    if (validatedData.recurrence !== undefined) {
      updateData.recurrence = validatedData.recurrence
    }

    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    // Decrypt before returning
    const decryptedExpense = {
      ...updated,
      description: decrypt(updated.description),
      amount: decryptNumber(updated.amount),
    }

    return NextResponse.json(decryptedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Erro ao atualizar despesa" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params
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

    const [deleted] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Erro ao deletar despesa" }, { status: 500 })
  }
}
