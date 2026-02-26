import Link from "next/link"
import { loadCriteria, loadState } from "@/lib/mandate/data-loader"
import type { CriteriaEntry, Project, Scorecard } from "@/lib/mandate/schemas"
import {
  deriveTier1Overall,
  syncScorecardRollups,
} from "@/lib/mandate/rollup"

export const dynamic = "force-dynamic"

export default async function MandateProjectsPage() {
  const [criteria, state] = await Promise.all([loadCriteria(), loadState()])
  const currentByProject = new Map(
    state.scorecards
      .filter((s: Scorecard) => s.isCurrent)
      .map((s: Scorecard) => [s.projectId, s])
  )
  const tier1 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 1)
  const tier2 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 2)
  const tier3 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 3)

  const projectsWithScores = state.projects.map((p: Project) => {
    const sc = currentByProject.get(p.id)
    const synced = sc
      ? syncScorecardRollups(sc, { tier1, tier2, tier3 })
      : null
    const overall = synced
      ? deriveTier1Overall(synced.tier1.criteria, synced.tier1.override)
      : null
    return {
      ...p,
      tier1Status: overall,
      tier2Rollup: synced?.tier2.rollup ?? null,
      tier3Rollup: synced?.tier3.rollup ?? null,
      lastUpdated: sc?.lastUpdated ?? null,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Projects</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectsWithScores.map((p) => (
          <Link
            key={p.id}
            href={`/crops/projects/${p.id}`}
            className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <h2 className="font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {p.shortDescription}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{p.ownerTeam}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tier1Status && (
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    p.tier1Status === "pass"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : p.tier1Status === "fail"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  T1: {p.tier1Status}
                </span>
              )}
              {p.tier2Rollup != null && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  T2: {p.tier2Rollup}
                </span>
              )}
              {p.tier3Rollup != null && (
                <span className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                  T3: {p.tier3Rollup}
                </span>
              )}
            </div>
            {p.lastUpdated && (
              <p className="mt-2 text-xs text-neutral-400">
                Updated {new Date(p.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
