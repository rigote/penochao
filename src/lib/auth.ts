import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/db'
import {
  verificationTokens,
  users,
  authUsers,
  accounts,
  sessions,
} from '@/db/schema/auth'
import { eq, and, gt } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
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
          .from(authUsers)
          .where(eq(authUsers.email, email))

        if (!existingUser) {
          const [newUser] = await db
            .insert(users)
            .values({
              id: crypto.randomUUID(),
              email: email,
              name: email.split('@')[0],
              emailVerified: new Date(),
            })
            .returning()
          existingUser = newUser
        }

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
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
  events: {
    async linkAccount({ user, account }) {
      console.log('[DEBUG AUTH] Conta vinculada com sucesso:', {
        userId: user.id,
        provider: account.provider,
      })

      // Se vinculou com conta social, marca email como verificado se não estiver
      if (account.provider === 'google' || account.provider === 'github') {
        await db
          .update(users)
          .set({ emailVerified: new Date() })
          .where(eq(users.id, user.id))
      }
    },
    async signIn({ user, account, profile }) {
      console.log('[DEBUG AUTH] Login realizado com sucesso:', {
        userId: user.id,
      })

      // Se logou com conta social verificada, atualiza no banco
      if (
        (account?.provider === 'google' || account?.provider === 'github') &&
        !(user as any).emailVerified
      ) {
        // @ts-ignore - profile types vary by provider
        if (profile?.email_verified === true || profile?.verified === true) {
          // check google/github field
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, user.id))
        }
      }
    },
    async createUser({ user }) {
      console.log('[DEBUG AUTH] Novo usuário criado:', user.email)
    },
  },
}
