"use client"

import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  async function handleLogout() {
    await fetch("/api/crops-admin/logout", { method: "POST" })
    router.push("/crops/admin/login")
    router.refresh()
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
    >
      Logout
    </button>
  )
}
