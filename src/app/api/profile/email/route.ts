import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/db"
import { users, verificationTokens } from "@/db/schema/auth"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import crypto from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const changeEmailSchema = z.object({
  newEmail: z.string().email("Email inválido"),
})

const confirmEmailSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
})

// Request email change - sends verification to new email
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

    const body = await request.json()
    const result = changeEmailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { newEmail } = result.data

    // Check if email is already in use
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, newEmail),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token with the new email as identifier
    await db.insert(verificationTokens).values({
      identifier: `email-change:${user.id}:${newEmail}`,
      token,
      expires,
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/profile/email/confirm?token=${token}&email=${encodeURIComponent(newEmail)}&userId=${user.id}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Penochão <noreply@penochao.com>",
      to: newEmail,
      subject: "Confirme seu novo email - Penochão",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">🐷 Penochão</h1>
            </div>
            
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">Confirme seu novo email</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Você solicitou a alteração do seu email para <strong>${newEmail}</strong>. 
              Clique no botão abaixo para confirmar essa alteração.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); 
                        color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; 
                        font-weight: 600; font-size: 16px;">
                Confirmar Email
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
              Este link expira em 24 horas. Se você não solicitou essa alteração, ignore este email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Penochão - Controle Financeiro
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Email de verificação enviado para o novo endereço",
    })
  } catch (error) {
    console.error("Error requesting email change:", error)
    return NextResponse.json(
      { error: "Erro ao solicitar alteração de email" },
      { status: 500 }
    )
  }
}

// Confirm email change
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = confirmEmailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token } = result.data

    // Find the token
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))

      return NextResponse.json(
        { error: "Token expirado. Solicite uma nova alteração." },
        { status: 400 }
      )
    }

    // Parse identifier to get userId and newEmail
    const [prefix, userId, newEmail] = verificationToken.identifier.split(":")

    if (prefix !== "email-change" || !userId || !newEmail) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      )
    }

    // Update user email
    await db
      .update(users)
      .set({
        email: newEmail,
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // Delete used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    return NextResponse.json({
      success: true,
      message: "Email alterado com sucesso",
      newEmail,
    })
  } catch (error) {
    console.error("Error confirming email change:", error)
    return NextResponse.json(
      { error: "Erro ao confirmar alteração de email" },
      { status: 500 }
    )
  }
}
