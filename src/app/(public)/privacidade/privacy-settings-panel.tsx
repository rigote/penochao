"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import {
  getStoredPrivacyConsent,
  setStoredPrivacyConsent,
  type PrivacyConsentStatus,
} from "@/lib/privacy-consent"

export function PrivacySettingsPanel() {
  const [status, setStatus] = useState<PrivacyConsentStatus | null>(null)

  useEffect(() => {
    setStatus(getStoredPrivacyConsent(window.localStorage))
  }, [])

  const updateStatus = (nextStatus: PrivacyConsentStatus) => {
    setStoredPrivacyConsent(window.localStorage, nextStatus)
    setStatus(nextStatus)
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Preferências de Privacidade</h2>
      <p className="text-muted-foreground leading-relaxed">
        Cookies essenciais ficam ativos para login, segurança e preferências. Analytics é opcional e só carrega se você permitir.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={() => updateStatus("accepted")}>
          Permitir analytics
        </Button>
        <Button variant="outline" onClick={() => updateStatus("rejected")}>
          Recusar analytics
        </Button>
        <span className="text-sm text-muted-foreground">
          Status atual: {status === "accepted" ? "analytics permitido" : status === "rejected" ? "analytics recusado" : "não definido"}
        </span>
      </div>
    </div>
  )
}
