import { NextResponse } from "next/server"
import { listOrgRepos } from "@/lib/crops-analyzer/github"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const org = searchParams.get("org")?.trim()
  if (!org) {
    return NextResponse.json(
      { error: "org query parameter is required (e.g. ?org=privacy-ethereum)" },
      { status: 400 }
    )
  }
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100)
  )
  try {
    const repos = await listOrgRepos(org, { perPage: limit, page: 1 })
    return NextResponse.json({
      org,
      repos: repos.map((r) => ({
        name: r.name,
        fullName: r.fullName,
        url: `https://github.com/${r.fullName}`,
      })),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list org repos"
    const is404 = message.includes("404") || message.includes("Not Found")
    const is403 = message.includes("403") || message.includes("Forbidden")
    if (is404) {
      return NextResponse.json(
        { error: "Organization not found. Set GITHUB_TOKEN for private orgs." },
        { status: 404 }
      )
    }
    if (is403) {
      return NextResponse.json(
        { error: "Access denied. Set GITHUB_TOKEN with access to the org." },
        { status: 403 }
      )
    }
    console.error("list-org-repos error:", e)
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 })
  }
}
