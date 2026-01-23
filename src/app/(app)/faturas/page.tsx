import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { invoices } from "@/db/schema/finance"
import { count, eq, and, gte, lt } from "drizzle-orm"
import { FaturasClient } from "./faturas-client"

export default async function FaturasPage() {
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

  return <FaturasClient
    categories={categories}
    userPlan={user.plan as "free" | "pro"}
    monthlyUsage={usage.count}
  />
}
