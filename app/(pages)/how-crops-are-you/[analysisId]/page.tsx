"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { CropAnalysis } from "@/lib/crops-analyzer/types"
import { DIMENSION_LABELS } from "@/lib/crops-analyzer/types"

const STORAGE_KEY = "crops_recent_analyses"

function loadFromLocal(analysisId: string): CropAnalysis | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const list = JSON.parse(raw) as CropAnalysis[]
    return list.find((a) => a.analysisId === analysisId) ?? null
  } catch {
    return null
  }
}

export default function HowCropsAreYouDetailPage({
  params,
}: {
  params: { analysisId: string }
}) {
  const analysisId = params.analysisId
  const [analysis, setAnalysis] = useState<CropAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState("")

  const loadAnalysis = useCallback(async () => {
    const fromLocal = loadFromLocal(analysisId)
    if (fromLocal) {
      setAnalysis(fromLocal)
      setLoading(false)
      return
    }
    try {
      const res = await fetch("/api/crops/analyses")
      if (res.ok) {
        const data = await res.json()
        const list = (data.analyses ?? []) as CropAnalysis[]
        const found = list.find((a) => a.analysisId === analysisId)
        if (found) {
          setAnalysis(found)
          setLoading(false)
          return
        }
      }
    } catch {}
    setAnalysis(null)
    setLoading(false)
  }, [analysisId])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const handlePaste = () => {
    setPasteError(null)
    try {
      const parsed = JSON.parse(pasteText) as CropAnalysis
      if (!parsed.analysisId || !parsed.scores || !Array.isArray(parsed.checks)) {
        setPasteError("Invalid analysis JSON: missing analysisId, scores, or checks")
        return
      }
      setAnalysis(parsed)
    } catch {
      setPasteError("Invalid JSON")
    }
  }

  const downloadJson = () => {
    if (!analysis) return
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `crops_analysis_${analysis.analysisId}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <p className="text-neutral-500">Loading…</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Link href="/how-crops-are-you" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to analyzer
        </Link>
        <h1 className="text-2xl font-bold">Analysis not found</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          This analysis is not in your browser storage or on the server. Paste or upload the analysis JSON below to view it.
        </p>
        <div>
          <label className="block text-sm font-medium">Paste analysis JSON</label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-800"
            placeholder='{"analysisId":"...","repoUrl":"...",...}'
          />
          {pasteError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{pasteError}</p>
          )}
          <button
            type="button"
            onClick={handlePaste}
            className="mt-2 rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Load from paste
          </button>
        </div>
      </div>
    )
  }

  const byDimension = { C: [] as CropAnalysis["checks"], O: [] as CropAnalysis["checks"], P: [] as CropAnalysis["checks"], S: [] as CropAnalysis["checks"] }
  for (const c of analysis.checks) {
    byDimension[c.dimension].push(c)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/how-crops-are-you" className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to analyzer
          </Link>
          <Link href="/how-crops-are-you/rubric" className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
            Assessment rubric
          </Link>
        </div>
        <button
          type="button"
          onClick={downloadJson}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          Download analysis JSON
        </button>
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          CROPS analysis
        </h1>
        <a
          href={analysis.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {analysis.repoUrl.replace(/^https:\/\/github\.com\//i, "")}
        </a>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {new Date(analysis.runAt).toLocaleString()} · commit {analysis.commitSha.slice(0, 7)}
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Summary
        </h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Overall</span>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {analysis.scores.overall}
            </p>
          </div>
          {(["C", "O", "P", "S"] as const).map((d) => (
            <div key={d} className="rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {d} — {DIMENSION_LABELS[d]}
              </span>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {analysis.scores[d]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Checks by dimension
        </h2>
        {(["C", "O", "P", "S"] as const).map((dim) => (
          <div
            key={dim}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
              {dim} — {DIMENSION_LABELS[dim]}
            </h3>
            <ul className="mt-4 space-y-4">
              {byDimension[dim].map((check) => (
                <CheckCard key={check.id} check={check} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Files scanned
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-600 dark:text-neutral-400">
          {analysis.filesScanned.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function CheckCard({ check }: { check: CropAnalysis["checks"][0] }) {
  const [open, setOpen] = useState(false)
  const statusColor =
    check.status === "pass"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      : check.status === "fail"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
  return (
    <li className="rounded-lg border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-neutral-900 dark:text-white">
          {check.name}
        </span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
            {check.status}
          </span>
          <span className="text-sm text-neutral-500">
            {check.pointsAwarded}/{check.maxPoints}
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {check.description}
          </p>
          {check.evidence.length > 0 && (
            <ul className="mt-2 space-y-2">
              {check.evidence.map((ev, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={ev.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {ev.filePath}
                    {ev.lineStart != null ? ` L${ev.lineStart}` : ""}
                  </a>
                  {ev.snippet && (
                    <pre className="mt-1 overflow-x-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
                      {ev.snippet}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
          {check.status === "unknown" && check.evidence.length === 0 && (
            <p className="mt-1 text-xs italic text-neutral-500">
              No evidence found — unknown
            </p>
          )}
        </div>
      )}
    </li>
  )
}
