import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createPortalSession } from "@/lib/stripe"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"

export async function POST() {
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

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura encontrada" },
        { status: 400 }
      )
    }

    const portalUrl = await createPortalSession(user.stripeCustomerId)

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: "Erro ao criar sessão do portal" },
      { status: 500 }
    )
  }
}
