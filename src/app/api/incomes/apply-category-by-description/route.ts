import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { incomes } from "@/db/schema/finance"
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

    const userIncomes = await db
      .select({
        id: incomes.id,
        description: incomes.description,
      })
      .from(incomes)
      .where(eq(incomes.userId, user.id))

    const matchingIds = findIdsWithExactDescription(userIncomes, body.description)
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
      .update(incomes)
      .set({
        categoryId: body.categoryId,
        updatedAt: new Date(),
      })
      .where(and(eq(incomes.userId, user.id), inArray(incomes.id, idsToUpdate)))
      .returning({ id: incomes.id })

    return NextResponse.json({
      otherMatchesCount: otherMatchingIds.length,
      updatedCount: updated.length,
    })
  } catch (error) {
    console.error("Error applying income category by description:", error)
    return NextResponse.json({ error: "Erro ao aplicar categoria em entradas similares" }, { status: 500 })
  }
}
