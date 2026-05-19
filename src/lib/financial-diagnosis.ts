import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"
import { and, eq, gte, lte } from "drizzle-orm"
import { db } from "@/db"
import { categories, expenses, incomes } from "@/db/schema/finance"
import { decrypt, decryptNumber } from "@/lib/encryption"

export type FinancialRiskLevel = "stable" | "tight" | "alert" | "critical" | "emergency"

export interface DiagnosisMonth {
  month: string
  income: number
  essential: number
  debt: number
  dayToDay: number
  lifestyle: number
  totalExpenses: number
  survivalBalance: number
  realBalance: number
}

export interface FinancialDiagnosis {
  currentMonth: DiagnosisMonth
  history: DiagnosisMonth[]
  averageIncome: number
  averageEssentialCost: number
  averageDebtCost: number
  averageTotalExpenses: number
  survivalBalance: number
  realBalance: number
  committedIncomePercent: number
  essentialIncomePercent: number
  debtIncomePercent: number
  riskLevel: FinancialRiskLevel
  mainProblem: string
  headline: string
  nextStep: string
  recommendations: string[]
}

export type FinancialDiagnosisSummary = Omit<FinancialDiagnosis, "currentMonth" | "history">

const debtWords = [
  "cartao",
  "cartão",
  "fatura",
  "emprestimo",
  "empréstimo",
  "financiamento",
  "renegociacao",
  "renegociação",
  "parcela",
  "parcelamento",
  "cheque especial",
  "juros",
  "atraso",
]

const dayToDayWords = [
  "mercado",
  "supermercado",
  "farmacia",
  "farmácia",
  "combustivel",
  "combustível",
  "transporte",
  "padaria",
  "ifood",
  "uber",
  "99",
]

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase()
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word))
}

export function classifyExpense(input: {
  description: string
  type: "essential" | "non_essential"
  categoryName: string | null
}) {
  const haystack = `${normalize(input.description)} ${normalize(input.categoryName)}`

  if (includesAny(haystack, debtWords)) {
    return "debt" as const
  }

  if (input.type === "essential") {
    return "essential" as const
  }

  if (includesAny(haystack, dayToDayWords)) {
    return "dayToDay" as const
  }

  return "lifestyle" as const
}

export function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function getRiskLevel(input: {
  averageIncome: number
  survivalBalance: number
  realBalance: number
  debtIncomePercent: number
  committedIncomePercent: number
}): FinancialRiskLevel {
  if (input.averageIncome <= 0) return "emergency"
  if (input.survivalBalance < 0) return "emergency"
  if (input.realBalance < 0 && input.debtIncomePercent >= 35) return "critical"
  if (input.realBalance < 0) return "alert"
  if (input.committedIncomePercent >= 90) return "tight"
  return "stable"
}

export function buildNarrative(input: {
  riskLevel: FinancialRiskLevel
  averageIncome: number
  survivalBalance: number
  realBalance: number
  debtIncomePercent: number
  essentialIncomePercent: number
}) {
  if (input.averageIncome <= 0) {
    return {
      mainProblem: "Ainda falta registrar renda suficiente para um diagnóstico confiável.",
      headline: "Primeiro precisamos descobrir sua renda real.",
      nextStep: "Registre suas entradas dos últimos meses para o Penochão calcular sua média real.",
    }
  }

  if (input.survivalBalance < 0) {
    return {
      mainProblem: "Seu custo essencial está maior que sua renda média.",
      headline: "Mesmo tirando dívidas antigas da mesa, o mês não fecha.",
      nextStep: "A prioridade é reduzir custo fixo essencial ou aumentar renda antes de renegociar novas parcelas.",
    }
  }

  if (input.realBalance < 0 && input.debtIncomePercent >= 35) {
    return {
      mainProblem: "Dívidas, cartão ou parcelas estão consumindo uma parte alta da renda.",
      headline: "Sua vida básica respira, mas as dívidas estão puxando tudo para baixo.",
      nextStep: "Isole as dívidas, proteja uma reserva mínima e negocie à vista quando houver dinheiro real.",
    }
  }

  if (input.realBalance < 0) {
    return {
      mainProblem: "O conjunto de gastos do mês está maior que sua renda.",
      headline: "O mês fecha negativo depois de colocar tudo na mesa.",
      nextStep: "Corte vazamentos de curto prazo e defina uma meta de folga antes de assumir novas parcelas.",
    }
  }

  if (input.essentialIncomePercent >= 75) {
    return {
      mainProblem: "Seu custo fixo essencial ocupa quase toda a renda.",
      headline: "Você está positivo, mas com pouca margem para imprevistos.",
      nextStep: "Use a sobra para criar uma reserva mínima antes de acelerar pagamentos antigos.",
    }
  }

  return {
    mainProblem: "Seu mês está fechando positivo.",
    headline: "Existe folga para organizar reserva e atacar dívidas com método.",
    nextStep: "Direcione parte da sobra para reserva e parte para negociações com maior desconto.",
  }
}

