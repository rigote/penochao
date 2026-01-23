import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users, verificationTokens } from "@/db/schema/auth"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const newEmail = searchParams.get("email")
    const userId = searchParams.get("userId")

    if (!token || !newEmail || !userId) {
      return NextResponse.redirect(
        new URL("/perfil?error=invalid_token", request.url)
      )
    }

    // Find the token
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    })

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/perfil?error=token_not_found", request.url)
      )
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))

      return NextResponse.redirect(
        new URL("/perfil?error=token_expired", request.url)
      )
    }

    // Verify the identifier matches
    const expectedIdentifier = `email-change:${userId}:${newEmail}`
    if (verificationToken.identifier !== expectedIdentifier) {
      return NextResponse.redirect(
        new URL("/perfil?error=invalid_token", request.url)
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

    // Redirect to profile with success message
    return NextResponse.redirect(
      new URL("/perfil?success=email_changed", request.url)
    )
  } catch (error) {
    console.error("Error confirming email:", error)
    return NextResponse.redirect(
      new URL("/perfil?error=server_error", request.url)
    )
  }
}
