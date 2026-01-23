import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { put, del } from "@vercel/blob"
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

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF." },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo permitido: 5MB" },
        { status: 400 }
      )
    }

    // Delete old avatar if exists
    if (user.image && user.image.includes("blob.vercel-storage.com")) {
      try {
        await del(user.image)
      } catch {
        // Ignore deletion errors
      }
    }

    // Upload new avatar
    const blob = await put(`avatars/${user.id}-${Date.now()}.${file.type.split("/")[1]}`, file, {
      access: "public",
    })

    // Update user record
    await db
      .update(users)
      .set({
        image: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload da imagem" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
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

    // Delete avatar from blob storage if it exists
    if (user.image && user.image.includes("blob.vercel-storage.com")) {
      try {
        await del(user.image)
      } catch {
        // Ignore deletion errors
      }
    }

    // Remove avatar from user record
    await db
      .update(users)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting avatar:", error)
    return NextResponse.json(
      { error: "Erro ao remover a imagem" },
      { status: 500 }
    )
  }
}
