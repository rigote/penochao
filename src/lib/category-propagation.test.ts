import { findIdsWithExactDescription, normalizeDescriptionForCategoryPropagation } from "./category-propagation"

describe("category propagation helpers", () => {
  it("normalizes leading and trailing whitespace before matching", () => {
    expect(normalizeDescriptionForCategoryPropagation("  Salario  ")).toBe("Salario")
  })

  it("returns only items with the exact same description", () => {
    const ids = findIdsWithExactDescription(
      [
        { id: "1", description: "Netflix" },
        { id: "2", description: "Netflix " },
        { id: "3", description: "NETFLIX" },
        { id: "4", description: "Spotify" },
      ],
      "Netflix"
    )

    expect(ids).toEqual(["1", "2"])
  })

  it("returns an empty list when the requested description is blank", () => {
    const ids = findIdsWithExactDescription([{ id: "1", description: "Salario" }], "   ")

    expect(ids).toEqual([])
  })
})
