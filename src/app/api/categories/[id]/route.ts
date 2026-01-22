import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { categories, incomes, expenses } from "@/db/schema/finance"
import { updateCategorySchema } from "@/lib/validations/finance"
import { eq, and } from "drizzle-orm"

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
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

    const id = params.id
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Ensure user owns this category
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      )
    }

    const [updatedCategory] = await db
      .update(categories)
      .set(validatedData)
      .where(eq(categories.id, id))
      .returning()

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
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

    const id = params.id

    // Ensure user owns this category
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      )
    }

    // Check usage
    // Using aggregated counts would be more efficient but let's do simple checks first
    const [hasIncomes] = await db.select().from(incomes).where(eq(incomes.categoryId, id)).limit(1)
    const [hasExpenses] = await db.select().from(expenses).where(eq(expenses.categoryId, id)).limit(1)
    const [hasSubcategories] = await db.select().from(categories).where(eq(categories.parentId, id)).limit(1)

    if (hasIncomes || hasExpenses || hasSubcategories) {
      // Soft delete (archive)
      await db
        .update(categories)
        .set({ archived: true })
        .where(eq(categories.id, id))

      return NextResponse.json({ success: true, method: "archived" })
    } else {
      // Hard delete
      await db.delete(categories).where(eq(categories.id, id))
      return NextResponse.json({ success: true, method: "deleted" })
    }

  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
