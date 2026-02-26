"use client"

import { useState } from "react"
import Link from "next/link"
import type { CriteriaEntry, CriteriaRegistry } from "@/lib/mandate/schemas"
import {
  TIER2_EVIDENCE_THEMES,
  TIER3_EVIDENCE_THEMES,
  TIER2_CORE_QUESTION,
  TIER3_CORE_QUESTION,
  EVIDENCE_SOURCES_INTRO,
  GUARDRAIL_TEXT,
  EVIDENCE_PANEL_INTRO,
  type EvidenceTheme,
} from "@/lib/mandate/evidence-signals"

const listItem =
  "relative pl-5 before:absolute before:left-0 before:content-['·'] before:font-bold before:text-neutral-400 dark:before:text-neutral-500"
const NA_CALLOUT =
  "If a criterion cannot be assessed (e.g. no relevant evidence in the repo, or the criterion does not apply to this project), record the score as N/A and explain in the Notes/Links section why it could not be assessed."
const tierStyles = {
  emerald:
    "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
  blue: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
  violet:
    "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20",
} as const
const DEFAULT_T1_GUIDANCE =
  "Assess from repository artifacts (LICENSE, code, docs, governance, architecture). Pass: criterion clearly satisfied by evidence; Fail: not satisfied or contradicted; Unknown: insufficient evidence."
const DEFAULT_T1_NA =
  "No relevant artifact or context in the repo; mark Unknown and explain in Notes/Links why it could not be assessed."
const DEFAULT_T2T3_GUIDANCE =
  "Assess from repo and documentation: 0 = no evidence or contradicts; 1–2 = partial/aspirational; 3 = moderate evidence; 4–5 = strong evidence and alignment. Document evidence links in Notes/Links."
const DEFAULT_T2T3_NA =
  "Criterion not applicable to this project or no evidence available; record N/A and explain in Notes/Links why it could not be assessed."

function groupByCategory(criteria: CriteriaEntry[]) {
  const map = new Map<string, CriteriaEntry[]>()
  for (const c of criteria) {
    const list = map.get(c.category) ?? []
    list.push(c)
    map.set(c.category, list)
  }
  return Array.from(map.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { sensitivity: "base" })
  )
}

function CriterionBlock({
  c,
  tierColor,
}: {
  c: CriteriaEntry
  tierColor: "emerald" | "blue" | "violet"
}) {
  const guidance =
    c.assessmentGuidance ??
    (c.tier === 1 ? DEFAULT_T1_GUIDANCE : DEFAULT_T2T3_GUIDANCE)
  const whenNa = c.whenNa ?? (c.tier === 1 ? DEFAULT_T1_NA : DEFAULT_T2T3_NA)
  return (
    <li className={`rounded-xl border p-4 ${tierStyles[tierColor]}`}>
      <div className="font-medium text-neutral-900 dark:text-white">
        {c.shortLabel}
      </div>
      <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
        {c.fullText}
      </p>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          How we assess:
        </span>{" "}
        {guidance}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
        <span className="font-medium">N/A when:</span> {whenNa}
      </p>
    </li>
  )
}

