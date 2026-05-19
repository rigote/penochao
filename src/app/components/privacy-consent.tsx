"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Button } from "@/app/components/ui/button"
import {
  canLoadAnalytics,
  getStoredPrivacyConsent,
  setStoredPrivacyConsent,
  type PrivacyConsentStatus,
} from "@/lib/privacy-consent"

const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export function PrivacyConsentManager() {
  const [status, setStatus] = useState<PrivacyConsentStatus | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStatus(getStoredPrivacyConsent(window.localStorage))
    setMounted(true)
  }, [])

  const saveConsent = (nextStatus: PrivacyConsentStatus) => {
    setStoredPrivacyConsent(window.localStorage, nextStatus)
    setStatus(nextStatus)
  }

  const analyticsAllowed = canLoadAnalytics(status)

  return (
    <>
      {analyticsAllowed && <Analytics />}
      {analyticsAllowed && gaId && <GoogleAnalytics gaId={gaId} />}

      {mounted && status === null && (
        <div className="fixed bottom-4 left-4 right-4 z-[80] mx-auto max-w-3xl rounded-xl border bg-background p-4 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Privacidade e LGPD</p>
              <p className="text-sm text-muted-foreground">
                Usamos cookies essenciais para login e segurança. Analytics é opcional e só carrega se você permitir.
              </p>
              <Link href="/privacidade" className="text-sm text-primary hover:underline">
                Ver política de privacidade
              </Link>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => saveConsent("rejected")}>
                Recusar
              </Button>
              <Button onClick={() => saveConsent("accepted")}>
                Permitir analytics
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
