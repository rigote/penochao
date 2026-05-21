import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { expenses } from "@/db/schema/finance"
import { findIdsWithExactDescription } from "@/lib/category-propagation"

const bodySchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string(),
  excludeId: z.string().uuid().optional(),
  apply: z.boolean().optional().default(false),
})

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

    const body = bodySchema.parse(await request.json())

    const userExpenses = await db
      .select({
        id: expenses.id,
        description: expenses.description,
      })
      .from(expenses)
      .where(eq(expenses.userId, user.id))

    const matchingIds = findIdsWithExactDescription(userExpenses, body.description)
    const otherMatchingIds = body.excludeId
      ? matchingIds.filter((id) => id !== body.excludeId)
      : matchingIds

    if (!body.apply || otherMatchingIds.length === 0) {
      return NextResponse.json({
        otherMatchesCount: otherMatchingIds.length,
      })
    }

    const idsToUpdate = body.excludeId
      ? Array.from(new Set([...otherMatchingIds, body.excludeId]))
      : otherMatchingIds

    const updated = await db
      .update(expenses)
      .set({
        categoryId: body.categoryId,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.userId, user.id), inArray(expenses.id, idsToUpdate)))
      .returning({ id: expenses.id })

    return NextResponse.json({
      otherMatchesCount: otherMatchingIds.length,
      updatedCount: updated.length,
    })
  } catch (error) {
    console.error("Error applying expense category by description:", error)
    return NextResponse.json({ error: "Erro ao aplicar categoria em despesas similares" }, { status: 500 })
  }
}
