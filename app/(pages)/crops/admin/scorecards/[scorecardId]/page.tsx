"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type {
  CriteriaEntry,
  CriteriaRegistry,
  MandateState,
  Scorecard,
  Tier2Or3CriterionEval,
} from "@/lib/mandate/schemas"
import {
  deriveTier1Overall,
  computeTierRollup,
  syncScorecardRollups,
} from "@/lib/mandate/rollup"
import { CRITERION_TO_EVIDENCE_THEME_ID, getEvidenceThemeById } from "@/lib/mandate/evidence-signals"
import { siteConfig } from "@/config/site"


export default function ScorecardEditorPage() {
  const params = useParams()
  const router = useRouter()
  const scorecardId = params.scorecardId as string
  const [criteria, setCriteria] = useState<CriteriaRegistry | null>(null)
  const [state, setState] = useState<MandateState | null>(null)
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/criteria").then((r) => r.json()) as Promise<CriteriaRegistry>,
      fetch("/api/state").then((r) => r.json()) as Promise<MandateState>,
    ])
      .then(([crit, st]) => {
        setCriteria(crit)
        setState(st)
        const sc = st.scorecards.find((s: Scorecard) => s.id === scorecardId)
        if (sc) {
          const tier1 = crit.criteria.filter((c: CriteriaEntry) => c.tier === 1)
          const tier2 = crit.criteria.filter((c: CriteriaEntry) => c.tier === 2)
          const tier3 = crit.criteria.filter((c: CriteriaEntry) => c.tier === 3)
          setScorecard(syncScorecardRollups(sc, { tier1, tier2, tier3 }))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [scorecardId])

  const updateScorecard = useCallback(
    (updater: (sc: Scorecard) => Scorecard) => {
      if (!scorecard || !criteria) return
      const next = updater(scorecard)
      const tier1 = criteria.criteria.filter((c) => c.tier === 1)
      const tier2 = criteria.criteria.filter((c) => c.tier === 2)
      const tier3 = criteria.criteria.filter((c) => c.tier === 3)
      setScorecard(syncScorecardRollups(next, { tier1, tier2, tier3 }))
    },
    [scorecard, criteria]
  )

  const persistState = useCallback(
    (newState: MandateState) => {
      setState(newState)
      const sc = newState.scorecards.find((s: Scorecard) => s.id === scorecardId)
      if (sc && criteria) {
        const tier1 = criteria.criteria.filter((c) => c.tier === 1)
        const tier2 = criteria.criteria.filter((c) => c.tier === 2)
        const tier3 = criteria.criteria.filter((c) => c.tier === 3)
        setScorecard(syncScorecardRollups(sc, { tier1, tier2, tier3 }))
      }
    },
    [scorecardId, criteria]
  )

  const handleExport = useCallback(() => {
    if (!state || !scorecard) return
    const updatedScorecards = state.scorecards.map((s: Scorecard) =>
      s.id === scorecardId ? { ...scorecard, lastUpdated: new Date().toISOString() } : s
    )
    const blob = new Blob(
      [JSON.stringify({ ...state, scorecards: updatedScorecards }, null, 2)],
      { type: "application/json" }
    )
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "state.json"
    a.click()
    URL.revokeObjectURL(a.href)
  }, [state, scorecard])

  const handleSaveToServer = useCallback(async () => {
    if (!state || !scorecard) return
    setSaving(true)
    const updatedScorecards = state.scorecards.map((s: Scorecard) =>
      s.id === scorecardId ? { ...scorecard, lastUpdated: new Date().toISOString() } : s
    )
    try {
      const res = await fetch("/api/save-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, scorecards: updatedScorecards }),
      })
      if (res.ok) {
        const data = await fetch("/api/state").then((r) => r.json())
        persistState(data)
      }
    } finally {
      setSaving(false)
    }
  }, [state, scorecard, persistState])

  if (loading) return <p className="text-neutral-500">Loading…</p>
  if (!criteria || !state || !scorecard)
    return <p className="text-red-500">Scorecard not found.</p>

  const tier1List = criteria.criteria.filter((c) => c.tier === 1)
  const tier2List = criteria.criteria.filter((c) => c.tier === 2)
  const tier3List = criteria.criteria.filter((c) => c.tier === 3)
  const derivedOverall = deriveTier1Overall(scorecard.tier1.criteria, scorecard.tier1.override)

  return (
    <div className="space-y-8">
      <Link
        href={`/crops/admin/projects/${scorecard.projectId}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to project
      </Link>
      <h1 className="text-2xl font-bold">
        Scorecard: {scorecard.periodLabel} — {scorecard.projectId}
      </h1>

      {/* Tier 1 — CROPS (emerald) */}
      <section className="overflow-hidden rounded-xl border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="border-b border-emerald-200 bg-emerald-100/80 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/30">
          <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
            Tier 1 (CROPS)
          </h2>
          <p className="mt-0.5 text-sm text-emerald-800/90 dark:text-emerald-200/90">
            Overall: fail if any criterion fails; needs review if any unknown. Evidence signal: methodology theme; Evidence: assessor notes and links.{" "}
            <a
              href={`${siteConfig.cropsSourceBase}/lib/mandate/rollup.ts#L12-L21`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-900 underline hover:no-underline dark:text-emerald-100"
            >
              Status logic (deriveTier1Overall)
            </a>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span>
              Derived overall:{" "}
              <strong
                className={
                  derivedOverall === "pass"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : derivedOverall === "fail"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                }
              >
                {derivedOverall}
              </strong>
            </span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scorecard.tier1.override.enabled}
                onChange={(e) =>
                  updateScorecard((sc) => ({
                    ...sc,
                    tier1: {
                      ...sc.tier1,
                      override: { ...sc.tier1.override, enabled: e.target.checked },
                    },
                  }))
                }
              />
              Override
            </label>
            {scorecard.tier1.override.enabled && (
              <>
                <select
                  value={scorecard.tier1.override.status}
                  onChange={(e) =>
                    updateScorecard((sc) => ({
                      ...sc,
                      tier1: {
                        ...sc.tier1,
                        override: {
                          ...sc.tier1.override,
                          status: e.target.value as "pass" | "fail" | "needs_review",
                        },
                      },
                    }))
                  }
                  className="rounded border border-emerald-300 bg-white px-2 py-1 dark:border-emerald-700 dark:bg-emerald-900/50"
                >
                  <option value="pass">pass</option>
                  <option value="fail">fail</option>
                  <option value="needs_review">needs_review</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason"
                  value={scorecard.tier1.override.reason}
                  onChange={(e) =>
                    updateScorecard((sc) => ({
                      ...sc,
                      tier1: {
                        ...sc.tier1,
                        override: { ...sc.tier1.override, reason: e.target.value },
                      },
                    }))
                  }
                  className="min-w-[12rem] rounded border border-emerald-300 bg-white px-2 py-1 dark:border-emerald-700 dark:bg-emerald-900/50"
                />
              </>
            )}
            <button
              type="button"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier1: {
                    ...sc.tier1,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier1.criteria).map(([k, v]: [string, Scorecard["tier1"]["criteria"][string]]) => [
                        k,
                        { ...v, status: "unknown" as const },
                      ])
                    ),
                  },
                }))
              }
              className="rounded border border-emerald-400 px-2 py-1 text-sm hover:bg-emerald-100 dark:border-emerald-600 dark:hover:bg-emerald-900/50"
            >
              Mark all unknown
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4 -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-200 text-neutral-600 dark:border-emerald-800 dark:text-neutral-400">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Criterion</th>
                <th className="w-28 pb-2 pr-4 font-medium">Status</th>
                <th className="min-w-[10rem] pb-2 pr-4 font-medium">Evidence signal</th>
                <th className="min-w-[12rem] pb-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40">
              {tier1List.map((c: CriteriaEntry) => (
                <CriterionRowT1
                  key={c.key}
                  entry={c}
                  value={scorecard.tier1.criteria[c.key]}
                  onChange={(value) =>
                    updateScorecard((sc) => ({
                      ...sc,
                      tier1: {
                        ...sc.tier1,
                        criteria: { ...sc.tier1.criteria, [c.key]: value },
                      },
                    }))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tier 2 — Leverage (blue) */}
      <section className="overflow-hidden rounded-xl border-2 border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="border-b border-blue-200 bg-blue-100/80 px-4 py-3 dark:border-blue-800/60 dark:bg-blue-900/30">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Tier 2 (Leverage) — Aggregated: {scorecard.tier2.rollup}/100
          </h2>
          <p className="mt-0.5 text-sm text-blue-800/90 dark:text-blue-200/90">
            Score 0–5 per criterion; aggregated = round((sum(score×weight)/(5×sum(weights)))×100). Evidence signal: methodology theme; Evidence: assessor notes and links.{" "}
            <a
              href={`${siteConfig.cropsSourceBase}/lib/mandate/rollup.ts#L26-L42`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-900 underline hover:no-underline dark:text-blue-100"
            >
              Aggregated logic (computeTierRollup)
            </a>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BulkScoreButton
              tier="blue"
              label="Set all 0"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier2: {
                    ...sc.tier2,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier2.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 0 }])
                    ),
                  },
                }))
              }
            />
            <BulkScoreButton
              tier="blue"
              label="Set all 3"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier2: {
                    ...sc.tier2,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier2.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 3 }])
                    ),
                  },
                }))
              }
            />
            <BulkScoreButton
              tier="blue"
              label="Set all 5"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier2: {
                    ...sc.tier2,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier2.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 5 }])
                    ),
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="overflow-x-auto p-4 -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-blue-200 text-neutral-600 dark:border-blue-800 dark:text-neutral-400">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Criterion</th>
                <th className="w-44 pb-2 pr-4 font-medium">Score (0–5)</th>
                <th className="min-w-[10rem] pb-2 pr-4 font-medium">Evidence signal</th>
                <th className="min-w-[12rem] pb-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100 dark:divide-blue-900/40">
              {tier2List.map((c: CriteriaEntry) => (
                <CriterionRowT2T3
                  key={c.key}
                  entry={c}
                  tier="blue"
                  value={scorecard.tier2.criteria[c.key]}
                  onChange={(value) =>
                    updateScorecard((sc) => ({
                      ...sc,
                      tier2: {
                        ...sc.tier2,
                        criteria: { ...sc.tier2.criteria, [c.key]: value as Tier2Or3CriterionEval },
                      },
                    }))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tier 3 — Subtraction (violet) */}
      <section className="overflow-hidden rounded-xl border-2 border-violet-200 bg-violet-50/50 dark:border-violet-900/60 dark:bg-violet-950/20">
        <div className="border-b border-violet-200 bg-violet-100/80 px-4 py-3 dark:border-violet-800/60 dark:bg-violet-900/30">
          <h2 className="text-lg font-semibold text-violet-900 dark:text-violet-100">
            Tier 3 (Subtraction) — Aggregated: {scorecard.tier3.rollup}/100
          </h2>
          <p className="mt-0.5 text-sm text-violet-800/90 dark:text-violet-200/90">
            Same formula as Tier 2. Evidence signal: methodology theme; Evidence: assessor notes and links.{" "}
            <a
              href={`${siteConfig.cropsSourceBase}/lib/mandate/rollup.ts#L26-L42`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-900 underline hover:no-underline dark:text-violet-100"
            >
              Aggregated logic (computeTierRollup)
            </a>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BulkScoreButton
              tier="violet"
              label="Set all 0"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier3: {
                    ...sc.tier3,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier3.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 0 }])
                    ),
                  },
                }))
              }
            />
            <BulkScoreButton
              tier="violet"
              label="Set all 3"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier3: {
                    ...sc.tier3,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier3.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 3 }])
                    ),
                  },
                }))
              }
            />
            <BulkScoreButton
              tier="violet"
              label="Set all 5"
              onClick={() =>
                updateScorecard((sc) => ({
                  ...sc,
                  tier3: {
                    ...sc.tier3,
                    criteria: Object.fromEntries(
                      Object.entries(sc.tier3.criteria).map(([k, v]: [string, Tier2Or3CriterionEval]) => [k, { ...v, score: 5 }])
                    ),
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="overflow-x-auto p-4 -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-200 text-neutral-600 dark:border-violet-800 dark:text-neutral-400">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Criterion</th>
                <th className="w-44 pb-2 pr-4 font-medium">Score (0–5)</th>
                <th className="min-w-[10rem] pb-2 pr-4 font-medium">Evidence signal</th>
                <th className="min-w-[12rem] pb-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 dark:divide-violet-900/40">
              {tier3List.map((c: CriteriaEntry) => (
                <CriterionRowT2T3
                  key={c.key}
                  entry={c}
                  tier="violet"
                  value={scorecard.tier3.criteria[c.key]}
                  onChange={(value) =>
                    updateScorecard((sc) => ({
                      ...sc,
                      tier3: {
                        ...sc.tier3,
                        criteria: { ...sc.tier3.criteria, [c.key]: value as Tier2Or3CriterionEval },
                      },
                    }))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary, risks, evidence */}
      <section className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Summary</label>
          <textarea
            value={scorecard.summary}
            onChange={(e) =>
              updateScorecard((sc) => ({ ...sc, summary: e.target.value }))
            }
            rows={3}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Risks</label>
          <textarea
            value={scorecard.risks}
            onChange={(e) =>
              updateScorecard((sc) => ({ ...sc, risks: e.target.value }))
            }
            rows={2}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
      </section>

      {/* Save / Export */}
      <section className="flex flex-wrap gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <button
          type="button"
          onClick={handleExport}
          className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Export state.json
        </button>
        <button
          type="button"
          onClick={handleSaveToServer}
          disabled={saving}
          className="rounded border border-neutral-300 px-4 py-2 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          {saving ? "Saving…" : "Save to server"}
        </button>
        <p className="text-sm text-neutral-500">
          Commit the downloaded file to <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">/data/state.json</code>.
        </p>
      </section>
    </div>
  )
}

function BulkScoreButton({
  label,
  onClick,
  tier = "neutral",
}: {
  label: string
  onClick: () => void
  tier?: "blue" | "violet" | "neutral"
}) {
  const tierClass =
    tier === "blue"
      ? "border-blue-400 text-blue-800 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-200 dark:hover:bg-blue-900/50"
      : tier === "violet"
        ? "border-violet-400 text-violet-800 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-200 dark:hover:bg-violet-900/50"
        : "border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-1 text-sm ${tierClass}`}
    >
      {label}
    </button>
  )
}

function CriterionRowT1({
  entry,
  value,
  onChange,
}: {
  entry: CriteriaEntry
  value: Scorecard["tier1"]["criteria"][string] | undefined
  onChange: (v: NonNullable<typeof value>) => void
}) {
  const v = value ?? { status: "unknown" as const, notes: "", evidenceLinks: [] }
  const statusClass =
    v.status === "pass"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
      : v.status === "fail"
        ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"
        : v.status === "na"
          ? "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-700/40 dark:text-neutral-300 dark:border-neutral-600"
          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
  return (
    <tr className="align-top">
      <td className="py-2 pr-4 text-xs text-neutral-500 dark:text-neutral-400">
        {entry.category}
      </td>
      <td className="py-2 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
        <span title={entry.fullText}>{entry.shortLabel}</span>
      </td>
      <td className="py-2 pr-4">
        <select
          value={v.status}
          onChange={(e) =>
            onChange({
              ...v,
              status: e.target.value as "pass" | "fail" | "unknown" | "na",
            })
          }
          className={`rounded border px-2 py-1 text-sm ${statusClass}`}
        >
          <option value="pass">pass</option>
          <option value="fail">fail</option>
          <option value="unknown">unknown</option>
          <option value="na">N/A</option>
        </select>
      </td>
      <td className="py-2 pr-4 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href="/crops/methodology#tier1"
          className="font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-300"
        >
          Tier 1: CROPS Hard Gates
        </Link>
      </td>
      <td className="py-2">
        <input
          type="text"
          placeholder="Notes / evidence"
          value={v.notes}
          onChange={(e) => onChange({ ...v, notes: e.target.value })}
          className="w-full rounded border border-emerald-200 bg-white px-2 py-1 text-sm dark:border-emerald-800 dark:bg-emerald-950/30"
        />
      </td>
    </tr>
  )
}

function CriterionRowT2T3({
  entry,
  value,
  onChange,
  tier = "blue",
}: {
  entry: CriteriaEntry
  value: Scorecard["tier2"]["criteria"][string] | undefined
  onChange: (v: NonNullable<typeof value>) => void
  tier?: "blue" | "violet"
}) {
  const v = value ?? { score: 0, notes: "", evidenceLinks: [] }
  const isViolet = tier === "violet"
  const tierNum = isViolet ? 3 : 2
  const themeId = CRITERION_TO_EVIDENCE_THEME_ID[entry.key]
  const theme = themeId ? getEvidenceThemeById(themeId, tierNum) : null
  const methodologyHash = tierNum === 2 ? "/crops/methodology#tier2" : "/crops/methodology#tier3"
  const activeClass = isViolet
    ? "bg-violet-500 text-white border-violet-500"
    : "bg-blue-500 text-white border-blue-500"
  const inactiveClass =
    "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
  const naActiveClass = "bg-neutral-500 text-white border-neutral-500"
  const isNa = v.score == null
  const inputBorder = isViolet
    ? "border-violet-200 dark:border-violet-800 dark:bg-violet-950/30"
    : "border-blue-200 dark:border-blue-800 dark:bg-blue-950/30"
  const linkClass = isViolet
    ? "font-medium text-violet-700 underline hover:no-underline dark:text-violet-300"
    : "font-medium text-blue-700 underline hover:no-underline dark:text-blue-300"
  return (
    <tr className="align-top">
      <td className="py-2 pr-4 text-xs text-neutral-500 dark:text-neutral-400">
        {entry.category}
      </td>
      <td className="py-2 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
        <span title={entry.fullText}>{entry.shortLabel}</span>
      </td>
      <td className="py-2 pr-4">
        <div className="flex flex-wrap items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...v, score: s })}
              className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                !isNa && v.score === s ? activeClass : inactiveClass
              }`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...v, score: null })}
            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
              isNa ? naActiveClass : inactiveClass
            }`}
            title="Not applicable — excluded from aggregate"
          >
            N/A
          </button>
        </div>
      </td>
      <td className="py-2 pr-4 text-sm text-neutral-600 dark:text-neutral-400">
        {theme ? (
          <Link href={methodologyHash} className={linkClass}>
            {theme.title}
          </Link>
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500">—</span>
        )}
      </td>
      <td className="py-2">
        <input
          type="text"
          placeholder="Notes / evidence"
          value={v.notes}
          onChange={(e) => onChange({ ...v, notes: e.target.value })}
          className={`w-full rounded border bg-white px-2 py-1 text-sm ${inputBorder}`}
        />
      </td>
    </tr>
  )
}
