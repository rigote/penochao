import {
  createCategorySchema,
  createExpenseSchema,
  createIncomeSchema,
  monthQuerySchema,
  updateUserSettingsSchema,
} from "./finance"

describe("finance validations", () => {
  it("coerces valid income payloads and defaults recurrence to once", () => {
    const parsed = createIncomeSchema.parse({
      description: "Salário",
      amount: "3500.50",
      occurrenceDate: "2026-05-10",
    })

    expect(parsed.amount).toBe(3500.5)
    expect(parsed.recurrence).toBe("once")
  })

  it("rejects non-positive income and malformed dates", () => {
    expect(() =>
      createIncomeSchema.parse({
        description: "Salário",
        amount: 0,
        occurrenceDate: "10/05/2026",
      })
    ).toThrow()
  })

  it("accepts only supported expense types", () => {
    expect(() =>
      createExpenseSchema.parse({
        description: "Fatura",
        amount: 100,
        occurrenceDate: "2026-05-10",
        type: "debt",
      })
    ).toThrow()

    expect(
      createExpenseSchema.parse({
        description: "Aluguel",
        amount: 1800,
        occurrenceDate: "2026-05-10",
        type: "essential",
      }).type
    ).toBe("essential")
  })

  it("validates category colors as hex values", () => {
    expect(
      createCategorySchema.parse({
        name: "Mercado",
        type: "essential",
        color: "#22c55e",
      }).color
    ).toBe("#22c55e")

    expect(() =>
      createCategorySchema.parse({
        name: "Mercado",
        type: "essential",
        color: "green",
      })
    ).toThrow()
  })

  it("bounds emergency fund settings and month query params", () => {
    expect(updateUserSettingsSchema.parse({ emergencyFundMonths: "6" }).emergencyFundMonths).toBe(6)
    expect(() => updateUserSettingsSchema.parse({ emergencyFundMonths: 30 })).toThrow()

    expect(monthQuerySchema.parse({ month: "12", year: "2026" })).toEqual({
      month: 12,
      year: 2026,
    })
    expect(() => monthQuerySchema.parse({ month: "13", year: "2026" })).toThrow()
  })
})
