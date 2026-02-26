import Link from "next/link"
import { loadCriteria, loadState } from "@/lib/mandate/data-loader"
import type { CriteriaEntry, Project, Scorecard } from "@/lib/mandate/schemas"
import {
  deriveTier1Overall,
  syncScorecardRollups,
} from "@/lib/mandate/rollup"
import { TierInfoIcon } from "./components/TierInfoIcon"
import { GradientScoreBar } from "./components/GradientScoreBar"
import { CROPSDashboardTable } from "./components/CROPSDashboardTable"

export const dynamic = "force-dynamic"

function Tier1Pill({ status }: { status: "pass" | "fail" | "needs_review" }) {
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

export default async function CROPSDashboardPage() {
  const [criteria, state] = await Promise.all([loadCriteria(), loadState()])
  const currentScorecards = state.scorecards.filter((s: Scorecard) => s.isCurrent)
  const currentByProject = new Map(
    currentScorecards.map((s: Scorecard) => [s.projectId, s])
  )
  const tier1Entries = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 1)
  const tier2Entries = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 2)
  const tier3Entries = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 3)

  const byTier1: Record<string, number> = { pass: 0, fail: 0, needs_review: 0 }
  let sumT2 = 0
  let sumT3 = 0

  const projectsWithScores = state.projects.map((p: Project) => {
    const sc = currentByProject.get(p.id)
    const synced = sc
      ? syncScorecardRollups(sc, {
          tier1: tier1Entries,
          tier2: tier2Entries,
          tier3: tier3Entries,
        })
      : null
    const overall = synced
      ? deriveTier1Overall(synced.tier1.criteria, synced.tier1.override)
      : null
    if (overall) byTier1[overall] = (byTier1[overall] ?? 0) + 1
    if (synced) {
      sumT2 += synced.tier2.rollup
      sumT3 += synced.tier3.rollup
    }
    return {
      ...p,
      tier1Status: overall,
      tier2Rollup: synced?.tier2.rollup ?? null,
      tier3Rollup: synced?.tier3.rollup ?? null,
      lastUpdated: sc?.lastUpdated ?? null,
    }
  })

  const n = currentScorecards.length
  const avgT2 = Number.isFinite(sumT2) && n ? Math.round(sumT2 / n) : 0
  const avgT3 = Number.isFinite(sumT3) && n ? Math.round(sumT3 / n) : 0
  const safeProjects =
    Array.isArray(state.projects) && state.projects.length > 0
      ? projectsWithScores
      : []

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
          CROPS
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
          This dashboard shows how PSE projects align with the Ethereum Foundation Mandate. Each project is assessed against three tiers of criteria; see our{" "}
          <Link
            href="/crops/methodology"
            className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            methodology
          </Link>
          {" "}for how criteria are defined and scored.
        </p>
        <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            <strong className="text-emerald-700 dark:text-emerald-400">Tier 1 (CROPS)</strong> is a hard gate: Censorship resistance, Open source &amp; free, Privacy, and Security. Each criterion is pass, fail, or unknown; one fail gives overall fail, any unknown gives needs review. Projects must pass Tier 1 to meet the mandate.
          </p>
          <p>
            <strong className="text-blue-700 dark:text-blue-400">Tier 2 (Leverage)</strong> measures how much the project removes or avoids leverage over users—e.g. data capture, routing control, upgrade keys, lock-in, extraction. Each criterion is scored 0–5; the aggregated score is 0–100 (higher is better).
          </p>
          <p>
            <strong className="text-violet-700 dark:text-violet-400">Tier 3 (Subtraction)</strong> measures how well the work supports ecosystem diffusion and subtraction—reducing reliance on single points, handoff readiness, documentation, and durable precedents. Same 0–5 per criterion, aggregated to 0–100.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Total projects
          </div>
          <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">
            {state.projects.length}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Tier 1
            <TierInfoIcon tier={1} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Pass <strong>{byTier1.pass ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Review <strong>{byTier1.needs_review ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
              Fail <strong>{byTier1.fail ?? 0}</strong>
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Avg Tier 2 (Leverage)
            <TierInfoIcon tier={2} />
          </div>
          <div className="mt-2">
            <GradientScoreBar value={avgT2} />
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Avg Tier 3 (Subtraction)
            <TierInfoIcon tier={3} />
          </div>
          <div className="mt-2">
            <GradientScoreBar value={avgT3} />
          </div>
        </div>
      </section>

      {/* Overview of all projects */}
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Overview of all projects
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Tier 1: gate (pass / review / fail). Tier 2 & 3: 0–100 (green = high, red = low). 0 = no code-snippet evidence yet.
          </p>
        </div>
        <CROPSDashboardTable projects={safeProjects} />
      </section>
    </div>
  )
}