export function summarizeFinancialDiagnosis(history: DiagnosisMonth[]): FinancialDiagnosisSummary {
  const monthsWithIncome = history.filter((month) => month.income > 0)
  const incomeBase = monthsWithIncome.length > 0 ? monthsWithIncome : history

  const averageIncome = average(incomeBase.map((month) => month.income))
  const averageEssentialCost = average(history.map((month) => month.essential))
  const averageDebtCost = average(history.map((month) => month.debt))
  const averageTotalExpenses = average(history.map((month) => month.totalExpenses))
  const survivalBalance = averageIncome - averageEssentialCost
  const realBalance = averageIncome - averageTotalExpenses
  const committedIncomePercent = averageIncome > 0 ? (averageTotalExpenses / averageIncome) * 100 : 0
  const essentialIncomePercent = averageIncome > 0 ? (averageEssentialCost / averageIncome) * 100 : 0
  const debtIncomePercent = averageIncome > 0 ? (averageDebtCost / averageIncome) * 100 : 0
  const riskLevel = getRiskLevel({
    averageIncome,
    survivalBalance,
    realBalance,
    debtIncomePercent,
    committedIncomePercent,
  })
  const narrative = buildNarrative({
    riskLevel,
    averageIncome,
    survivalBalance,
    realBalance,
    debtIncomePercent,
    essentialIncomePercent,
  })

  const recommendations = [
    "Separe dívidas, cartão e renegociações do custo essencial para enxergar se a vida básica fecha.",
    survivalBalance > 0
      ? "Proteja uma primeira reserva mínima antes de usar toda a sobra para pagar dívidas antigas."
      : "Priorize aumentar renda ou reduzir custo fixo antes de aceitar novas parcelas.",
    debtIncomePercent > 25
      ? "Negocie dívidas com dinheiro à vista e desconto, evitando trocar uma parcela cara por outra impagável."
      : "Use sua folga para criar consistência: mês positivo, reserva e só depois aceleração de quitação.",
  ]

  return {
    averageIncome,
    averageEssentialCost,
    averageDebtCost,
    averageTotalExpenses,
    survivalBalance,
    realBalance,
    committedIncomePercent,
    essentialIncomePercent,
    debtIncomePercent,
    riskLevel,
    ...narrative,
    recommendations,
  }
}

export async function buildFinancialDiagnosis(userId: string, referenceDate = new Date()): Promise<FinancialDiagnosis> {
  const months = Array.from({ length: 4 }, (_, index) => subMonths(referenceDate, 3 - index))

  const history = await Promise.all(
    months.map(async (date): Promise<DiagnosisMonth> => {
      const startDate = format(startOfMonth(date), "yyyy-MM-dd")
      const endDate = format(endOfMonth(date), "yyyy-MM-dd")

      const incomeRows = await db
        .select({ amount: incomes.amount })
        .from(incomes)
        .where(
          and(
            eq(incomes.userId, userId),
            gte(incomes.occurrenceDate, startDate),
            lte(incomes.occurrenceDate, endDate)
          )
        )

      const expenseRows = await db
        .select({
          description: expenses.description,
          amount: expenses.amount,
          type: expenses.type,
          categoryName: categories.name,
        })
        .from(expenses)
        .leftJoin(categories, eq(expenses.categoryId, categories.id))
        .where(
          and(
            eq(expenses.userId, userId),
            gte(expenses.occurrenceDate, startDate),
            lte(expenses.occurrenceDate, endDate)
          )
        )

      const income = incomeRows.reduce((sum, row) => {
        try {
          return sum + parseFloat(decryptNumber(row.amount))
        } catch {
          return sum
        }
      }, 0)

      const totals = expenseRows.reduce(
        (acc, row) => {
          try {
            const description = decrypt(row.description)
            const amount = parseFloat(decryptNumber(row.amount))
            const bucket = classifyExpense({
              description,
              type: row.type === "essential" ? "essential" : "non_essential",
              categoryName: row.categoryName,
            })

            acc[bucket] += amount
            acc.totalExpenses += amount
          } catch {
            return acc
          }

          return acc
        },
        {
          essential: 0,
          debt: 0,
          dayToDay: 0,
          lifestyle: 0,
          totalExpenses: 0,
        }
      )

      return {
        month: format(date, "yyyy-MM"),
        income,
        essential: totals.essential,
        debt: totals.debt,
        dayToDay: totals.dayToDay,
        lifestyle: totals.lifestyle,
        totalExpenses: totals.totalExpenses,
        survivalBalance: income - totals.essential,
        realBalance: income - totals.totalExpenses,
      }
    })
  )

  const currentMonth = history[history.length - 1]
  const summary = summarizeFinancialDiagnosis(history)

  return {
    currentMonth,
    history,
    ...summary,
  }
}
