import Link from "next/link"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { siteConfig } from "@/config/site"
import { getProjects } from "@/lib/content"
import { loadCriteria, loadState } from "@/lib/mandate/data-loader"
import {
  getPseProjectPageUrl,
  PROJECT_ID_TO_PSE_SLUG,
} from "@/lib/mandate/project-page-slugs"
import type { CriteriaEntry, Project, Scorecard } from "@/lib/mandate/schemas"
import {
  deriveTier1Overall,
  syncScorecardRollups,
} from "@/lib/mandate/rollup"
import { CriteriaDrilldown } from "./CriteriaDrilldown"
import { ProjectRubricAssessment } from "./ProjectRubricAssessment"

export const dynamic = "force-dynamic"

export default async function MandateProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get("mandate_admin_session")?.value != null
  const [criteria, state] = await Promise.all([loadCriteria(), loadState()])
  const project = state.projects.find((p) => p.id === id)
  if (!project) notFound()

  const currentScorecard = state.scorecards.find(
    (s: Scorecard) => s.projectId === id && s.isCurrent
  )
  const tier1 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 1)
  const tier2 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 2)
  const tier3 = criteria.criteria.filter((c: CriteriaEntry) => c.tier === 3)
  const synced = currentScorecard
    ? syncScorecardRollups(currentScorecard, { tier1, tier2, tier3 })
    : null
  const overall = synced
    ? deriveTier1Overall(synced.tier1.criteria, synced.tier1.override)
    : null

  const t1Counts: { pass: number; fail: number; unknown: number; na: number } | null = synced
    ? { pass: 0, fail: 0, unknown: 0, na: 0 }
    : null
  if (synced && t1Counts) {
    for (const v of Object.values(synced.tier1.criteria)) {
      if (v.status === "pass") t1Counts.pass++
      else if (v.status === "fail") t1Counts.fail++
      else if (v.status === "na") t1Counts.na++
      else t1Counts.unknown++
    }
  }

  const pseProjectUrl = getPseProjectPageUrl(id, siteConfig.url)
  const pseSlug = PROJECT_ID_TO_PSE_SLUG[id]
  const pseProjects = pseSlug ? getProjects() : []
  const pseProjectContent = pseSlug
    ? pseProjects.find((p) => p.id === pseSlug)
    : null
  const githubUrl =
    (pseProjectContent?.links as { github?: string } | undefined)?.github ??
    project.githubRepoUrl ??
    null

  const evidenceLinks: { label: string; url: string }[] = []
  if (pseProjectUrl) {
    evidenceLinks.push({ label: "Project page (PSE.dev)", url: pseProjectUrl })
  }
  if (githubUrl) {
    evidenceLinks.push({
      label: "GitHub repository",
      url: githubUrl,
    })
  }
  if (synced?.evidenceLinks?.length) {
    const filtered = synced.evidenceLinks.filter(
      (l) =>
        l.label !== "PSE projects" &&
        l.url !== "https://pse.dev/projects"
    )
    evidenceLinks.push(...filtered)
  }
  const hasEvidence = evidenceLinks.length > 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Link
          href="/crops/projects"
          className="text-sm text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Projects
        </Link>
        <h1 className="mt-2 text-xl font-bold sm:text-2xl">{project.name}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {project.shortDescription}
        </p>
        <p className="text-sm text-neutral-500">{project.ownerTeam}</p>
      </div>

      {isAdmin && (
        <ProjectRubricAssessment
          projectId={id}
          repoUrl={project.githubRepoUrl ?? ""}
          projectName={project.name}
        />
      )}

      {!synced ? (
        <p className="text-neutral-500">No current scorecard for this project.</p>
      ) : (
        <>
          {(synced.rubricLastRunAt || synced.rubricRepoUrl) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Last repo rubric assessment:{" "}
              {synced.rubricLastRunAt
                ? new Date(synced.rubricLastRunAt).toLocaleString()
                : "—"}
              {synced.rubricRepoUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={synced.rubricRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {synced.rubricRepoUrl.replace(/^https:\/\/github\.com\//i, "")}
                  </a>
                </>
              )}
              {synced.rubricAverageScore != null && (
                <> · avg {synced.rubricAverageScore}/3</>
              )}
            </p>
          )}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Tier 1 (CROPS)
              </h2>
              <div
                className={`mt-1 text-xl font-semibold ${
                  overall === "pass"
                    ? "text-emerald-600"
                    : overall === "fail"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {overall}
              </div>
              {t1Counts && (
                <p className="mt-1 text-sm text-neutral-500">
                  Pass {t1Counts.pass} · Fail {t1Counts.fail} · Unknown {t1Counts.unknown}
                  {t1Counts.na > 0 && ` · N/A ${t1Counts.na}`}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Tier 2 (Leverage)
              </h2>
              <div className="mt-1 text-xl font-semibold">
                {synced.tier2.rollup}/100
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${synced.tier2.rollup}%` }}
                />
              </div>
              {synced.tier2.rollup === 0 && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  No code-snippet evidence yet (per methodology).
                </p>
              )}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Tier 3 (Subtraction)
              </h2>
              <div className="mt-1 text-xl font-semibold">
                {synced.tier3.rollup}/100
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${synced.tier3.rollup}%` }}
                />
              </div>
              {synced.tier3.rollup === 0 && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  No code-snippet evidence yet (per methodology).
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {project.shortDescription}
            </p>
            {synced.summary && (
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Assessment summary:
                </span>{" "}
                {synced.summary}
              </p>
            )}
          </section>
          {synced.risks && (
            <section>
              <h2 className="text-lg font-semibold">Risks</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                {synced.risks}
              </p>
            </section>
          )}
          {hasEvidence && (
            <section>
              <h2 className="text-lg font-semibold">Evidence</h2>
              <ul className="list-inside list-disc text-blue-600 dark:text-blue-400">
                {evidenceLinks.map((l: { label: string; url: string }, i: number) => (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <CriteriaDrilldown
            criteria={criteria}
            scorecard={synced}
            rubricLastRunAt={synced.rubricLastRunAt}
            rubricCriteria={synced.rubricCriteria}
          />
        </>
      )}
    </div>
  )
}
