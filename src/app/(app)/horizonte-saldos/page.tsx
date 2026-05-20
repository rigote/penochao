import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { resolveEffectiveUserPlan } from "@/lib/subscription"
import { HorizonteSaldosClient } from "./horizonte-saldos-client"

export const metadata = {
  title: "Horizonte de Saldos | Penochão",
  description:
    "Visualize a projeção do seu saldo diário acumulado para os próximos meses.",
}

export default async function HorizonteSaldosPage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const foundUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!foundUser) {
    redirect("/login")
  }

  const user = await resolveEffectiveUserPlan(foundUser)

  return (
    <div className="space-y-6">
      <HorizonteSaldosClient userPlan={user.plan as "free" | "pro"} />
    </div>
  )
}
