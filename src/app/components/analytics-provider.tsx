"use client"

import { useAnalytics } from "@/hooks/useAnalytics"

/**
 * Client component to track page views automatically
 * Add this to your layout where you want automatic page tracking
 */
export function AnalyticsProvider() {
  useAnalytics()
  return null
}
