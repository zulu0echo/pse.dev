import Link from "next/link"

export default function MandateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 dark:bg-amber-400 dark:text-amber-950">
        Work in progress
      </div>
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/crops"
            className="font-semibold text-neutral-900 dark:text-white"
          >
            CROPS
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:gap-x-5 [&>a]:py-2 [&>a]:touch-manipulation">
            <Link
              href="/crops"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/crops/projects"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Projects
            </Link>
            <Link
              href="/crops/methodology"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Methodology
            </Link>
            <Link
              href="/how-crops-are-you"
              className="rainbow-cta no-underline"
            >
              How CROPS are you?
            </Link>
            <Link
              href="/crops/admin"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
