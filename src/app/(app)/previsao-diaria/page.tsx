import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { resolveEffectiveUserPlan } from "@/lib/subscription"
import { PrevisaoDiariaClient } from "./previsao-diaria-client"

export const metadata = {
  title: "Previsão Diária | Penochão",
  description:
    "Calcule sua previsão de gastos diários com base nos seus gastos mensais estimados.",
}

export default async function PrevisaoDiariaPage() {
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
      <PrevisaoDiariaClient userPlan={user.plan as "free" | "pro"} />
    </div>
  )
}
