import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { incomes, categories } from "@/db/schema/finance"
import { eq, desc, and, or, gte, lte, sql, isNull } from "drizzle-orm"
import { EntradasClient } from "./entradas-client"
import { startOfMonth, endOfMonth, parse, format } from "date-fns"

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
      createdAt: incomes.createdAt,
    })
    .from(incomes)
    .leftJoin(categories, eq(incomes.categoryId, categories.id))
    .where(conditions)
    .orderBy(desc(incomes.occurrenceDate))
    .limit(ITEMS_PER_PAGE)
    .offset(offset)

  return {
    data,
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

  const total = allMonthlyIncomes.reduce((acc, curr) => acc + Number(curr.amount), 0)
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

  const currentMonth = params.month ? parse(params.month, "yyyy-MM", new Date()) : new Date()
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
      />
    </div>
  )
}
