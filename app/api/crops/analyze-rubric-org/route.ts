import { NextResponse } from "next/server"
import {
  listOrgRepos,
  getRepoAndCommit,
  fetchTargetFiles,
} from "@/lib/crops-analyzer/github"
import { runRubric } from "@/lib/crops-analyzer/rubric-scoring"
import type { RubricAnalysis } from "@/lib/crops-analyzer/rubric-types"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  let body: { org?: string; limit?: number }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const org = body.org?.trim()
  if (!org) {
    return NextResponse.json(
      { error: "org is required (e.g. privacy-ethereum or ethereum)" },
      { status: 400 }
    )
  }

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, typeof body.limit === "number" ? body.limit : DEFAULT_LIMIT)
  )

  try {
    const repos = await listOrgRepos(org, {
      perPage: Math.min(100, Math.max(limit, 1)),
      page: 1,
    })
    const toRun = repos.slice(0, limit)
    const results: RubricAnalysis[] = []
    const errors: { repo: string; error: string }[] = []

    for (const { name, fullName } of toRun) {
      const [owner, repo] = fullName.split("/")
      if (!owner || !repo) continue
      try {
        const { commitSha } = await getRepoAndCommit(owner, repo)
        const files = await fetchTargetFiles(owner, repo, commitSha)
        const criteria = runRubric({ owner, repo, ref: commitSha, files })
        results.push({
          repoUrl: `https://github.com/${owner}/${repo}`,
          commitSha,
          runAt: new Date().toISOString(),
          criteria,
          filesScanned: Array.from(files.keys()),
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        errors.push({ repo: fullName, error: message.slice(0, 200) })
      }
    }

    // Aggregated score: average of (per-repo average criterion score) across all analyzed repos. Scale 0–3.
    const perRepoAverages =
      results.length > 0
        ? results.map((r) => {
            const sum = r.criteria.reduce((s, c) => s + c.score, 0)
            return r.criteria.length > 0 ? sum / r.criteria.length : 0
          })
        : []
    const aggregatedScore =
      perRepoAverages.length > 0
        ? Math.round(
            (perRepoAverages.reduce((a, b) => a + b, 0) / perRepoAverages.length) * 10
          ) / 10
        : null
    const perCriterionAvg: Record<string, number> = {}
    if (results.length > 0) {
      const criterionIds = new Set(results.flatMap((r) => r.criteria.map((c) => c.id)))
      for (const id of criterionIds) {
        const scores = results.flatMap((r) =>
          r.criteria.filter((c) => c.id === id).map((c) => c.score)
        )
        if (scores.length) {
          const sum = scores.reduce<number>((a, b) => a + b, 0)
          perCriterionAvg[id] = Math.round((sum / scores.length) * 10) / 10
        }
      }
    }

    return NextResponse.json({
      org,
      limit,
      totalRepos: repos.length,
      analyzed: results.length,
      failed: errors.length,
      aggregatedScore,
      perCriterionAvg: Object.keys(perCriterionAvg).length > 0 ? perCriterionAvg : undefined,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list or analyze org repos"
    const is404 = message.includes("404") || message.includes("Not Found")
    const is403 = message.includes("403") || message.includes("Forbidden")
    if (is404) {
      return NextResponse.json(
        { error: "Organization not found or invalid. Set GITHUB_TOKEN for private orgs." },
        { status: 404 }
      )
    }
    if (is403) {
      return NextResponse.json(
        { error: "Access denied. Set GITHUB_TOKEN with access to the org." },
        { status: 403 }
      )
    }
    console.error("CROPS analyze-rubric-org error:", e)
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 })
  }
}
