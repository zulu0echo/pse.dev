import Link from "next/link"
import { LogoutButton } from "./LogoutButton"

export default function MandateAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm [&>a]:py-2 [&>a]:touch-manipulation">
          <Link
            href="/crops/admin"
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Overview
          </Link>
          <Link
            href="/crops/admin/projects"
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Projects
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/crops"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ← Public dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
