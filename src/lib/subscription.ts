import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { couponRedemptions } from "@/db/schema/coupons"
import { and, desc, eq, gte } from "drizzle-orm"

type AppUser = typeof users.$inferSelect

export async function resolveEffectiveUserPlan(user: AppUser): Promise<AppUser> {
  if (user.plan !== "pro" || user.stripeSubscriptionId) {
    return user
  }

  const redemptions = await db.query.couponRedemptions.findMany({
    where: eq(couponRedemptions.userId, user.id),
    orderBy: [desc(couponRedemptions.redeemedAt)],
    limit: 1,
  })

  if (redemptions.length === 0) {
    return user
  }

  const activeCourtesy = await db.query.couponRedemptions.findFirst({
    where: and(
      eq(couponRedemptions.userId, user.id),
      gte(couponRedemptions.courtesyExpiresAt, new Date())
    ),
    orderBy: [desc(couponRedemptions.redeemedAt)],
  })

  if (activeCourtesy) {
    return user
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      plan: "free",
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning()

  return updatedUser || { ...user, plan: "free" }
}
