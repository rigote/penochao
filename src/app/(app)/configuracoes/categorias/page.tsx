import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { categories } from "@/db/schema/finance"
import { eq, or, isNull, asc, and } from "drizzle-orm"
import { CategoriesManager } from "./categories-manager"

export default async function CategoriasPage() {
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

  // Fetch all visible categories (system defaults + user owned)
  // We include archived=false in the fetch usually, but here we want to manage them? 
  // Let's just fetch everything active for now. Archived ones are hidden.
  const allCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        or(
          isNull(categories.userId),
          eq(categories.userId, user.id)
        ),
        // eq(categories.archived, false) // We could show archived with a toggle later
      )
    )
    .orderBy(asc(categories.name))

  // Cast to plain object to avoid serialization warnings if any
  const serializedCategories = allCategories.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString() // if needed
  }))

  return <CategoriesManager initialCategories={serializedCategories as any} userPlan={user.plan as "free" | "pro"} />
}
