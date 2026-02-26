"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { MandateState, Project, Scorecard } from "@/lib/mandate/schemas"

export default function MandateAdminProjectsPage() {
  const [state, setState] = useState<MandateState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((data: MandateState) => setState(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-neutral-500">Loading…</p>
  if (!state) return <p className="text-red-500">Failed to load state.</p>

  const currentByProject = new Map<string, Scorecard>(
    state.scorecards
      .filter((s) => s.isCurrent)
      .map((s) => [s.projectId, s])
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>
      <Link
        href="/crops/admin/projects/new"
        className="inline-block rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Add project
      </Link>
      <ul className="space-y-2">
        {state.projects.map((p: Project) => {
          const sc = currentByProject.get(p.id)
          return (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-sm text-neutral-500">
                  {p.ownerTeam} · {p.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/crops/admin/projects/${p.id}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Edit
                </Link>
                {sc && (
                  <Link
                    href={`/crops/admin/scorecards/${sc.id}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Scorecard
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
