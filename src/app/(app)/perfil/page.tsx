import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { eq } from "drizzle-orm"
import { ProfileClient } from "./profile-client"

export default async function ProfilePage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      }}
    />
  )
}
