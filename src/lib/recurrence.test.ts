import { getDisplayOccurrenceDate, projectMonthlyOccurrenceDate } from "./recurrence"

describe("recurrence date projection", () => {
  it("projects a monthly occurrence to the selected month preserving the day", () => {
    expect(projectMonthlyOccurrenceDate("2026-01-15", new Date(2026, 4, 15))).toBe("2026-05-15")
  })

  it("uses the last day of the selected month when the original day does not exist", () => {
    expect(projectMonthlyOccurrenceDate("2026-01-31", new Date(2026, 1, 15))).toBe("2026-02-28")
    expect(projectMonthlyOccurrenceDate("2024-01-31", new Date(2024, 1, 15))).toBe("2024-02-29")
  })

  it("only projects monthly recurrences", () => {
    expect(
      getDisplayOccurrenceDate({
        occurrenceDate: "2026-01-15",
        recurrence: "once",
        targetMonth: new Date(2026, 4, 15),
      })
    ).toBe("2026-01-15")

    expect(
      getDisplayOccurrenceDate({
        occurrenceDate: "2026-01-15",
        recurrence: "monthly",
        targetMonth: new Date(2026, 4, 15),
      })
    ).toBe("2026-05-15")
  })
})
