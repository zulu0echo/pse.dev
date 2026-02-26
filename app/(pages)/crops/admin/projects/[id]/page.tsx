"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { MandateState, Project, Scorecard } from "@/lib/mandate/schemas"

const PROJECT_STATUSES = ["proposed", "active", "sunset", "completed"] as const

export default function MandateAdminProjectEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === "new"
  const [state, setState] = useState<MandateState | null>(null)
  const [project, setProject] = useState<Partial<Project>>(
    isNew
      ? {
          id: "",
          name: "",
          shortDescription: "",
          ownerTeam: "",
          tags: [],
          status: "active",
        }
      : {}
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((data: MandateState) => {
        setState(data)
        if (!isNew) {
          const p = data.projects.find((x) => x.id === id)
          if (p) setProject(p)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, isNew])

  const saveProject = useCallback(async () => {
    if (!state || !project.name || !project.shortDescription || !project.ownerTeam)
      return
    setSaving(true)
    const newId =
      project.id ||
      "pse-" + project.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const updated: Project = {
      id: newId,
      name: project.name,
      shortDescription: project.shortDescription,
      ownerTeam: project.ownerTeam,
      tags: project.tags ?? [],
      status: (project.status as Project["status"]) ?? "active",
      githubRepoUrl: project.githubRepoUrl ?? undefined,
    }
    const newProjects = isNew
      ? [...state.projects, updated]
      : state.projects.map((p) => (p.id === id ? updated : p))
    const newState: MandateState = {
      ...state,
      projects: newProjects,
    }
    try {
      const res = await fetch("/api/save-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      })
      if (res.ok && isNew) {
        router.push(`/crops/admin/projects/${newId}`)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setState(newState)
    setSaving(false)
  }, [state, project, id, isNew, router])

  const addScorecard = useCallback(async () => {
    if (!state || !project.id) return
    const periodLabel = "2026 Q1" // could be a form input
    const scId = `sc-${periodLabel.replace(/\s/g, "").toLowerCase()}-${project.id}`
    const template = state.scorecards[0]
    const tier1Criteria: Scorecard["tier1"]["criteria"] = {}
    const tier2Criteria: Scorecard["tier2"]["criteria"] = {}
    const tier3Criteria: Scorecard["tier3"]["criteria"] = {}
    if (template) {
      Object.keys(template.tier1.criteria).forEach((k) => {
        tier1Criteria[k] = { status: "unknown" as const, notes: "", evidenceLinks: [] }
      })
      Object.keys(template.tier2.criteria).forEach((k) => {
        tier2Criteria[k] = { score: 0, notes: "", evidenceLinks: [] }
      })
      Object.keys(template.tier3.criteria).forEach((k) => {
        tier3Criteria[k] = { score: 0, notes: "", evidenceLinks: [] }
      })
    } else {
      const crit = await fetch("/api/criteria").then((r) => r.json())
      crit.criteria.filter((c: { tier: number }) => c.tier === 1).forEach((c: { key: string }) => {
        tier1Criteria[c.key] = { status: "unknown", notes: "", evidenceLinks: [] }
      })
      crit.criteria.filter((c: { tier: number }) => c.tier === 2).forEach((c: { key: string }) => {
        tier2Criteria[c.key] = { score: 0, notes: "", evidenceLinks: [] }
      })
      crit.criteria.filter((c: { tier: number }) => c.tier === 3).forEach((c: { key: string }) => {
        tier3Criteria[c.key] = { score: 0, notes: "", evidenceLinks: [] }
      })
    }
    const newSc: Scorecard = {
      id: scId,
      projectId: project.id,
      periodLabel,
      isCurrent: true,
      tier1: {
        overallStatus: "needs_review",
        override: { enabled: false, status: "pass", reason: "" },
        criteria: tier1Criteria,
      },
      tier2: { rollup: 0, criteria: tier2Criteria },
      tier3: { rollup: 0, criteria: tier3Criteria },
      summary: "",
      risks: "",
      evidenceLinks: [],
      lastUpdated: new Date().toISOString(),
    }
    const newScorecards = state.scorecards.map((s) =>
      s.projectId === project.id ? { ...s, isCurrent: false } : s
    )
    newScorecards.push(newSc)
    setState({ ...state, scorecards: newScorecards })
    router.push(`/crops/admin/scorecards/${newSc.id}`)
  }, [state, project.id, router])

  if (loading) return <p className="text-neutral-500">Loading…</p>
  if (!isNew && !project.id) return <p className="text-red-500">Project not found.</p>

  const scorecards = state?.scorecards.filter((s) => s.projectId === (project.id || id)) ?? []

  return (
    <div className="space-y-6">
      <Link href="/crops/admin/projects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Projects
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? "New project" : "Edit project"}</h1>
      <div className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={project.name ?? ""}
            onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Short description</label>
          <input
            value={project.shortDescription ?? ""}
            onChange={(e) => setProject((p) => ({ ...p, shortDescription: e.target.value }))}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Owner team</label>
          <input
            value={project.ownerTeam ?? ""}
            onChange={(e) => setProject((p) => ({ ...p, ownerTeam: e.target.value }))}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={project.status ?? "active"}
            onChange={(e) => setProject((p) => ({ ...p, status: e.target.value as Project["status"] }))}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">GitHub repo URL</label>
          <input
            value={project.githubRepoUrl ?? ""}
            onChange={(e) => setProject((p) => ({ ...p, githubRepoUrl: e.target.value || undefined }))}
            placeholder="https://github.com/org/repo"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800"
          />
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Optional. Link this PSE project to a repo for CROPS analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={saveProject}
          disabled={saving}
          className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {!isNew && project.id && (project.githubRepoUrl || project.name) && (
        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">GitHub CROPS analyzer</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Run the public CROPS repo analyzer on this project&apos;s repo. Visitor-added analyses are separate from PSE scorecards.
          </p>
          <Link
            href={`/how-crops-are-you${project.githubRepoUrl ? `?repo=${encodeURIComponent(project.githubRepoUrl)}` : ""}`}
            className="mt-2 inline-block rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            {project.githubRepoUrl ? "Run CROPS analysis for this repo" : "Open analyzer (add repo URL above to pre-fill)"}
          </Link>
        </section>
      )}
      {!isNew && project.id && (
        <section>
          <h2 className="text-lg font-semibold">Scorecards</h2>
          <ul className="mt-2 space-y-1">
            {scorecards.map((sc) => (
              <li key={sc.id} className="flex items-center gap-2">
                <span>{sc.periodLabel}</span>
                {sc.isCurrent && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs dark:bg-emerald-900/40">
                    current
                  </span>
                )}
                <Link
                  href={`/crops/admin/scorecards/${sc.id}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addScorecard}
            className="mt-2 rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            Add scorecard
          </button>
        </section>
      )}
    </div>
  )
}
