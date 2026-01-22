import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { categories } from "@/db/schema/finance"
import { createCategorySchema } from "@/lib/validations/finance"
import { eq, or, and, isNull, asc } from "drizzle-orm"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    // Build conditions
    const conditions = []

    // User condition: System defaults (userId is null) OR User owned
    conditions.push(
      or(
        isNull(categories.userId),
        eq(categories.userId, user.id)
      )
    )

    // Type condition if provided
    if (type) {
      // @ts-ignore
      conditions.push(eq(categories.type, type))
    }

    // Don't show archived by default unless requested? For now let's just fetch active.
    // Actually, settings page needs archived too, but transaction forms dont.
    // Let's filter archived in frontend or via param later if needed.

    const allCategories = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.name))

    return NextResponse.json(allCategories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId: user.id,
        parentId: validatedData.parentId || null,
        name: validatedData.name,
        type: validatedData.type,
        icon: validatedData.icon,
        color: validatedData.color,
      })
      .returning()

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
