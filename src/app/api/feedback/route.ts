import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Resend } from "resend"
import { z } from "zod"

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

    const typeLabels = {
      suggestion: "Sugestão",
      bug: "Bug / Erro",
      other: "Outro"
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Penochão <noreply@penochao.com>",
      to: "matheus.rigote@gmail.com",
      replyTo: userEmail,
      subject: `Feedback [${typeLabels[type as keyof typeof typeLabels]}] - ${userName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #7c3aed;">Novo Feedback Recebido 📝</h2>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Usuário:</strong> ${userName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${typeLabels[type as keyof typeof typeLabels]}</p>
          </div>

          <h3 style="margin-bottom: 10px;">Mensagem:</h3>
          <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
            Enviado via Penochão App
          </p>
        </div>
      `
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
