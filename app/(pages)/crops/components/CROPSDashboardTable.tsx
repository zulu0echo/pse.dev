"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TierInfoIcon } from "./TierInfoIcon"
import { GradientScoreBar } from "./GradientScoreBar"

type ProjectWithScores = {
  id: string
  name: string
  shortDescription?: string | null
  ownerTeam?: string | null
  status?: string | null
  tier1Status: "pass" | "fail" | "needs_review" | null
  tier2Rollup: number | null
  tier3Rollup: number | null
}

function Tier1Pill({
  status,
}: {
  status: "pass" | "fail" | "needs_review"
}) {
  const styles = {
    pass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    fail: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    needs_review:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  }
  const label = status === "needs_review" ? "Review" : status
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {label}
    </span>
  )
}

type SortKey = "project" | "tier1" | "tier2" | "tier3"
type SortDir = "asc" | "desc"

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction: SortDir | null
}) {
  const cls = "ml-1 inline h-3.5 w-3.5 text-neutral-400"
  if (!active || !direction) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    )
  }
  if (direction === "asc") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 15l-6-6-6 6" />
      </svg>
    )
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function CROPSDashboardTable({
  projects = [],
}: {
  projects?: ProjectWithScores[] | null
}) {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("project")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  useEffect(() => {
    setMounted(true)
  }, [])

  const list = Array.isArray(projects) ? projects : []

  const filtered = useMemo(() => {
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((p) => {
      const name = (p.name ?? "").toLowerCase()
      const desc = (p.shortDescription ?? "").toLowerCase()
      const team = (p.ownerTeam ?? "").toLowerCase()
      return name.includes(q) || desc.includes(q) || team.includes(q)
    })
  }, [list, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    const mult = sortDir === "asc" ? 1 : -1
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "project":
          cmp = (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
          break
        case "tier1": {
          const order = { pass: 2, needs_review: 1, fail: 0 }
          const va = a.tier1Status ? order[a.tier1Status] ?? -1 : -1
          const vb = b.tier1Status ? order[b.tier1Status] ?? -1 : -1
          cmp = va - vb
          break
        }
        case "tier2": {
          const va = a.tier2Rollup ?? -1
          const vb = b.tier2Rollup ?? -1
          cmp = va - vb
          break
        }
        case "tier3": {
          const va = a.tier3Rollup ?? -1
          const vb = b.tier3Rollup ?? -1
          cmp = va - vb
          break
        }
        default:
          cmp = 0
      }
      if (cmp !== 0) return mult * cmp
      return (a.id ?? "").localeCompare(b.id ?? "")
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="px-4 sm:px-6">
          <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="h-64 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/50" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-6">
        <label htmlFor="crops-search" className="sr-only">
          Search projects
        </label>
        <input
          id="crops-search"
          type="search"
          placeholder="Search by project name, description, or team…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:placeholder:text-neutral-500"
        />
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[600px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
              <th className="w-48 max-w-[200px] px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 sm:px-4">
                <button
                  type="button"
                  onClick={() => handleSort("project")}
                  className="inline-flex items-center hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Project Name
                  <SortIcon
                    active={sortKey === "project"}
                    direction={sortKey === "project" ? sortDir : null}
                  />
                </button>
              </th>
              <th className="w-[100px] whitespace-nowrap px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 sm:px-4">
                <span className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSort("tier1")}
                    className="inline-flex items-center hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Tier 1
                    <SortIcon
                      active={sortKey === "tier1"}
                      direction={sortKey === "tier1" ? sortDir : null}
                    />
                  </button>
                  <TierInfoIcon tier={1} />
                </span>
              </th>
              <th className="w-[140px] whitespace-nowrap px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 sm:px-4">
                <span className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSort("tier2")}
                    className="inline-flex items-center hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Tier 2
                    <SortIcon
                      active={sortKey === "tier2"}
                      direction={sortKey === "tier2" ? sortDir : null}
                    />
                  </button>
                  <TierInfoIcon tier={2} />
                </span>
              </th>
              <th className="w-[140px] whitespace-nowrap px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 sm:px-4">
                <span className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSort("tier3")}
                    className="inline-flex items-center hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Tier 3
                    <SortIcon
                      active={sortKey === "tier3"}
                      direction={sortKey === "tier3" ? sortDir : null}
                    />
                  </button>
                  <TierInfoIcon tier={3} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="group transition hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
              >
                <td className="w-48 max-w-[200px] px-3 py-3 sm:px-4">
                  <Link
                    href={`/crops/projects/${p.id}`}
                    className="font-medium text-neutral-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {p.name}
                  </Link>
                  {p.shortDescription && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {p.shortDescription}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  {p.tier1Status ? (
                    <Tier1Pill status={p.tier1Status} />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  {p.tier2Rollup != null ? (
                    <GradientScoreBar value={p.tier2Rollup} />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  {p.tier3Rollup != null ? (
                    <GradientScoreBar value={p.tier3Rollup} />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-neutral-500 sm:px-6">
          No projects match your search.
        </p>
      )}

      {/* Mobile: compact card list when table would be too narrow */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 sm:hidden">
        {sorted.map((p) => (
          <Link
            key={p.id}
            href={`/crops/projects/${p.id}`}
            className="block px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 sm:px-6"
          >
            <div className="font-medium text-neutral-900 dark:text-white">
              {p.name}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.tier1Status ? (
                <Tier1Pill status={p.tier1Status} />
              ) : (
                <span className="text-xs text-neutral-400">T1: —</span>
              )}
              {p.tier2Rollup != null && (
                <GradientPill value={p.tier2Rollup} label="T2" />
              )}
              {p.tier3Rollup != null && (
                <GradientPill value={p.tier3Rollup} label="T3" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Small pill with gradient color by score (0=red, 100=green) */
function GradientPill({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value))
  const r = Math.round(239 * (1 - pct / 100) + 34 * (pct / 100))
  const g = Math.round(68 * (1 - pct / 100) + 197 * (pct / 100))
  const b = Math.round(68 * (1 - pct / 100) + 94 * (pct / 100))
  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: `rgb(${r} ${g} ${b})` }}
    >
      {label}: {value}
    </span>
  )
}
