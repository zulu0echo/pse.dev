import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import { stateSchema } from "@/lib/mandate/schemas"
import type { MandateState } from "@/lib/mandate/schemas"
import type { RubricAnalysis } from "@/lib/crops-analyzer/rubric-types"

const STATE_PATH = path.join(process.cwd(), "data", "state.json")

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? ""
  if (!cookieHeader.includes("mandate_admin_session=")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (process.env.FILE_WRITE_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Server-side save is disabled. Set FILE_WRITE_ENABLED=true to persist rubric results." },
      { status: 403 }
    )
  }

  let body: { projectId?: string; repoUrl?: string; result?: RubricAnalysis }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const projectId = body.projectId?.trim()
  const repoUrl = body.repoUrl?.trim()
  const result = body.result
  if (!projectId || !repoUrl || !result?.criteria?.length) {
    return NextResponse.json(
      { error: "projectId, repoUrl, and result with criteria are required" },
      { status: 400 }
    )
  }

  const runAt = result.runAt ?? new Date().toISOString()
  const avg =
    result.criteria.reduce((s, c) => s + c.score, 0) / result.criteria.length
  const rubricCriteria = result.criteria.map((c) => ({
    id: c.id,
    title: c.title,
    score: c.score,
    explanation: c.explanation,
  }))

  let state: MandateState
  try {
    const raw = await readFile(STATE_PATH, "utf-8")
    state = stateSchema.parse(JSON.parse(raw))
  } catch (e) {
    console.error("save-rubric-result: load state", e)
    return NextResponse.json(
      { error: "Failed to load state" },
      { status: 500 }
    )
  }

  const scorecardIndex = state.scorecards.findIndex(
    (s) => s.projectId === projectId && s.isCurrent
  )
  if (scorecardIndex === -1) {
    return NextResponse.json(
      { error: "No current scorecard found for this project" },
      { status: 404 }
    )
  }

  state.scorecards[scorecardIndex] = {
    ...state.scorecards[scorecardIndex],
    rubricLastRunAt: runAt,
    rubricRepoUrl: repoUrl,
    rubricAverageScore: Math.round(avg * 10) / 10,
    rubricCriteria,
    lastUpdated: new Date().toISOString(),
  }

  try {
    await writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf-8")
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("save-rubric-result: write state", e)
    return NextResponse.json(
      { error: "Failed to write state" },
      { status: 500 }
    )
  }
}
