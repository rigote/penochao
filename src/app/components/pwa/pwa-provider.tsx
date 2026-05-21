"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Smartphone, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const DISMISS_KEY = "penochao-pwa-install-dismissed"

function isStandalone() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

export function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)

  const shouldShow = useMemo(() => !hidden && installPrompt, [hidden, installPrompt])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    document.documentElement.classList.toggle("app-standalone", isStandalone())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Failed to register service worker:", error)
      })
    }

    if ("requestIdleCallback" in window) {
      ;(window as Window & { requestIdleCallback: (callback: IdleRequestCallback) => number }).requestIdleCallback(() => {
        registerServiceWorker()
      })
      return
    }

    setTimeout(registerServiceWorker, 1)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) {
      return
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setInstallPrompt(event)
      setHidden(false)
    }

    const onAppInstalled = () => {
      setInstallPrompt(null)
      setHidden(true)
      window.localStorage.setItem(DISMISS_KEY, "1")
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) {
      return
    }

    setIsInstalling(true)

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice.outcome === "accepted") {
        setHidden(true)
      }
    } finally {
      setIsInstalling(false)
      setInstallPrompt(null)
    }
  }

  function dismissPrompt() {
    setHidden(true)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1")
    }
  }

  if (!shouldShow) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-3xl border border-emerald-200/40 bg-zinc-950/92 p-4 text-white shadow-2xl shadow-emerald-950/35 backdrop-blur-xl">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-900/30">
          <Smartphone className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instale o Penochao</p>
          <p className="text-xs text-zinc-300">
            Abra mais rapido, em tela cheia, com experiencia mais proxima de app.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            <Download className="h-4 w-4" />
            {isInstalling ? "Abrindo..." : "Instalar"}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
            onClick={dismissPrompt}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
