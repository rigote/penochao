jest.mock("@/db", () => ({
  db: {},
}))

import {
  classifyExpense,
  getRiskLevel,
  summarizeFinancialDiagnosis,
  type DiagnosisMonth,
} from "./financial-diagnosis"

function month(overrides: Partial<DiagnosisMonth>): DiagnosisMonth {
  const income = overrides.income ?? 0
  const essential = overrides.essential ?? 0
  const debt = overrides.debt ?? 0
  const dayToDay = overrides.dayToDay ?? 0
  const lifestyle = overrides.lifestyle ?? 0
  const totalExpenses = overrides.totalExpenses ?? essential + debt + dayToDay + lifestyle

  return {
    month: overrides.month ?? "2026-01",
    income,
    essential,
    debt,
    dayToDay,
    lifestyle,
    totalExpenses,
    survivalBalance: income - essential,
    realBalance: income - totalExpenses,
  }
}

describe("financial diagnosis rules", () => {
  describe("classifyExpense", () => {
    it("classifies card bills and loans as debt even when category looks essential", () => {
      expect(
        classifyExpense({
          description: "Fatura cartão Nubank",
          type: "essential",
          categoryName: "Moradia",
        })
      ).toBe("debt")

      expect(
        classifyExpense({
          description: "Parcela empréstimo consignado",
          type: "non_essential",
          categoryName: null,
        })
      ).toBe("debt")
    })

    it("preserves essential expenses when they are not debt-like", () => {
      expect(
        classifyExpense({
          description: "Aluguel",
          type: "essential",
          categoryName: "Moradia",
        })
      ).toBe("essential")
    })

    it("detects day-to-day expenses from common descriptions or categories", () => {
      expect(
        classifyExpense({
          description: "Compra semanal",
          type: "non_essential",
          categoryName: "Supermercado",
        })
      ).toBe("dayToDay")

      expect(
        classifyExpense({
          description: "Uber para consulta",
          type: "non_essential",
          categoryName: "Transporte",
        })
      ).toBe("dayToDay")
    })

    it("falls back to lifestyle for non-essential expenses without stronger signals", () => {
      expect(
        classifyExpense({
          description: "Cinema",
          type: "non_essential",
          categoryName: "Lazer",
        })
      ).toBe("lifestyle")
    })
  })

  describe("getRiskLevel", () => {
    it("marks missing income or negative survival balance as emergency", () => {
      expect(
        getRiskLevel({
          averageIncome: 0,
          survivalBalance: 0,
          realBalance: 0,
          debtIncomePercent: 0,
          committedIncomePercent: 0,
        })
      ).toBe("emergency")

      expect(
        getRiskLevel({
          averageIncome: 2000,
          survivalBalance: -100,
          realBalance: -800,
          debtIncomePercent: 10,
          committedIncomePercent: 140,
        })
      ).toBe("emergency")
    })

    it("separates critical debt pressure from generic negative balance", () => {
      expect(
        getRiskLevel({
          averageIncome: 4000,
          survivalBalance: 1000,
          realBalance: -500,
          debtIncomePercent: 40,
          committedIncomePercent: 112.5,
        })
      ).toBe("critical")

      expect(
        getRiskLevel({
          averageIncome: 4000,
          survivalBalance: 1000,
          realBalance: -500,
          debtIncomePercent: 10,
          committedIncomePercent: 112.5,
        })
      ).toBe("alert")
    })

    it("marks positive but highly committed months as tight", () => {
      expect(
        getRiskLevel({
          averageIncome: 4000,
          survivalBalance: 1200,
          realBalance: 100,
          debtIncomePercent: 10,
          committedIncomePercent: 97.5,
        })
      ).toBe("tight")
    })
  })

  describe("summarizeFinancialDiagnosis", () => {
    it("ignores zero-income months when calculating average income but keeps expenses in averages", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ month: "2026-01", income: 0, essential: 1000, debt: 300 }),
        month({ month: "2026-02", income: 3000, essential: 1200, debt: 500 }),
        month({ month: "2026-03", income: 4500, essential: 1500, debt: 700 }),
        month({ month: "2026-04", income: 4500, essential: 1300, debt: 600 }),
      ])

      expect(summary.averageIncome).toBe(4000)
      expect(summary.averageEssentialCost).toBe(1250)
      expect(summary.averageDebtCost).toBe(525)
      expect(summary.survivalBalance).toBe(2750)
    })

    it("returns a debt-focused narrative when basic life closes but real balance is negative", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ income: 4000, essential: 1800, debt: 1600, dayToDay: 900, lifestyle: 0 }),
        month({ income: 4000, essential: 1800, debt: 1600, dayToDay: 900, lifestyle: 0 }),
        month({ income: 4000, essential: 1800, debt: 1600, dayToDay: 900, lifestyle: 0 }),
        month({ income: 4000, essential: 1800, debt: 1600, dayToDay: 900, lifestyle: 0 }),
      ])

      expect(summary.riskLevel).toBe("critical")
      expect(summary.survivalBalance).toBe(2200)
      expect(summary.realBalance).toBe(-300)
      expect(summary.headline).toContain("dívidas estão puxando")
      expect(summary.recommendations).toContain(
        "Negocie dívidas com dinheiro à vista e desconto, evitando trocar uma parcela cara por outra impagável."
      )
    })
  })
})
