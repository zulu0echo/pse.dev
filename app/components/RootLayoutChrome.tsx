"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function RootLayoutChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isCrops = pathname?.startsWith("/crops") ?? false

  if (isCrops) {
    return <>{children}</>
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
