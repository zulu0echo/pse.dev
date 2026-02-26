"use client"

import Link from "next/link"
import type { CriteriaEntry, CriteriaRegistry, Scorecard } from "@/lib/mandate/schemas"
import { CRITERION_TO_EVIDENCE_THEME_ID, getEvidenceThemeById } from "@/lib/mandate/evidence-signals"
import { siteConfig } from "@/config/site"

function getScoreInterpretation(score: number): string {
  if (score <= 0) return "No evidence or contradicts"
  if (score <= 2) return "Partial / aspirational"
  if (score === 3) return "Moderate evidence"
  return "Strong evidence and alignment"
}

/** True when notes contain a code snippet (fenced block or inline backticks). */
function notesContainSnippet(notes: string | undefined): boolean {
  if (!notes || typeof notes !== "string") return false
  return /```[\s\S]*?```|`[^`]+`/.test(notes.trim())
}

export function CriteriaDrilldown({
  criteria,
  scorecard,
  rubricLastRunAt,
  rubricCriteria,
}: {
  criteria: CriteriaRegistry
  scorecard: Scorecard
  rubricLastRunAt?: string | null
  rubricCriteria?: Array<{ id: string; title: string; score: number; explanation?: string }> | null
}) {
  const tier1 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 1)
  const tier2 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 2)
  const tier3 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 3)
  const hasRubricResult = rubricCriteria && rubricCriteria.length > 0

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Criteria drilldown
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          All tiers include <strong>Evidence signal</strong> (methodology theme for that criterion) and <strong>Evidence</strong> (dropdown with snippet or text and links). Tier 1 is pass/fail per criterion; Tier 2 & 3 <strong>Score meaning</strong> explains what the given score indicates. See{" "}
          <Link href="/crops/methodology" className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-400">
            methodology
          </Link>{" "}
          for full assessment guidance.{" "}
          <Link
            href={`${siteConfig.cropsSourceBase}/lib/mandate/schemas.ts`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            Data shape (schemas)
          </Link>
        </p>
        {rubricLastRunAt && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Latest repo rubric assessment: {new Date(rubricLastRunAt).toLocaleString()}
          </p>
        )}
      </div>

      {hasRubricResult && (
        <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Repo rubric (last run)
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            A1–E2 criteria from repo assessment; 0–3 scale.
          </p>
          <ul className="mt-2 space-y-1.5">
            {rubricCriteria!.map((c) => (
              <li
                key={c.id}
                className="rounded bg-white px-2 py-1.5 text-xs shadow-sm dark:bg-neutral-800 dark:text-neutral-200"
              >
                <span className="font-medium">{c.id} {c.score}/3</span>
                {c.explanation && (
                  <p className="mt-0.5 text-neutral-500 dark:text-neutral-400">{c.explanation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tier 1 — CROPS (emerald) */}
      <div className="overflow-hidden rounded-xl border-2 border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="border-b-2 border-emerald-300 bg-emerald-100 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/50">
          <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
            Tier 1 (CROPS)
          </h3>
          <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-200/90">
            Pass / fail / needs review per criterion. Overall: fail if any criterion fails; needs review if any unknown; else pass.
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto bg-white dark:bg-neutral-900/50 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-900/30">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Category</th>
                <th className="px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Criterion</th>
                <th className="min-w-[12rem] px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Description</th>
                <th className="w-24 whitespace-nowrap px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Status</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Evidence signal</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-100">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/50">
              {tier1.map((c: CriteriaEntry, i: number) => {
                const eval_ = scorecard.tier1.criteria[c.key]
                const status = eval_?.status ?? "unknown"
                return (
                  <Tier1TableRow
                    key={c.key}
                    entry={c}
                    status={status}
                    notes={eval_?.notes}
                    evidenceLinks={eval_?.evidenceLinks}
                    even={i % 2 === 0}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-sm text-emerald-700 dark:text-emerald-200/90">
          <Link href="/crops/methodology#tier1" className="font-medium text-emerald-800 underline hover:no-underline dark:text-emerald-200">
            Tier 1 methodology
          </Link>
        </p>
      </div>

      {/* Tier 2 — Leverage (blue) */}
      <div className="overflow-hidden rounded-xl border-2 border-blue-300 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
        <div className="border-b-2 border-blue-300 bg-blue-100 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/50">
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
            <Link
              href="/crops/methodology#tier2"
              className="hover:underline focus:underline"
            >
              Tier 2 (Leverage)
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-200/90">
            Score 0–5 per criterion · Aggregated: {scorecard.tier2.rollup}/100.{" "}
            <Link
              href="/crops/methodology#tier2"
              className="font-medium text-blue-800 underline hover:no-underline dark:text-blue-200"
            >
              Tier 2 methodology
            </Link>
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto bg-white dark:bg-neutral-900/50 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-900/30">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Category</th>
                <th className="px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Criterion</th>
                <th className="min-w-[12rem] px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Score meaning</th>
                <th className="w-16 whitespace-nowrap px-4 py-3 font-semibold text-blue-900 dark:text-blue-100 text-center">Score</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Evidence signal</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100 dark:divide-blue-900/50">
              {tier2.map((c: CriteriaEntry, i: number) => {
                const eval_ = scorecard.tier2.criteria[c.key]
                return (
                  <Tier2T3TableRow
                    key={c.key}
                    entry={c}
                    score={eval_?.score !== undefined ? eval_.score : 0}
                    notes={eval_?.notes}
                    evidenceLinks={eval_?.evidenceLinks}
                    even={i % 2 === 0}
                    tier="blue"
                    tierNum={2}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier 3 — Subtraction (violet) */}
      <div className="overflow-hidden rounded-xl border-2 border-violet-300 bg-violet-50 shadow-sm dark:border-violet-800 dark:bg-violet-950/30">
        <div className="border-b-2 border-violet-300 bg-violet-100 px-4 py-3 dark:border-violet-800 dark:bg-violet-900/50">
          <h3 className="text-base font-semibold text-violet-900 dark:text-violet-100">
            <Link
              href="/crops/methodology#tier3"
              className="hover:underline focus:underline"
            >
              Tier 3 (Subtraction)
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-violet-700 dark:text-violet-200/90">
            Score 0–5 per criterion · Aggregated: {scorecard.tier3.rollup}/100.{" "}
            <Link
              href="/crops/methodology#tier3"
              className="font-medium text-violet-800 underline hover:no-underline dark:text-violet-200"
            >
              Tier 3 methodology
            </Link>
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto bg-white dark:bg-neutral-900/50 sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-violet-200 bg-violet-50/80 dark:border-violet-800 dark:bg-violet-900/30">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-violet-900 dark:text-violet-100">Category</th>
                <th className="px-4 py-3 font-semibold text-violet-900 dark:text-violet-100">Criterion</th>
                <th className="min-w-[12rem] px-4 py-3 font-semibold text-violet-900 dark:text-violet-100">Score meaning</th>
                <th className="w-16 whitespace-nowrap px-4 py-3 font-semibold text-violet-900 dark:text-violet-100 text-center">Score</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-violet-900 dark:text-violet-100">Evidence signal</th>
                <th className="min-w-[8rem] px-4 py-3 font-semibold text-violet-900 dark:text-violet-100">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 dark:divide-violet-900/50">
              {tier3.map((c: CriteriaEntry, i: number) => {
                const eval_ = scorecard.tier3.criteria[c.key]
                return (
                  <Tier2T3TableRow
                    key={c.key}
                    entry={c}
                    score={eval_?.score !== undefined ? eval_.score : 0}
                    notes={eval_?.notes}
                    evidenceLinks={eval_?.evidenceLinks}
                    even={i % 2 === 0}
                    tier="violet"
                    tierNum={3}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const textMuted = "text-neutral-600 dark:text-neutral-400"

function Tier1TableRow({
  entry,
  status,
  notes,
  evidenceLinks,
  even,
}: {
  entry: CriteriaEntry
  status: string
  notes?: string
  evidenceLinks?: { label: string; url: string }[]
  even?: boolean
}) {
  const statusClass =
    status === "pass"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      : status === "fail"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        : status === "na"
          ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"

  const statusLabel = status === "na" ? "N/A" : status

  return (
    <tr className={`align-top ${even ? "bg-emerald-50/60 dark:bg-emerald-900/20" : "bg-white dark:bg-neutral-900/30"}`}>
      <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {entry.category}
      </td>
      <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">
        {entry.shortLabel}
      </td>
      <td className={`max-w-md px-4 py-2.5 text-sm ${textMuted}`}>
        {entry.fullText}
      </td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm">
        <Link href="/crops/methodology#tier1" className="font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-300">
          Tier 1: CROPS Hard Gates
        </Link>
      </td>
      <td className="px-4 py-2.5 text-sm">
        <details className="group">
          <summary className="cursor-pointer list-none font-medium text-emerald-700 hover:underline dark:text-emerald-300 [&::-webkit-details-marker]:hidden">
            {notes || (evidenceLinks?.length ?? 0) > 0 ? "View evidence (snippet / links)" : "No evidence recorded"}
          </summary>
          <div className="mt-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
            {notes ? (
              <p className={textMuted} title="Evidence and justification for this criterion">
                {notes}
              </p>
            ) : null}
            {evidenceLinks?.length ? (
              <ul className={notes ? "mt-2 space-y-0.5" : "space-y-0.5"}>
                {evidenceLinks.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {!notes && !(evidenceLinks?.length ?? 0) && (
              <p className={textMuted}>No snippet or links attached for this criterion.</p>
            )}
          </div>
        </details>
      </td>
    </tr>
  )
}

function Tier2T3TableRow({
  entry,
  score,
  notes,
  evidenceLinks,
  even,
  tier = "blue",
  tierNum = 2,
}: {
  entry: CriteriaEntry
  score: number | null
  notes?: string
  evidenceLinks?: { label: string; url: string }[]
  even?: boolean
  tier?: "blue" | "violet"
  tierNum?: 2 | 3
}) {
  const rowBg =
    tier === "violet"
      ? even
        ? "bg-violet-50/60 dark:bg-violet-900/20"
        : "bg-white dark:bg-neutral-900/30"
      : even
        ? "bg-blue-50/60 dark:bg-blue-900/20"
        : "bg-white dark:bg-neutral-900/30"

  const themeId = CRITERION_TO_EVIDENCE_THEME_ID[entry.key]
  const theme = themeId ? getEvidenceThemeById(themeId, tierNum) : null
  const hasSnippet = notesContainSnippet(notes)
  const hasEvidence = Boolean(notes || (evidenceLinks?.length ?? 0) > 0)
  const methodologyHash = tierNum === 2 ? "/crops/methodology#tier2" : "/crops/methodology#tier3"
  const isNa = score === null
  const numericScore = score ?? 0
  const scoreUnknown = !isNa && numericScore <= 0 && !hasSnippet

  return (
    <tr className={`align-top ${rowBg}`}>
      <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {entry.category}
      </td>
      <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-white">
        {entry.shortLabel}
      </td>
      <td className={`max-w-md px-4 py-2.5 text-sm ${textMuted}`}>
        {isNa
          ? "Not applicable — excluded from aggregate."
          : scoreUnknown
            ? "Score unknown — evidence must include a code snippet per methodology."
            : `This score (${numericScore}/5): ${getScoreInterpretation(numericScore)}`}
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-sm font-medium tabular-nums dark:bg-neutral-800 dark:text-neutral-200">
          {isNa ? "N/A" : scoreUnknown ? "—" : `${numericScore}/5`}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm">
        {theme ? (
          <Link href={methodologyHash} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            {theme.title}
          </Link>
        ) : (
          <span className={textMuted}>—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-sm">
        <details className="group">
          <summary className="cursor-pointer list-none font-medium text-blue-600 hover:underline dark:text-blue-400 [&::-webkit-details-marker]:hidden">
            {hasEvidence ? "View evidence (snippet / links)" : "No evidence recorded"}
          </summary>
          <div className="mt-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
            {notes ? (
              <p className={textMuted} title="Evidence and justification for this score">
                {notes}
              </p>
            ) : null}
            {evidenceLinks?.length ? (
              <ul className={notes ? "mt-2 space-y-0.5" : "space-y-0.5"}>
                {evidenceLinks.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {!hasEvidence && <p className={textMuted}>No snippet or links attached for this criterion.</p>}
          </div>
        </details>
      </td>
    </tr>
  )
}
