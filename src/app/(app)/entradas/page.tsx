import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { incomes, categories } from "@/db/schema/finance"
import { eq, desc, and, or, gte, lte, sql, isNull, inArray } from "drizzle-orm"
import { EntradasClient } from "./entradas-client"
import { startOfMonth, endOfMonth, parse, format } from "date-fns"
import { decrypt, decryptNumber } from "@/lib/encryption"
import { resolveEffectiveUserPlan } from "@/lib/subscription"
import { getDisplayOccurrenceDate } from "@/lib/recurrence"

const ITEMS_PER_PAGE = 10

async function getIncomes(userId: string, date: Date, page: number) {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)
  const offset = (page - 1) * ITEMS_PER_PAGE

  const conditions = and(
    eq(incomes.userId, userId),
    or(
      // Monthly recurrence
      and(
        eq(incomes.recurrence, "monthly"),
        lte(incomes.occurrenceDate, format(endDate, "yyyy-MM-dd"))
      ),
      // Once recurrence
      and(
        eq(incomes.recurrence, "once"),
        and(
          gte(incomes.occurrenceDate, format(startDate, "yyyy-MM-dd")),
          lte(incomes.occurrenceDate, format(endDate, "yyyy-MM-dd"))
        )
      )
    )
  )

  // Get Total Count for Pagination
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(incomes)
    .where(conditions)

  const totalItems = Number(countResult.count)
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  // Get Paginated Data
  const data = await db
    .select({
      id: incomes.id,
      description: incomes.description,
      amount: incomes.amount,
      occurrenceDate: incomes.occurrenceDate,
      recurrence: incomes.recurrence,
      categoryId: incomes.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryParentId: categories.parentId,
      createdAt: incomes.createdAt,
    })
    .from(incomes)
    .leftJoin(categories, eq(incomes.categoryId, categories.id))
    .where(conditions)
    .orderBy(desc(incomes.occurrenceDate))
    .limit(ITEMS_PER_PAGE)
    .offset(offset)

  // Fetch parent categories for items that need icon/color fallback
  const categoryIdsNeedingParent = data
    .filter(i => i.categoryParentId && !i.categoryIcon)
    .map(i => i.categoryParentId)
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
    data: data.map(i => {
      // Use parent category icon/color if current category doesn't have one
      let finalIcon = i.categoryIcon
      let finalColor = i.categoryColor
      
      if (!finalIcon && i.categoryParentId) {
        const parent = parentCategoriesMap.get(i.categoryParentId)
        if (parent) {
          finalIcon = parent.icon
          finalColor = parent.color
        }
      }

      return {
        ...i,
        baseOccurrenceDate: i.occurrenceDate,
        occurrenceDate: getDisplayOccurrenceDate({
          occurrenceDate: i.occurrenceDate,
          recurrence: i.recurrence,
          targetMonth: date,
        }),
        description: decrypt(i.description),
        amount: decryptNumber(i.amount),
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

async function getIncomeStats(userId: string, date: Date) {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)

  const allMonthlyIncomes = await db
    .select({ amount: incomes.amount })
    .from(incomes)
    .where(
      and(
        eq(incomes.userId, userId),
        or(
          and(
            eq(incomes.recurrence, "monthly"),
            lte(incomes.occurrenceDate, format(endDate, "yyyy-MM-dd"))
          ),
          and(
            eq(incomes.recurrence, "once"),
            and(
              gte(incomes.occurrenceDate, format(startDate, "yyyy-MM-dd")),
              lte(incomes.occurrenceDate, format(endDate, "yyyy-MM-dd"))
            )
          )
        )
      )
    )

  const total = allMonthlyIncomes.reduce((acc, curr) => {
    try {
      return acc + parseFloat(decryptNumber(curr.amount))
    } catch {
      return acc
    }
  }, 0)
  return { total }
}

async function getIncomeCategories(userId: string) {
  const allCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, "income"),
        or(isNull(categories.userId), eq(categories.userId, userId)),
        eq(categories.archived, false)
      )
    )
    .orderBy(categories.name)

  return allCategories
}

type PageProps = {
  searchParams: Promise<{
    month?: string
    page?: string
  }>
}

export default async function EntradasPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  const params = await searchParams

  if (!session?.user?.email) redirect("/login")

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user!.email!),
  })

  if (!user) redirect("/login")

  const dbUser = await resolveEffectiveUserPlan(user)
  const userPlan = dbUser.plan === "pro" ? "pro" : "free"

  // Use day 15 to prevent timezone boundary issues (UTC→BRT shift)
  const rawMonth = params.month ? parse(params.month, "yyyy-MM", new Date()) : new Date()
  const currentMonth = new Date(rawMonth.getFullYear(), rawMonth.getMonth(), 15)
  const page = Number(params.page) || 1

  const [incomesData, stats, categoriesData] = await Promise.all([
    getIncomes(user.id, currentMonth, page),
    getIncomeStats(user.id, currentMonth),
    getIncomeCategories(user.id),
  ])

  return (
    <div className="space-y-6">
      <EntradasClient
        initialIncomes={incomesData.data}
        pagination={incomesData.pagination}
        stats={stats}
        categories={categoriesData}
        currentMonth={currentMonth}
        userPlan={userPlan}
      />
    </div>
  )
}
