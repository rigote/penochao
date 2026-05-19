jest.mock("@/db", () => ({
  db: {},
}))

import {
  classifyExpense,
  getRiskLevel,
  roundUpCashBuffer,
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

    it("classifies credit card expenses from category names and parent categories", () => {
      expect(
        classifyExpense({
          description: "Compra do mês",
          type: "non_essential",
          categoryName: "Cartão de Crédito",
        })
      ).toBe("debt")

      expect(
        classifyExpense({
          description: "Compra parcelada",
          type: "non_essential",
          categoryName: "Nubank",
          parentCategoryName: "Cartões",
        })
      ).toBe("debt")

      expect(
        classifyExpense({
          description: "Pagamento Mastercard",
          type: "essential",
          categoryName: "Moradia",
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

    it("does not match card brand fragments inside unrelated words", () => {
      expect(
        classifyExpense({
          description: "Revisão do veículo",
          type: "non_essential",
          categoryName: "Veículo",
        })
      ).toBe("lifestyle")

      expect(
        classifyExpense({
          description: "Cabelo",
          type: "non_essential",
          categoryName: "Salão",
        })
      ).toBe("lifestyle")
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

  describe("roundUpCashBuffer", () => {
    it("rounds positive cash needs up to the next hundred", () => {
      expect(roundUpCashBuffer(2948.01)).toBe(3000)
      expect(roundUpCashBuffer(3000)).toBe(3000)
      expect(roundUpCashBuffer(1)).toBe(100)
      expect(roundUpCashBuffer(0)).toBe(0)
    })
  })

  describe("summarizeFinancialDiagnosis", () => {
    it("ignores zero-income months for income average while using current expenses for balances", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ month: "2026-01", income: 0, essential: 1000, debt: 300 }),
        month({ month: "2026-02", income: 3000, essential: 1200, debt: 500 }),
        month({ month: "2026-03", income: 4500, essential: 1500, debt: 700 }),
        month({ month: "2026-04", income: 4500, essential: 1300, debt: 600 }),
      ])

      expect(summary.averageIncome).toBe(4000)
      expect(summary.averageEssentialCost).toBe(1250)
      expect(summary.averageDebtCost).toBe(525)
      expect(summary.survivalBalance).toBe(2700)
    })

    it("does not dilute a high-spend current month with quieter previous months", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ month: "2026-01", income: 10000, essential: 0, debt: 0, lifestyle: 0 }),
        month({ month: "2026-02", income: 10000, essential: 0, debt: 0, lifestyle: 0 }),
        month({ month: "2026-03", income: 10000, essential: 0, debt: 0, lifestyle: 0 }),
        month({ month: "2026-04", income: 10000, essential: 1800, debt: 2200, lifestyle: 9000 }),
      ])

      expect(summary.averageIncome).toBe(10000)
      expect(summary.averageTotalExpenses).toBe(3250)
      expect(summary.realBalance).toBe(-3000)
      expect(summary.cashNeededToday).toBe(3000)
      expect(summary.committedIncomePercent).toBe(130)
      expect(summary.riskLevel).toBe("alert")
      expect(summary.headline).toContain("fecha negativo")
    })

    it("rounds the extra cash needed up to leave a small comfort margin", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ income: 10098.76, essential: 0 }),
        month({ income: 10098.76, essential: 0 }),
        month({ income: 10098.76, essential: 0 }),
        month({ income: 10098.76, essential: 1793.08, debt: 2228.21, lifestyle: 9025.48 }),
      ])

      expect(summary.realBalance).toBeCloseTo(-2948.01)
      expect(summary.cashNeededToday).toBe(3000)
    })

    it("does not ask for extra cash when the current month is already positive", () => {
      const summary = summarizeFinancialDiagnosis([
        month({ income: 5000, essential: 1000, debt: 500 }),
        month({ income: 5000, essential: 1000, debt: 500 }),
        month({ income: 5000, essential: 1000, debt: 500 }),
        month({ income: 5000, essential: 1000, debt: 500 }),
      ])

      expect(summary.realBalance).toBe(3500)
      expect(summary.cashNeededToday).toBe(0)
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
