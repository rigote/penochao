"use client"

import Image from "next/image"

export function AppLoadingScreen() {
  return (
    <div className="app-loading-shell">
      <div className="app-loading-orb app-loading-orb-primary" />
      <div className="app-loading-orb app-loading-orb-secondary" />

      <div className="app-loading-skeleton">
        <div className="app-loading-skeleton-header">
          <Image
            src="/logo.png"
            alt="Penochão"
            width={160}
            height={160}
            priority
            className="h-12 w-auto opacity-95"
          />
          <div className="app-loading-skeleton-pill" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="app-skeleton-card app-skeleton-card-hero" />
          <div className="app-skeleton-card" />
          <div className="app-skeleton-card" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="app-skeleton-surface">
            <div className="app-skeleton-line w-[38%]" />
            <div className="app-skeleton-line w-[92%]" />
            <div className="app-skeleton-line w-[76%]" />
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="app-skeleton-block h-28" />
              <div className="app-skeleton-block h-28" />
            </div>
          </div>

          <div className="app-skeleton-surface">
            <div className="app-skeleton-line w-[54%]" />
            <div className="app-skeleton-line w-[84%]" />
            <div className="app-skeleton-line w-[62%]" />
            <div className="app-skeleton-block mt-3 h-40" />
          </div>
        </div>

        <div className="app-loading-progress app-loading-progress-subtle">
          <div className="app-loading-progress-bar" />
        </div>
      </div>
    </div>
  )
}
