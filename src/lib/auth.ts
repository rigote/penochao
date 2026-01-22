import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/db"
import { verificationTokens, users } from "@/db/schema/auth"
import { eq, and, gt } from "drizzle-orm"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null

        const { email, code } = credentials

        // Verify token
        const [tokenRecord] = await db
          .select()
          .from(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, email),
              eq(verificationTokens.token, code),
              gt(verificationTokens.expires, new Date())
            )
          )

        if (!tokenRecord) return null

        // Delete used token
        await db
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, email),
              eq(verificationTokens.token, code)
            )
          )

        // Find or create user
        let [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))

        if (!existingUser) {
          const [newUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            email: email,
            name: email.split("@")[0],
            emailVerified: new Date(),
          }).returning()
          existingUser = newUser
        }

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
        }
      }
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