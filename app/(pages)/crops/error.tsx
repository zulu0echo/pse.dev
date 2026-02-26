"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function MandateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Mandate section error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-center text-neutral-600 dark:text-neutral-400">
        The CROPS dashboard couldn’t load. This is often due to missing or
        invalid data files (<code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">data/criteria.json</code>,{" "}
        <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">data/state.json</code>).
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          href="/crops"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Back to CROPS Dashboard
        </Link>
      </div>
    </div>
  )
}
