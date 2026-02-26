import { NextResponse } from "next/server"
import { parseRepoUrl, getRepoAndCommit, fetchTargetFiles } from "@/lib/crops-analyzer/github"
import { runRubric } from "@/lib/crops-analyzer/rubric-scoring"
import type { RubricAnalysis } from "@/lib/crops-analyzer/rubric-types"

const MAX_PAYLOAD_BYTES = 50_000

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  let body: { repoUrl?: string; ref?: string }
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

  try {
    const { commitSha } = await getRepoAndCommit(owner, repo, ref)
    const files = await fetchTargetFiles(owner, repo, commitSha)

    const ctx = { owner, repo, ref: commitSha, files }
    const criteria = runRubric(ctx)

    const result: RubricAnalysis = {
      repoUrl: `https://github.com/${owner}/${repo}`,
      ref: ref || undefined,
      commitSha,
      runAt: new Date().toISOString(),
      criteria,
      filesScanned: Array.from(files.keys()),
    }

    return NextResponse.json(result)
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
        { error: "Access denied (e.g. private repo). Set GITHUB_TOKEN with access." },
        { status: 403 }
      )
    }
    console.error("CROPS rubric analyze error:", e)
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 })
  }
}
