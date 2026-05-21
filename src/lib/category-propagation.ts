import { decrypt } from "@/lib/encryption"

export function normalizeDescriptionForCategoryPropagation(description: string) {
  return description.trim()
}

export function findIdsWithExactDescription<T extends { id: string; description: string }>(
  items: T[],
  description: string
) {
  const normalizedDescription = normalizeDescriptionForCategoryPropagation(description)

  if (!normalizedDescription) {
    return []
  }

  return items
    .filter((item) => normalizeDescriptionForCategoryPropagation(decrypt(item.description)) === normalizedDescription)
    .map((item) => item.id)
}
