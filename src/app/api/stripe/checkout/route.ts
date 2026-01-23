import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createCheckoutSession } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID é obrigatório" }, { status: 400 })
    }

    const checkoutUrl = await createCheckoutSession(
      user.id,
      user.email,
      priceId,
      user.name
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout" },
      { status: 500 }
    )
  }
}
