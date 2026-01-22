import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { db } from "@/db"
import { html, text } from "./auth-email-templates"

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt"
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "onboarding@resend.dev",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url)
        // If RESEND_API_KEY is present, use Resend SDK
        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import("resend")
          const resend = new Resend(process.env.RESEND_API_KEY)

          try {
            await resend.emails.send({
              from: provider.from,
              to: identifier,
              subject: `Login para ${host}`,
              text: text({ url, host }),
              html: html({ url, host }),
            })
          } catch (error) {
            console.error("Resend error:", error)
            throw new Error("Failed to send verification email")
          }
        } else {
          // Fallback to default behavior (SMTP) if no Resend API Key
          // Note: NextAuth doesn't export the default sendVerificationRequest easily, 
          // usually we'd rely on 'server' config. But here we primarily want Resend.
          throw new Error("Missing RESEND_API_KEY")
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string | null
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = user

      if (!dbUser) {
        if (token.email) {
          return token
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
} 