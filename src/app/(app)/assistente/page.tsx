import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { resolveEffectiveUserPlan } from "@/lib/subscription"
import { AssistenteClient } from "./assistente-client"

export const metadata = {
  title: "Assistente Financeiro IA | Penochão",
  description: "Converse com nossa inteligência artificial para otimizar suas finanças pessoais.",
}

export default async function AssistentePage() {
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

  // Double check Pro plan access
  if (user.plan !== "pro") {
    redirect("/assinatura")
  }

  return (
    <AssistenteClient
      userName={foundUser.name || session.user.name || foundUser.email}
      userImage={foundUser.image || session.user.image || null}
      userEmail={foundUser.email || session.user.email || null}
    />
  )
}
