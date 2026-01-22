import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { categories } from "@/db/schema/finance"
import { createCategorySchema } from "@/lib/validations/finance"

export async function GET() {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.type, categories.name)

    return NextResponse.json(allCategories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validatedData.name,
        type: validatedData.type,
        icon: validatedData.icon,
        isDefault: false,
      })
      .returning()

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
