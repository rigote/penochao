import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Resend } from "resend"
import { z } from "zod"
import { feedbackEmail } from "@/lib/email-templates"
import { db } from "@/db"

const resend = new Resend(process.env.RESEND_API_KEY)

const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "other"]),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const result = feedbackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, message } = result.data
    const userEmail = session.user.email
    const userName = session.user.name || "Usuário"

    // Get user plan from database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, userEmail),
    })
    const userPlan = (user?.plan as "free" | "pro") || "free"

    const typeLabels = {
      suggestion: "Sugestão",
      bug: "Bug / Erro",
      other: "Outro"
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@penochao.app.br"
    const typeLabel = typeLabels[type as keyof typeof typeLabels]
    const { html, text } = feedbackEmail({ 
      userName, 
      userEmail, 
      userPlan,
      type, 
      typeLabel, 
      message 
    })
    
    await resend.emails.send({
      from: `Penochão <${fromEmail}>`,
      to: "matheus.rigote@gmail.com",
      replyTo: userEmail,
      subject: `[Feedback] ${typeLabel} - ${userName}`,
      html,
      text,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json(
      { error: "Erro ao enviar feedback" },
      { status: 500 }
    )
  }
}
