import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { userSettings } from "@/db/schema/finance"
import { eq } from "drizzle-orm"
import { ConfiguracoesClient } from "./configuracoes-client"

async function getUserSettings(userId: string) {
  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })

  // Create default settings if not exists
  if (!settings) {
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        emergencyFundMonths: "6",
        currentSavings: "0",
      })
      .returning()
    settings = newSettings
  }

  return {
    emergencyFundMonths: settings.emergencyFundMonths || "6",
    emergencyFundTarget: settings.emergencyFundTarget,
    currentSavings: settings.currentSavings || "0",
  }
}

export default async function ConfiguracoesPage() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) {
    redirect("/login")
  }

  const settings = await getUserSettings(user.id)

  const subscriptionInfo = {
    plan: user.plan as "free" | "pro",
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    hasUsedProTrial: Boolean(user.proTrialUsedAt),
  }

  return (
    <ConfiguracoesClient 
      initialSettings={settings} 
      userPlan={user.plan as "free" | "pro"}
      subscriptionInfo={subscriptionInfo}
    />
  )
}