function EvidenceThemeBlock({
  theme,
  tierColor,
}: {
  theme: EvidenceTheme
  tierColor: "blue" | "violet"
}) {
  const border =
    tierColor === "blue"
      ? "border-blue-200 dark:border-blue-800"
      : "border-violet-200 dark:border-violet-800"
  const bg =
    tierColor === "blue"
      ? "bg-blue-50/50 dark:bg-blue-950/20"
      : "bg-violet-50/50 dark:bg-violet-950/20"
  const heading =
    tierColor === "blue"
      ? "text-blue-900 dark:text-blue-100"
      : "text-violet-900 dark:text-violet-100"
  const label =
    tierColor === "blue"
      ? "text-blue-800 dark:text-blue-200"
      : "text-violet-800 dark:text-violet-200"
  return (
    <article className={`rounded-xl border p-4 ${border} ${bg}`}>
      <h3 className={`text-base font-semibold ${heading}`}>{theme.title}</h3>
      <p className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Measures: {theme.measures}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <span className={`font-medium ${label}`}>High evidence signals</span>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-neutral-600 dark:text-neutral-400">
            {theme.highSignals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="font-medium text-red-700 dark:text-red-300">
            Red flags
          </span>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-neutral-600 dark:text-neutral-400">
            {theme.redFlags.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          <span className="font-medium">Mandate anchor:</span>{" "}
          {theme.mandateAnchor}
        </p>
      </div>
    </article>
  )
}

export function MethodologyWithToggle({
  criteria,
}: {
  criteria: CriteriaRegistry
}) {
  const [view, setView] = useState<"simple" | "complex">("simple")
  const tier1 = criteria.criteria.filter((c) => c.tier === 1)
  const tier2 = criteria.criteria.filter((c) => c.tier === 2)
  const tier3 = criteria.criteria.filter((c) => c.tier === 3)
  const t1ByCategory = groupByCategory(tier1)
  const t2ByCategory = groupByCategory(tier2)
  const t3ByCategory = groupByCategory(tier3)

  return (
    <div className="max-w-3xl space-y-6 px-0 sm:space-y-8">
      {/* Toggle */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Methodology view:
        </span>
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setView("simple")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "simple"
                ? "bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => setView("complex")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "complex"
                ? "bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Complex
          </button>
        </div>
      </div>

      {view === "simple" ? (
        <SimpleMethodology
          t1ByCategory={t1ByCategory}
          t2ByCategory={t2ByCategory}
          t3ByCategory={t3ByCategory}
        />
      ) : (
        <ComplexMethodology
          criteria={criteria}
          t1ByCategory={t1ByCategory}
          t2ByCategory={t2ByCategory}
          t3ByCategory={t3ByCategory}
        />
      )}
    </div>
  )
}

function SimpleMethodology({
  t1ByCategory,
  t2ByCategory,
  t3ByCategory,
}: {
  t1ByCategory: [string, CriteriaEntry[]][]
  t2ByCategory: [string, CriteriaEntry[]][]
  t3ByCategory: [string, CriteriaEntry[]][]
}) {
  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-6 sm:py-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
          Methodology
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
          Projects are assessed against three tiers of criteria derived from the{" "}
          <strong className="text-neutral-800 dark:text-neutral-200">EF Mandate v1.4</strong>.
          Assessment is evidence-based: reviewers use repo artifacts, docs, and governance
          materials to score alignment.
        </p>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          <strong className="text-neutral-800 dark:text-neutral-200">Tier 1</strong> is
          pass/fail per criterion; <strong className="text-neutral-800 dark:text-neutral-200">Tier 2 and 3</strong> are
          scored 0–5 per criterion and aggregated to 0–100.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Three tiers
        </h2>
        <ul className="mt-3 space-y-4 text-neutral-600 dark:text-neutral-400">
          <li>
            <strong className="text-emerald-700 dark:text-emerald-400">
              Tier 1 (CROPS)
            </strong>
            — Hard gates: censorship resistance, open source &amp; free, privacy,
            security, and explicit limits. Each criterion is{" "}
            <span className="font-medium text-emerald-800 dark:text-emerald-200">pass</span>,{" "}
            <span className="font-medium text-red-700 dark:text-red-300">fail</span>,{" "}
            <span className="font-medium text-amber-700 dark:text-amber-300">unknown</span>, or{" "}
            <span className="font-medium text-neutral-600 dark:text-neutral-400">N/A</span> (not applicable).
            One fail → overall fail; any unknown → needs review; N/A criteria are excluded from the gate.
          </li>
          <li>
            <strong className="text-blue-700 dark:text-blue-400">
              Tier 2 (Leverage)
            </strong>
            — {TIER2_CORE_QUESTION} 0–5 per criterion, then aggregated to 0–100.
          </li>
          <li>
            <strong className="text-violet-700 dark:text-violet-400">
              Tier 3 (Subtraction)
            </strong>
            — {TIER3_CORE_QUESTION} 0–5 per criterion, then aggregated to 0–100.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          High-level criteria
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Criteria by tier and category. Switch to <strong>Complex</strong> view for full descriptions and assessment guidance.
        </p>
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Tier 1 (CROPS)
            </h3>
            <ul className="mt-2 space-y-2">
              {t1ByCategory.map(([category, entries]) => (
                <li key={category} className="text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">{category}:</span>{" "}
                  {entries.map((c) => c.shortLabel).join(" · ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Tier 2 (Leverage)
            </h3>
            <ul className="mt-2 space-y-2">
              {t2ByCategory.map(([category, entries]) => (
                <li key={category} className="text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">{category}:</span>{" "}
                  {entries.map((c) => c.shortLabel).join(" · ")}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
              Tier 3 (Subtraction)
            </h3>
            <ul className="mt-2 space-y-2">
              {t3ByCategory.map(([category, entries]) => (
                <li key={category} className="text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-500 dark:text-neutral-400">{category}:</span>{" "}
                  {entries.map((c) => c.shortLabel).join(" · ")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Where we look for evidence
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          {EVIDENCE_SOURCES_INTRO}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Repo rubric analysis (automated)
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          An automated rubric runs on a GitHub repo URL (from the project page when an admin is logged in, or when assessing a single repo). It scores criteria <strong>A1–E2</strong> on a <strong>0–3</strong> scale using only repo artifacts—no manual input. Results are cached for 5 minutes per repo/ref.
        </p>
        <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Evidence sources scanned
        </p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-neutral-600 dark:text-neutral-400">
          <li>Root files: LICENSE, README.md, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, GOVERNANCE.md, CHANGELOG.md, package.json, package-lock.json, Cargo.toml, Cargo.lock, go.mod, go.sum, pyproject.toml</li>
          <li>Directories (all files inside): docs, spec, specs, design, adr, architecture, audits, threat-model, threat_model, .github/workflows</li>
        </ul>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Scoring is <strong>rule-based</strong>: each criterion combines multiple signals (e.g. README + GOVERNANCE for censorship resistance, SECURITY + threat-model for security). We use simple negation and context to reduce false positives (e.g. &quot;no kill switch&quot; is treated as positive). Dependencies are checked for telemetry/analytics (e.g. in package.json). Each criterion result includes a short <strong>explanation</strong> (e.g. &quot;A2: 3 — OSI license in LICENSE&quot;), shown on the project page and in the Criteria drilldown. The <strong>last run</strong> timestamp and per-criterion scores are stored on the scorecard and displayed in the Repo rubric block.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Tier 1 outcomes
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="font-semibold text-amber-800 dark:text-amber-200">Unknown</span>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              Not yet assessed; counts toward &quot;needs review&quot;.
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-2.5 dark:border-red-800 dark:bg-red-950/30">
            <span className="font-semibold text-red-800 dark:text-red-200">Fail</span>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              Criterion not met; overall Tier 1 is fail.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2.5 dark:border-neutral-600 dark:bg-neutral-800/50">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">N/A</span>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              Not applicable to this project; excluded from overall gate. Explain in Evidence.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="font-semibold text-amber-800 dark:text-amber-200">Needs review</span>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              Overall status when at least one Tier 1 criterion is unknown.
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-lg border-2 border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Guardrail
        </p>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
          {GUARDRAIL_TEXT}
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-neutral-600 dark:text-neutral-400">
          For the full criterion list, evidence signals, and per-criterion assessment
          guidance, switch to <strong>Complex</strong> view or see the{" "}
          <Link
            href="/how-crops-are-you/rubric"
            className="font-medium text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            Assessment rubric
          </Link>
          .
        </p>
      </section>
    </>
  )
}

function ComplexMethodology({
  criteria,
  t1ByCategory,
  t2ByCategory,
  t3ByCategory,
}: {
  criteria: CriteriaRegistry
  t1ByCategory: [string, CriteriaEntry[]][]
  t2ByCategory: [string, CriteriaEntry[]][]
  t3ByCategory: [string, CriteriaEntry[]][]
}) {
  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 px-6 py-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Methodology
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          The criteria list is derived from the EF Mandate v1.4 and stored in{" "}
          <code className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-700">
            /data/criteria.json
          </code>
          . This page explains how alignment is scored and lists every criterion
          with in-depth descriptions and explicit assessment guidance.
        </p>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {EVIDENCE_SOURCES_INTRO}
        </p>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          An <strong>automated repo rubric</strong> (A1–E2, 0–3) runs on GitHub repos from the project page; it uses rule-based scoring over fetched files and dirs (LICENSE, README, SECURITY, GOVERNANCE, threat-model, .github/workflows, etc.) and attaches a short explanation per criterion. Switch to <strong>Simple</strong> view for the full &quot;Repo rubric analysis&quot; section.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Three-Tier Model
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Alignment is evaluated in three tiers.{" "}
          <strong className="text-neutral-900 dark:text-white">Tier 1</strong>{" "}
          are hard gates: if a project fails any Tier 1 criterion, it is not
          considered aligned regardless of Tier 2 or Tier 3 scores. Tier 2 and
          Tier 3 are scored 0–5 per criterion and aggregated to 0–100.
        </p>
      </section>

      {/* Tier 1 */}
      <section id="tier1" className="overflow-hidden rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="border-b border-emerald-200 bg-emerald-100/80 px-6 py-4 dark:border-emerald-800 dark:bg-emerald-900/40">
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Tier 1: CROPS Hard Gates
          </h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-neutral-700 dark:text-neutral-300">
            Tier 1 criteria are pass/fail/unknown. They encode non-negotiable
            properties:{" "}
            <strong className="text-emerald-800 dark:text-emerald-200">
              CROPS
            </strong>{" "}
            (Censorship resistance, Open source &amp; free, Privacy, Security)
            plus explicit limits.
          </p>
          <ul className="space-y-2">
            <li className={listItem}>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                Pass
              </span>
              : Criterion is satisfied with evidence.
            </li>
            <li className={listItem}>
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-200">
                Fail
              </span>
              : Criterion is not satisfied.
            </li>
            <li className={listItem}>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                Unknown
              </span>
              : Not yet assessed; contributes to &quot;needs_review&quot; overall.
            </li>
          </ul>
          <p className="text-neutral-700 dark:text-neutral-300">
            <strong className="text-emerald-800 dark:text-emerald-200">
              Overall Tier 1
            </strong>
            : If any criterion is <em>fail</em> → overall <em>fail</em>. Else if
            any is <em>unknown</em> → <em>needs_review</em>. Else →{" "}
            <em>pass</em>.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              N/A and Notes/Links
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
              {NA_CALLOUT}
            </p>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <Link
              href="/how-crops-are-you/rubric"
              className="font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-300"
            >
              Assessment rubric
            </Link>
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white shadow-sm dark:border-emerald-800 dark:bg-neutral-900">
        <div className="border-b border-emerald-200 bg-emerald-50/80 px-6 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
            Tier 1: All criteria
          </h2>
        </div>
        <div className="space-y-6 px-6 py-5">
          {t1ByCategory.map(([category, entries]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                {category}
              </h3>
              <ul className="mt-3 space-y-3">
                {entries.map((c) => (
                  <CriterionBlock key={c.key} c={c} tierColor="emerald" />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tier 2 */}
      <section id="tier2" className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-blue-50/60 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
        <div className="border-b border-blue-200 bg-blue-100/80 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/40">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            Tier 2: Leverage Removal
          </h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-neutral-700 dark:text-neutral-300">
            Tier 2 measures how much the project removes or avoids leverage.
            Each criterion is scored 0–5; aggregated score is 0–100.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              N/A and Notes/Links
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
              {NA_CALLOUT}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-sm dark:border-blue-800 dark:bg-neutral-900">
        <div className="border-b border-blue-200 bg-blue-50/80 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            Tier 2: Evidence signals (assessment guide)
          </h2>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            Core question: {TIER2_CORE_QUESTION}
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {TIER2_EVIDENCE_THEMES.map((theme) => (
            <EvidenceThemeBlock key={theme.id} theme={theme} tierColor="blue" />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-sm dark:border-blue-800 dark:bg-neutral-900">
        <div className="border-b border-blue-200 bg-blue-50/80 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            Tier 2: All criteria
          </h2>
        </div>
        <div className="space-y-6 px-6 py-5">
          {t2ByCategory.map(([category, entries]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200">
                {category}
              </h3>
              <ul className="mt-3 space-y-3">
                {entries.map((c) => (
                  <CriterionBlock key={c.key} c={c} tierColor="blue" />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tier 3 */}
      <section id="tier3" className="overflow-hidden rounded-2xl border-2 border-violet-200 bg-violet-50/60 shadow-sm dark:border-violet-800 dark:bg-violet-950/30">
        <div className="border-b border-violet-200 bg-violet-100/80 px-6 py-4 dark:border-violet-800 dark:bg-violet-900/40">
          <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-100">
            Tier 3: Subtraction &amp; Diffusion
          </h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-neutral-700 dark:text-neutral-300">
            Tier 3 measures how well the work supports ecosystem diffusion. Same
            formula: 0–5 per criterion, normalized to 0–100.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              N/A and Notes/Links
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
              {NA_CALLOUT}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-violet-200 bg-white shadow-sm dark:border-violet-800 dark:bg-neutral-900">
        <div className="border-b border-violet-200 bg-violet-50/80 px-6 py-4 dark:border-violet-800 dark:bg-violet-900/20">
          <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-100">
            Tier 3: Evidence signals (assessment guide)
          </h2>
          <p className="mt-1 text-sm text-violet-800 dark:text-violet-200">
            Core question: {TIER3_CORE_QUESTION}
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {TIER3_EVIDENCE_THEMES.map((theme) => (
            <EvidenceThemeBlock
              key={theme.id}
              theme={theme}
              tierColor="violet"
            />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-violet-200 bg-white shadow-sm dark:border-violet-800 dark:bg-neutral-900">
        <div className="border-b border-violet-200 bg-violet-50/80 px-6 py-4 dark:border-violet-800 dark:bg-violet-900/20">
          <h2 className="text-xl font-semibold text-violet-900 dark:text-violet-100">
            Tier 3: All criteria
          </h2>
        </div>
        <div className="space-y-6 px-6 py-5">
          {t3ByCategory.map(([category, entries]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                {category}
              </h3>
              <ul className="mt-3 space-y-3">
                {entries.map((c) => (
                  <CriterionBlock key={c.key} c={c} tierColor="violet" />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Evidence checklist &amp; guardrail
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          {EVIDENCE_PANEL_INTRO}
        </p>
        <div className="mt-4 rounded-lg border-2 border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Important guardrail
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
            {GUARDRAIL_TEXT}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Unknown vs Fail vs Needs Review
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Unknown
            </span>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              The criterion has not been assessed yet.
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
            <span className="font-semibold text-red-800 dark:text-red-200">
              Fail
            </span>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Assessed and the project does not meet the criterion.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Needs review
            </span>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Overall Tier 1 status when at least one criterion is unknown.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-neutral-200 bg-neutral-50/80 p-6 dark:border-neutral-800 dark:bg-neutral-900/80">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Aggregated score
        </h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          For Tier 2 and Tier 3: subscores 0–5. Aggregated score:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white px-4 py-3 font-mono text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
          sum(score × weight) / (5 × sum(weights)) × 100, rounded
        </pre>
      </section>
    </>
  )
}
