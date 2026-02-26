import Link from "next/link"

export default function MandateNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        This CROPS page doesn’t exist or couldn’t be loaded.
      </p>
      <Link
        href="/crops"
        className="rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Back to CROPS Dashboard
      </Link>
    </div>
  )
}
