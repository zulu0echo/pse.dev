"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { CropAnalysis } from "@/lib/crops-analyzer/types"

const STORAGE_KEY = "crops_recent_analyses"
const MAX_LOCAL = 50

function loadLocalAnalyses(): CropAnalysis[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CropAnalysis[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalAnalyses(list: CropAnalysis[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_LOCAL)))
  } catch {}
}

function HowCropsAreYouContent() {
  const searchParams = useSearchParams()
  const repoParam = searchParams.get("repo") ?? ""
  const [repoUrl, setRepoUrl] = useState("")
  const [ref, setRef] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deepScan, setDeepScan] = useState(true)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recentLocal, setRecentLocal] = useState<CropAnalysis[]>([])
  const [recentGlobal, setRecentGlobal] = useState<CropAnalysis[] | null>(null)
  const [persistenceEnabled, setPersistenceEnabled] = useState(false)

  const STAGES: { label: string; target: number }[] = [
    { label: "Connecting to GitHub…", target: 15 },
    { label: "Fetching repository files…", target: 35 },
    { label: "Running CROPS checks…", target: 60 },
    { label: "Scoring evidence…", target: 85 },
    { label: "Finalizing…", target: 90 },
  ]
  const PROGRESS_CAP = 90
  const PROGRESS_INTERVAL_MS = 800

  const loadRecent = useCallback(() => {
    setRecentLocal(loadLocalAnalyses())
  }, [])

  useEffect(() => {
    loadRecent()
  }, [loadRecent])

  useEffect(() => {
    if (repoParam && !repoUrl) setRepoUrl(decodeURIComponent(repoParam))
  }, [repoParam, repoUrl])

  useEffect(() => {
    fetch("/api/crops/analyses")
      .then((r) => {
        if (r.ok) {
          setPersistenceEnabled(true)
          return r.json()
        }
        setPersistenceEnabled(false)
        return null
      })
      .then((data) => {
        if (data?.analyses) setRecentGlobal(data.analyses)
      })
      .catch(() => setPersistenceEnabled(false))
  }, [])

  const runAnalysis = async () => {
    const url = repoUrl.trim()
    if (!url) {
      setError("Enter a GitHub repo URL")
      return
    }
    setError(null)
    setLoading(true)
    setProgress(0)
    setStatusMessage("Starting…")

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 4, PROGRESS_CAP)
        const stage = STAGES.find((s) => s.target >= next) ?? STAGES[STAGES.length - 1]
        setStatusMessage(stage.label)
        return next
      })
    }, PROGRESS_INTERVAL_MS)

    try {
      const res = await fetch("/api/crops/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: url,
          ref: ref.trim() || undefined,
          deepScan,
        }),
      })
      clearInterval(progressTimer)
      setProgress(100)
      setStatusMessage("Complete")

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Analysis failed")
        setLoading(false)
        setProgress(0)
        setStatusMessage("")
        return
      }
      const analysis = data as CropAnalysis
      setRecentLocal((prev) => {
        const nextList = [analysis, ...prev.slice(0, MAX_LOCAL - 1)]
        saveLocalAnalyses(nextList)
        return nextList
      })
      if (persistenceEnabled) {
        await fetch("/api/crops/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analysis),
        })
      }
      window.location.href = `/how-crops-are-you/${analysis.analysisId}`
    } catch (e) {
      clearInterval(progressTimer)
      setError(e instanceof Error ? e.message : "Request failed")
      setLoading(false)
      setProgress(0)
      setStatusMessage("")
    }
  }

  const downloadCombined = () => {
    const list = recentLocal
    const blob = new Blob([JSON.stringify({ analyses: list }, null, 2)], {
      type: "application/json",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "crops_analyses.json"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const recentList = persistenceEnabled && recentGlobal && recentGlobal.length > 0 ? recentGlobal : recentLocal
  const isGlobalList = persistenceEnabled && recentGlobal && recentGlobal.length > 0

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/crops"
          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← CROPS
        </Link>
        <Link
          href="/how-crops-are-you/rubric"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Assessment rubric
        </Link>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          How CROPS are you?
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Run a CROPS analysis on any public GitHub repository. Scores are evidence-based and derived from code &amp; docs available in the repo. <strong>Unknown</strong> means we couldn&apos;t find evidence either way.
        </p>
        <p className="mt-2">
          <Link
            href="/how-crops-are-you/rubric"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View the full repo-assessment rubric (how we conduct the analysis) →
          </Link>
        </p>
      </header>

      <div
        role="status"
        className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 dark:border-amber-500 dark:bg-amber-950/30"
        aria-label="Experimental disclaimer"
      >
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Experimental
        </p>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
          This tool is an experimental project. Analysis and scores may change as we refine the methodology. Use the results as a starting point, not as an official assessment.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Analyze a repo
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              GitHub repo URL <span className="text-red-500">*</span>
            </label>
            <input
              id="repo-url"
              type="url"
              placeholder="https://github.com/ethereum/solidity"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {showAdvanced ? "Hide" : "Show"} advanced options
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-2">
                <div>
                  <label htmlFor="ref" className="block text-sm text-neutral-600 dark:text-neutral-400">
                    Branch or commit SHA (optional)
                  </label>
                  <input
                    id="ref"
                    type="text"
                    placeholder="main"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={deepScan}
                    onChange={(e) => setDeepScan(e.target.checked)}
                  />
                  Include docs deep scan
                </label>
              </div>
            )}
          </div>
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Analyzing…" : "Run CROPS analysis"}
          </button>
          {loading && (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {statusMessage}
                </span>
                <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                  {progress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out dark:bg-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                This usually takes 5–15 seconds. Do not close the page.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isGlobalList ? "Global recent analyses" : "Your recent analyses (in your browser)"}
          </h2>
          {!isGlobalList && recentLocal.length > 0 && (
            <button
              type="button"
              onClick={downloadCombined}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Download combined crops_analyses.json
            </button>
          )}
        </div>
        {recentList.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            No analyses yet. Run one above to see results here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentList.map((a) => (
              <li
                key={a.analysisId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 py-3 px-4 dark:border-neutral-700"
              >
                <div className="min-w-0">
                  <a
                    href={a.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-neutral-900 hover:underline dark:text-white"
                  >
                    {a.repoUrl.replace(/^https:\/\/github\.com\//i, "")}
                  </a>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(a.runAt).toLocaleString()} · {a.commitSha.slice(0, 7)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-sm font-medium dark:bg-neutral-800">
                    Overall {a.scores.overall}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    C{a.scores.C} O{a.scores.O} P{a.scores.P} S{a.scores.S}
                  </span>
                  <Link
                    href={`/how-crops-are-you/${a.analysisId}`}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function HowCropsAreYouPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl space-y-8 py-8 animate-pulse text-neutral-400">Loading…</div>}>
      <HowCropsAreYouContent />
    </Suspense>
  )
}
