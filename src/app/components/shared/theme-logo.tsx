"use client"

import Image from "next/image"
import { useTheme } from "@/app/context/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeLogoProps {
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

export function ThemeLogo({
  className,
  width = 220,
  height = 52,
  priority = false,
}: ThemeLogoProps) {
  const { resolvedTheme } = useTheme()
  const src = resolvedTheme === "dark" ? "/logo-white.png" : "/logo.png"

  return (
    <Image
      src={src}
      alt="Penochão"
      width={width}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
    />
  )
}
