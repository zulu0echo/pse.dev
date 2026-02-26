import { NextResponse } from "next/server"
import { parseRepoUrl, getRepoAndCommit, fetchTargetFiles } from "@/lib/crops-analyzer/github"
import { runAllChecks, scoresFromChecks } from "@/lib/crops-analyzer/scoring"
import type { CropAnalysis } from "@/lib/crops-analyzer/types"

const MAX_PAYLOAD_BYTES = 50_000

function generateAnalysisId(repo: string, commitSha: string): string {
  const slug = repo.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 30)
  const short = commitSha.slice(0, 7)
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${slug}-${short}-${rnd}`
}

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  let body: { repoUrl?: string; ref?: string; deepScan?: boolean }
  try {
    const raw = await request.text()
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }
    body = JSON.parse(raw) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const repoUrl = body.repoUrl?.trim()
  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 })
  }

  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub repo URL. Use https://github.com/<org>/<repo>" },
      { status: 400 }
    )
  }

  const { owner, repo } = parsed
  const ref = body.ref?.trim() || undefined
  const deepScan = body.deepScan === true

  try {
    const { commitSha } = await getRepoAndCommit(owner, repo, ref)
    const files = await fetchTargetFiles(owner, repo, commitSha)

    const ctx = { owner, repo, ref: commitSha, files }
    const checks = runAllChecks(ctx)
    const scores = scoresFromChecks(checks)

    const analysisId = generateAnalysisId(repo, commitSha)
    const runAt = new Date().toISOString()

    const analysis: CropAnalysis = {
      analysisId,
      repoUrl: `https://github.com/${owner}/${repo}`,
      ref: ref || undefined,
      commitSha,
      runAt,
      scores,
      checks,
      filesScanned: Array.from(files.keys()),
      deepScan: deepScan || undefined,
    }

    return NextResponse.json(analysis)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed"
    const is404 = message.includes("404") || message.includes("Not Found")
    const is403 = message.includes("403") || message.includes("Forbidden")
    if (is404) {
      return NextResponse.json(
        { error: "Repository not found or ref invalid. For private repos, set GITHUB_TOKEN with access." },
        { status: 404 }
      )
    }
    if (is403) {
      return NextResponse.json(
        { error: "Access denied (e.g. private repo). Set GITHUB_TOKEN with access to analyze private repos." },
        { status: 403 }
      )
    }
    console.error("CROPS analyze error:", e)
    return NextResponse.json(
      { error: message.slice(0, 500) },
      { status: 500 }
    )
  }
}
