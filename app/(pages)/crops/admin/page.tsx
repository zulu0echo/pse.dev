import Link from "next/link"
import { loadState } from "@/lib/mandate/data-loader"
import type { Scorecard } from "@/lib/mandate/schemas"

export const dynamic = "force-dynamic"

export default async function MandateAdminOverviewPage() {
  const state = await loadState()
  const currentScorecards = state.scorecards.filter((s: Scorecard) => s.isCurrent)
  const lastUpdated =
    state.scorecards.length > 0
      ? state.scorecards.reduce((a: string, s: Scorecard) =>
          s.lastUpdated > a ? s.lastUpdated : a
        , state.scorecards[0].lastUpdated)
      : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Projects
          </div>
          <div className="text-2xl font-semibold">{state.projects.length}</div>
          <Link
            href="/crops/admin/projects"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Manage projects →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Current scorecards
          </div>
          <div className="text-2xl font-semibold">{currentScorecards.length}</div>
          {lastUpdated && (
            <p className="mt-1 text-sm text-neutral-500">
              Last updated {new Date(lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Quick links</h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            <Link
              href="/crops/admin/projects"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Projects — add, edit, delete projects; create or edit scorecards
            </Link>
          </li>
          <li>
            <Link
              href="/crops"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Public dashboard — view landing and project list
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
