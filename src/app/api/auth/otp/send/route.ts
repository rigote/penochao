
import { NextResponse } from "next/server"
import { db } from "@/db"
import { verificationTokens } from "@/db/schema/auth"
import { Resend } from "resend"
import { html, text } from "@/lib/auth-email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate 6 digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store in DB
    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    })

    const host = new URL(request.url).host

    // Send Email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: `Seu código de login para ${host}`,
      text: text({ url: token, host }), // Passing token as 'url' for now, template will be updated
      html: html({ url: token, host }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 })
  }
}
