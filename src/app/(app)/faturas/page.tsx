import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { invoices } from "@/db/schema/finance"
import { couponRedemptions } from "@/db/schema/coupons"
import { count, eq, and, gte, lt, desc } from "drizzle-orm"
import { FaturasClient } from "./faturas-client"
import { resolveEffectiveUserPlan } from "@/lib/subscription"

export default async function FaturasPage() {
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

  if (user.plan !== "pro") {
    redirect("/assinatura")
  }

  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  })

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // Count invoices uploaded this month
  const [usage] = await db
    .select({ count: count() })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, user.id),
        gte(invoices.createdAt, start),
        lt(invoices.createdAt, end)
      )
    );

  // Check for active courtesy with invoice limit
  let invoiceLimit: number | null = null;
  let courtesyExpiresAt: Date | null = null;

  if (user.plan === "pro") {
    const activeCourtesy = await db.query.couponRedemptions.findFirst({
      where: and(
        eq(couponRedemptions.userId, user.id),
        gte(couponRedemptions.courtesyExpiresAt, new Date())
      ),
      orderBy: [desc(couponRedemptions.redeemedAt)],
    });

    if (activeCourtesy?.invoiceLimit) {
      invoiceLimit = activeCourtesy.invoiceLimit;
      courtesyExpiresAt = activeCourtesy.courtesyExpiresAt;
    }
  }

  return <FaturasClient
    categories={categories}
    userPlan={user.plan as "free" | "pro"}
    monthlyUsage={usage.count}
    invoiceLimit={invoiceLimit}
    courtesyExpiresAt={courtesyExpiresAt?.toISOString() || null}
  />
}
