"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

const TIER_TOOLTIPS: Record<1 | 2 | 3, string> = {
  1: "Tier 1: Hard gates—pass, fail, or needs review. CROPS = Censorship resistance, Open source & free, Privacy, Security. Each criterion is pass/fail/unknown; one fail → overall fail; any unknown → needs review.",
  2: "Tier 2 (Leverage): How much the project removes or avoids leverage over users (data capture, routing, upgrade keys, dependencies, extraction). Each criterion scored 0–5; aggregated score is 0–100.",
  3: "Tier 3 (Subtraction): How well the work supports ecosystem diffusion and subtraction (reducing reliance on single points). Each criterion scored 0–5; aggregated score is 0–100.",
}

export function TierInfoIcon({ tier }: { tier: 1 | 2 | 3 }) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const text = TIER_TOOLTIPS[tier]

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = () => {
    const el = triggerRef.current
    if (!el || typeof document === "undefined") return
    const rect = el.getBoundingClientRect()
    setCoords({
      left: rect.left + rect.width / 2,
      top: rect.top,
    })
  }

  const handleEnter = () => {
    updatePosition()
    setVisible(true)
  }

  useEffect(() => {
    if (!visible) return
    const onScroll = () => updatePosition()
    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll)
  }, [visible])

  const canPortal = mounted && typeof document !== "undefined" && document.body != null
  const tooltipEl =
    visible && canPortal
      ? createPortal(
          <span
            role="tooltip"
            className="fixed z-[100] w-72 rounded-lg border border-neutral-200 bg-white p-3 text-left text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            style={{
              left: coords.left,
              top: coords.top - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            {text}
          </span>,
          document.body
        )
      : null

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex align-middle"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
      suppressHydrationWarning
    >
      <svg
        className="ml-1 h-4 w-4 shrink-0 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label={`Tier ${tier} explanation`}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      {mounted ? tooltipEl : null}
    </span>
  )
}
