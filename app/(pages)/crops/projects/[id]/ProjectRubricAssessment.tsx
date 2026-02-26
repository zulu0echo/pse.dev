"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { parseRepoUrl, parseOrgSlug } from "@/lib/crops-analyzer/parse-github-url"
import type { RubricAnalysis } from "@/lib/crops-analyzer/rubric-types"

type OrgRepo = { name: string; fullName: string; url: string }

export function ProjectRubricAssessment({
  projectId,
  repoUrl: initialRepoUrl,
  projectName,
}: {
  projectId?: string
  repoUrl: string
  projectName?: string
}) {
  const router = useRouter()
  const [repoUrlInput, setRepoUrlInput] = useState((initialRepoUrl ?? "").trim())
  const repoUrl = repoUrlInput
  const parsedRepo = repoUrl ? parseRepoUrl(repoUrl) : null
  const initialOrg = repoUrl ? parseOrgSlug(repoUrl) : null
  const isAdmin = projectId != null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RubricAnalysis | null>(null)

  const [orgInput, setOrgInput] = useState(initialOrg ?? "")
  const [repos, setRepos] = useState<OrgRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string>("")

  const [orgRunLoading, setOrgRunLoading] = useState(false)
  const [orgRunError, setOrgRunError] = useState<string | null>(null)
  const [orgResult, setOrgResult] = useState<{
    org: string
    analyzed: number
    failed: number
    aggregatedScore: number | null
    perCriterionAvg?: Record<string, number>
    results: RubricAnalysis[]
    errors?: { repo: string; error: string }[]
  } | null>(null)

  const showOrgFlow = !parsedRepo

  const loadRepos = async () => {
    const org = orgInput.trim()
    if (!org) {
      setReposError("Enter an organization name (e.g. privacy-ethereum)")
      return
    }
    setReposError(null)
    setLoadingRepos(true)
    try {
      const res = await fetch(
        `/api/crops/list-org-repos?org=${encodeURIComponent(org)}&limit=100`
      )
      const data = await res.json()
      if (!res.ok) {
        setReposError(data.error || "Failed to load repositories")
        setRepos([])
        return
      }
      setRepos(data.repos ?? [])
      setSelectedRepo("")
    } catch (e) {
      setReposError(e instanceof Error ? e.message : "Request failed")
      setRepos([])
    } finally {
      setLoadingRepos(false)
    }
  }

  const runRubric = async (url?: string) => {
    const toUse = url ?? (selectedRepo ? repos.find((r) => r.fullName === selectedRepo)?.url : null) ?? repoUrl
    if (!toUse) {
      setError("Select a repository or enter a repo URL")
      return
    }
    if (!parseRepoUrl(toUse)) {
      setError("Invalid GitHub repo URL. Use https://github.com/<org>/<repo> or select a repo from the list.")
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/crops/analyze-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: toUse }),
      })
      let data: { error?: string } = {}
      try {
        data = await res.json()
      } catch {
        setError(res.ok ? "Invalid response from server" : `Server error (${res.status}). Try again or check the repo URL.`)
        return
      }
      if (!res.ok) {
        setError(data.error || "Rubric analysis failed")
        return
      }
      const analysis = data as RubricAnalysis
      setResult(analysis)
      if (projectId && toUse) {
        try {
          const saveRes = await fetch("/api/crops/save-rubric-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              repoUrl: toUse,
              result: analysis,
            }),
          })
          if (saveRes.ok) router.refresh()
        } catch {
          // non-blocking; result still shown
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const runRubricOnOrg = async () => {
    const org = orgInput.trim()
    if (!org) {
      setOrgRunError("Enter an organization name")
      return
    }
    setOrgRunError(null)
    setOrgRunLoading(true)
    setOrgResult(null)
    try {
      const res = await fetch("/api/crops/analyze-rubric-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org, limit: 100 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOrgRunError(data.error || "Org rubric analysis failed")
        return
      }
      setOrgResult({
        org: data.org,
        analyzed: data.analyzed ?? 0,
        failed: data.failed ?? 0,
        aggregatedScore: data.aggregatedScore ?? null,
        perCriterionAvg: data.perCriterionAvg,
        results: data.results ?? [],
        errors: data.errors,
      })
    } catch (e) {
      setOrgRunError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setOrgRunLoading(false)
    }
  }

  const avgScore = result
    ? (result.criteria.reduce((s, c) => s + c.score, 0) / result.criteria.length).toFixed(1)
    : null
  const hgViolations = result?.criteria.filter((c) => c.hardGateViolation) ?? []

  const analysisRunning = loading || orgRunLoading

  return (
    <section className="rounded-xl border-2 border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
      {analysisRunning && (
        <div className="-mx-4 -mt-4 mb-4 overflow-hidden rounded-t-lg bg-blue-50/80 dark:bg-blue-950/30 sm:-mx-6 sm:-mt-6">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div
              className="h-2 flex-1 min-w-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
              role="progressbar"
              aria-label="Rubric analysis in progress"
            >
              <div
                className="h-full min-w-[30%] animate-rubric-progress rounded-full bg-blue-500 dark:bg-blue-400"
                style={{ width: "30%" }}
              />
            </div>
            <span className="shrink-0 text-sm font-medium text-blue-700 dark:text-blue-300">
              {orgRunLoading ? "Analyzing all repos…" : "Analyzing repo…"}
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Repo rubric assessment
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Apply the{" "}
            <Link
              href="/how-crops-are-you/rubric"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              repo-assessment rubric
            </Link>{" "}
            to this project&apos;s GitHub repo. Scores are 0–3 per criterion with evidence from
            repo artifacts.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-3">
            <label htmlFor="rubric-repo-url" className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              GitHub repo URL (paste any repo to run assessment)
            </label>
            <input
              id="rubric-repo-url"
              type="url"
              value={repoUrlInput}
              onChange={(e) => setRepoUrlInput(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="mt-1 w-full max-w-md rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        )}
        {parsedRepo && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {parsedRepo.owner}/{parsedRepo.repo}
          </a>
        )}
      </div>

      {loadingRepos && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="h-1.5 flex-1 min-w-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div className="h-full min-w-[30%] animate-rubric-progress rounded-full bg-neutral-500 dark:bg-neutral-400" style={{ width: "30%" }} />
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Loading repositories…</span>
        </div>
      )}
      {showOrgFlow && (
        <div className="mt-4 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {repoUrl
              ? "This doesn’t look like a repo URL. Enter an organization to list its repositories, then pick one or run on all."
              : "Enter a GitHub organization to list repositories, then run the rubric on one repo or on the whole org."}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Organization
              </span>
              <input
                type="text"
                value={orgInput}
                onChange={(e) => setOrgInput(e.target.value)}
                placeholder="e.g. privacy-ethereum"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </label>
            <button
              type="button"
              onClick={loadRepos}
              disabled={loadingRepos}
              className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50 dark:bg-neutral-300 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {loadingRepos ? "Loading…" : "Load repositories"}
            </button>
          </div>
          {reposError && (
            <p className="text-sm text-red-600 dark:text-red-400">{reposError}</p>
          )}
          {repos.length > 0 && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Select repository
                </span>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="max-w-md rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="">— Pick one —</option>
                  {repos.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => runRubric()}
                  disabled={loading || !selectedRepo}
                  className="min-h-[44px] w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
                >
                  {loading ? "Running…" : "Run rubric on selected repo"}
                </button>
                <button
                  type="button"
                  onClick={runRubricOnOrg}
                  disabled={orgRunLoading}
                  className="min-h-[44px] w-full rounded-lg border-2 border-neutral-900 bg-transparent px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800 sm:w-auto"
                >
                  {orgRunLoading ? "Running on all repos…" : "Run rubric on entire org"}
                </button>
              </div>
            </>
          )}
          {orgRunError && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
              {orgRunError}
            </p>
          )}
          {orgResult && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Org aggregated score
                  </span>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">
                    {orgResult.aggregatedScore != null
                      ? `${orgResult.aggregatedScore} / 3`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Repos analyzed
                  </span>
                  <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                    {orgResult.analyzed}
                    {orgResult.failed > 0 && ` (${orgResult.failed} failed)`}
                  </p>
                </div>
              </div>
              {orgResult.perCriterionAvg && Object.keys(orgResult.perCriterionAvg).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Avg per criterion (org-wide)
                  </h3>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(orgResult.perCriterionAvg).map(([id, score]) => (
                      <li key={id} className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-700">
                        {id}: {score}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                  Per-repo results ({orgResult.results.length})
                </summary>
                <ul className="mt-2 space-y-1">
                  {orgResult.results.map((r) => {
                    const avg = r.criteria.length
                      ? (r.criteria.reduce((s, c) => s + c.score, 0) / r.criteria.length).toFixed(1)
                      : "—"
                    return (
                      <li key={r.repoUrl} className="flex items-center gap-2">
                        <a
                          href={r.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {r.repoUrl.replace(/^https:\/\/github\.com\//i, "")}
                        </a>
                        <span className="text-neutral-500">avg {avg}/3</span>
                      </li>
                    )
                  })}
                </ul>
                {orgResult.errors && orgResult.errors.length > 0 && (
                  <p className="mt-2 text-amber-700 dark:text-amber-300">
                    Failed: {orgResult.errors.map((e) => e.repo).join(", ")}
                  </p>
                )}
              </details>
            </div>
          )}
        </div>
      )}

      {!showOrgFlow && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => runRubric(repoUrl)}
            disabled={loading}
            className="min-h-[44px] w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
          >
            {loading ? "Running rubric analysis…" : "Run rubric analysis"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Average score
              </span>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {avgScore} / 3
              </p>
            </div>
            <div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Commit</span>
              <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                {result.commitSha.slice(0, 7)}
              </p>
            </div>
            <div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Run at</span>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {new Date(result.runAt).toLocaleString()}
              </p>
            </div>
            {hgViolations.length > 0 && (
              <div className="w-full">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Hard gate violation(s): {hgViolations.map((c) => c.id).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Criteria (0–3 each)
            </h3>
            <ul className="mt-2 space-y-2">
              {result.criteria.map((c) => (
                <RubricCriterionRow key={c.id} criterion={c} />
              ))}
            </ul>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Files scanned: {result.filesScanned.join(", ")}
          </p>
        </div>
      )}
    </section>
  )
}

function RubricCriterionRow({
  criterion,
}: {
  criterion: RubricAnalysis["criteria"][0]
}) {
  const [open, setOpen] = useState(false)
  const scoreColor =
    criterion.score === 3
      ? "text-emerald-600 dark:text-emerald-400"
      : criterion.score === 2
        ? "text-blue-600 dark:text-blue-400"
        : criterion.score === 1
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400"
  return (
    <li className="rounded-lg border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
      >
        <span className="font-medium text-neutral-900 dark:text-white">
          {criterion.id} — {criterion.title}
        </span>
        <span className={`font-semibold ${scoreColor}`}>
          {criterion.score}/3
          {criterion.hardGateViolation && (
            <span className="ml-1 rounded bg-red-100 px-1 text-xs text-red-700 dark:bg-red-900/50 dark:text-red-300">
              HG
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-700">
          {criterion.explanation && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {criterion.explanation}
            </p>
          )}
          {criterion.riskNote && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {criterion.riskNote}
            </p>
          )}
          {criterion.evidence.length > 0 && (
            <ul className="mt-1 space-y-1">
              {criterion.evidence.map((ev, i) => (
                <li key={i}>
                  <a
                    href={ev.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {ev.filePath}
                    {ev.lineStart != null ? ` L${ev.lineStart}` : ""}
                  </a>
                  {ev.snippet && (
                    <pre className="mt-0.5 overflow-x-auto rounded bg-neutral-100 p-1.5 text-xs dark:bg-neutral-800">
                      {ev.snippet}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}
