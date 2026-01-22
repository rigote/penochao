import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { userSettings } from "@/db/schema/finance"
import { updateUserSettingsSchema } from "@/lib/validations/finance"
import { eq } from "drizzle-orm"

export async function GET() {
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

    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    })

    // Create default settings if not exists
    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          emergencyFundMonths: "6",
          currentSavings: "0",
        })
        .returning()
      settings = newSettings
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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
    const validatedData = updateUserSettingsSchema.parse(body)

    const [updated] = await db
      .update(userSettings)
      .set({
        emergencyFundTarget: validatedData.emergencyFundTarget?.toString(),
        emergencyFundMonths: validatedData.emergencyFundMonths?.toString(),
        currentSavings: validatedData.currentSavings?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, user.id))
      .returning()

    if (!updated) {
      // Create if not exists
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          emergencyFundTarget: validatedData.emergencyFundTarget?.toString(),
          emergencyFundMonths: validatedData.emergencyFundMonths?.toString() || "6",
          currentSavings: validatedData.currentSavings?.toString() || "0",
        })
        .returning()
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 })
  }
}
