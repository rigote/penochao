import { format } from "date-fns"

export function projectMonthlyOccurrenceDate(occurrenceDate: string, targetMonth: Date) {
  const [, , dayPart] = occurrenceDate.split("-")
  const originalDay = Number(dayPart)
  const lastDayOfTargetMonth = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0
  ).getDate()
  const projectedDay = Math.min(originalDay, lastDayOfTargetMonth)

  return format(
    new Date(targetMonth.getFullYear(), targetMonth.getMonth(), projectedDay),
    "yyyy-MM-dd"
  )
}

export function getDisplayOccurrenceDate(input: {
  occurrenceDate: string
  recurrence: string | null
  targetMonth: Date
}) {
  if (input.recurrence !== "monthly") return input.occurrenceDate

  return projectMonthlyOccurrenceDate(input.occurrenceDate, input.targetMonth)
}
