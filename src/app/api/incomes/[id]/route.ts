import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { incomes } from "@/db/schema/finance"
import { updateIncomeSchema } from "@/lib/validations/finance"
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

    const income = await db.query.incomes.findFirst({
      where: and(eq(incomes.id, id), eq(incomes.userId, user.id)),
      with: { category: true },
    })

    if (!income) {
      return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 })
    }

    // Decrypt sensitive fields
    const decryptedIncome = {
      ...income,
      description: decrypt(income.description),
      amount: decryptNumber(income.amount),
    }

    return NextResponse.json(decryptedIncome)
  } catch (error) {
    console.error("Error fetching income:", error)
    return NextResponse.json({ error: "Erro ao buscar entrada" }, { status: 500 })
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
    const validatedData = updateIncomeSchema.parse(body)

    // Prepare update data with encryption
    const updateData: Partial<typeof incomes.$inferInsert> = {
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
    if (validatedData.recurrence !== undefined) {
      updateData.recurrence = validatedData.recurrence
    }

    const [updated] = await db
      .update(incomes)
      .set(updateData)
      .where(and(eq(incomes.id, id), eq(incomes.userId, user.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 })
    }

    // Decrypt before returning
    const decryptedIncome = {
      ...updated,
      description: decrypt(updated.description),
      amount: decryptNumber(updated.amount),
    }

    return NextResponse.json(decryptedIncome)
  } catch (error) {
    console.error("Error updating income:", error)
    return NextResponse.json({ error: "Erro ao atualizar entrada" }, { status: 500 })
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
      .delete(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.userId, user.id)))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting income:", error)
    return NextResponse.json({ error: "Erro ao deletar entrada" }, { status: 500 })
  }
}
