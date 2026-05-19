import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { expenses, categories } from "@/db/schema/finance"
import { eq, and, desc, or, gte, lte, sql, isNull, inArray } from "drizzle-orm"
import { DespesasClient } from "./despesas-client"
import { startOfMonth, endOfMonth, parse, format } from "date-fns"
import { decrypt, decryptNumber } from "@/lib/encryption"
import { resolveEffectiveUserPlan } from "@/lib/subscription"

const ITEMS_PER_PAGE = 10

type ExpenseType = "essential" | "non_essential"

async function getExpenses(userId: string, date: Date, page: number, type?: ExpenseType | "all") {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)
  const offset = (page - 1) * ITEMS_PER_PAGE

  // Base Conditions (Same as before)
  const baseCondition = and(
    eq(expenses.userId, userId),
    or(
      // Monthly: Created/Recurrence started <= end of current month
      and(
        eq(expenses.recurrence, "monthly"),
        lte(expenses.occurrenceDate, format(endDate, "yyyy-MM-dd"))
      ),
      // Once: Within current month
      and(
        eq(expenses.recurrence, "once"),
        and(
          gte(expenses.occurrenceDate, format(startDate, "yyyy-MM-dd")),
          lte(expenses.occurrenceDate, format(endDate, "yyyy-MM-dd"))
        )
      )
    )
  )

  const conditions = [baseCondition]

  if (type && type !== "all") {
    conditions.push(eq(expenses.type, type))
  }

  // Get Total Count for Pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(expenses)
    .where(and(...conditions))

  const totalItems = Number(countResult.count)
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // Get Paginated Data
  const data = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      occurrenceDate: expenses.occurrenceDate,
      type: expenses.type,
      recurrence: expenses.recurrence,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryParentId: categories.parentId,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.occurrenceDate))
    .limit(ITEMS_PER_PAGE)
    .offset(offset)

  // Fetch parent categories for items that need icon/color fallback
  const categoryIdsNeedingParent = data
    .filter(e => e.categoryParentId && !e.categoryIcon)
    .map(e => e.categoryParentId)
    .filter((id): id is string => id !== null)

  const parentCategoriesMap = new Map<string, { icon: string | null; color: string | null }>()
  if (categoryIdsNeedingParent.length > 0) {
    const parentCats = await db
      .select({
        id: categories.id,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(inArray(categories.id, categoryIdsNeedingParent))
    
    parentCats.forEach(cat => {
      parentCategoriesMap.set(cat.id, { icon: cat.icon, color: cat.color })
    })
  }

  return {
    data: data.map(e => {
      // Use parent category icon/color if current category doesn't have one
      let finalIcon = e.categoryIcon
      let finalColor = e.categoryColor
      
      if (!finalIcon && e.categoryParentId) {
        const parent = parentCategoriesMap.get(e.categoryParentId)
        if (parent) {
          finalIcon = parent.icon
          finalColor = parent.color
        }
      }

      return {
        ...e,
        type: e.type as ExpenseType,
        description: decrypt(e.description),
        amount: decryptNumber(e.amount),
        categoryIcon: finalIcon,
        categoryColor: finalColor,
      }
    }),
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE
    }
  }
}

async function getExpenseStats(userId: string, date: Date) {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)

  // We need to fetch ALL relevant expenses for the month to calculate accurate totals, regardless of pagination
  const allMonthlyExpenses = await db
    .select({
      amount: expenses.amount,
      type: expenses.type,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        or(
          and(
            eq(expenses.recurrence, "monthly"),
            lte(expenses.occurrenceDate, format(endDate, "yyyy-MM-dd"))
          ),
          and(
            eq(expenses.recurrence, "once"),
            and(
              gte(expenses.occurrenceDate, format(startDate, "yyyy-MM-dd")),
              lte(expenses.occurrenceDate, format(endDate, "yyyy-MM-dd"))
            )
          )
        )
      )
    )

  const essential = allMonthlyExpenses
    .filter(e => e.type === "essential")
    .reduce((acc, curr) => {
      try {
        return acc + parseFloat(decryptNumber(curr.amount))
      } catch {
        return acc
      }
    }, 0)

  const nonEssential = allMonthlyExpenses
    .filter(e => e.type === "non_essential")
    .reduce((acc, curr) => {
      try {
        return acc + parseFloat(decryptNumber(curr.amount))
      } catch {
        return acc
      }
    }, 0)

  return {
    essential,
    nonEssential,
    total: essential + nonEssential
  }
}

async function getExpenseCategories(userId: string) {
  const baseCondition = and(
    or(isNull(categories.userId), eq(categories.userId, userId)),
    eq(categories.archived, false)
  )

  const [essential, nonEssential] = await Promise.all([
    db.select().from(categories).where(and(baseCondition, eq(categories.type, "essential"))).orderBy(categories.name),
    db.select().from(categories).where(and(baseCondition, eq(categories.type, "non_essential"))).orderBy(categories.name)
  ])

  return { essential, nonEssential }
}

type PageProps = {
  searchParams: Promise<{
    month?: string
    page?: string
    type?: string
  }>
}

export default async function DespesasPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  const params = await searchParams

  if (!session?.user?.email) redirect("/login")

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) redirect("/login")

  const dbUser = await resolveEffectiveUserPlan(user)
  const userPlan = dbUser.plan === "pro" ? "pro" : "free"

  const currentMonth = params.month ? parse(params.month, "yyyy-MM", new Date()) : new Date()
  const page = Number(params.page) || 1
  const type = (params.type as ExpenseType | "all") || "all"

  const [expensesData, stats, categoriesData] = await Promise.all([
    getExpenses(user.id, currentMonth, page, type),
    getExpenseStats(user.id, currentMonth),
    getExpenseCategories(user.id),
  ])

  return (
    <div className="space-y-6">
      <DespesasClient
        initialExpenses={expensesData.data}
        pagination={expensesData.pagination}
        stats={stats}
        categories={[...categoriesData.essential, ...categoriesData.nonEssential]}
        currentMonth={currentMonth}
        currentType={type}
        userPlan={userPlan}
      />
    </div>
  )
}
