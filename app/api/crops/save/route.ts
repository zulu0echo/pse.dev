import { NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import type { CropAnalysis } from "@/lib/crops-analyzer/types"

const CROPS_ANALYSES_PATH = path.join(process.cwd(), "data", "crops_analyses.json")
const MAX_ANALYSES = 200
const MAX_PAYLOAD_BYTES = 500_000 // 500KB per analysis
const RATE_LIMIT_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute per IP

const ipCounts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipCounts.get(ip)
  if (!entry) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (now > entry.resetAt) {
    entry.count = 1
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_REQUESTS
}

/**
 * POST /api/crops/save — append one analysis to data/crops_analyses.json.
 * Only when PUBLIC_ANALYSIS_PERSISTENCE=true AND FILE_WRITE_ENABLED=true.
 * Rate limited, max payload size, cap 200 stored analyses.
 */
export async function POST(request: Request) {
  const persistence = process.env.PUBLIC_ANALYSIS_PERSISTENCE === "true"
  const fileWrite = process.env.FILE_WRITE_ENABLED === "true"

  if (!persistence || !fileWrite) {
    return NextResponse.json(
      {
        error:
          "Server-side persistence is disabled. Set PUBLIC_ANALYSIS_PERSISTENCE=true and FILE_WRITE_ENABLED=true to enable.",
      },
      { status: 403 }
    )
  }

  const ip = getClientIp(request)
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    const raw = await request.text()
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: `Payload too large (max ${MAX_PAYLOAD_BYTES / 1024}KB)` },
        { status: 413 }
      )
    }
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const analysis = body as CropAnalysis
  if (
    !analysis.analysisId ||
    !analysis.repoUrl ||
    !analysis.commitSha ||
    !analysis.runAt ||
    !analysis.scores ||
    !Array.isArray(analysis.checks)
  ) {
    return NextResponse.json(
      { error: "Invalid analysis: missing analysisId, repoUrl, commitSha, runAt, scores, or checks" },
      { status: 400 }
    )
  }

  try {
    const dir = path.dirname(CROPS_ANALYSES_PATH)
    await mkdir(dir, { recursive: true })
  } catch (e) {
    console.error("mkdir data:", e)
    return NextResponse.json({ error: "Failed to ensure data directory" }, { status: 500 })
  }

  let list: CropAnalysis[] = []
  try {
    const raw = await readFile(CROPS_ANALYSES_PATH, "utf-8")
    const data = JSON.parse(raw) as { analyses?: CropAnalysis[] }
    list = Array.isArray(data.analyses) ? data.analyses : []
  } catch (e: unknown) {
    if (!(e && typeof e === "object" && "code" in e && (e as NodeJS.ErrnoException).code === "ENOENT")) {
      console.error("Read crops_analyses:", e)
      return NextResponse.json({ error: "Failed to read existing analyses" }, { status: 500 })
    }
  }

  list.unshift(analysis)
  if (list.length > MAX_ANALYSES) list = list.slice(0, MAX_ANALYSES)

  try {
    await writeFile(
      CROPS_ANALYSES_PATH,
      JSON.stringify({ analyses: list }, null, 2),
      "utf-8"
    )
    return NextResponse.json({ ok: true, analysisId: analysis.analysisId })
  } catch (e) {
    console.error("Write crops_analyses:", e)
    return NextResponse.json(
      { error: "Failed to write analyses file" },
      { status: 500 }
    )
  }
}
