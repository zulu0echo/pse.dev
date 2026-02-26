import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const CROPS_ANALYSES_PATH = path.join(process.cwd(), "data", "crops_analyses.json")

/**
 * GET /api/crops/analyses — returns global recent analyses only when Mode B is enabled.
 * Otherwise 404 so the frontend uses localStorage.
 */
export async function GET() {
  const persistence =
    process.env.PUBLIC_ANALYSIS_PERSISTENCE === "true" &&
    process.env.FILE_WRITE_ENABLED === "true"

  if (!persistence) {
    return NextResponse.json(
      { error: "Global analyses are not persisted. Use local (browser) storage." },
      { status: 404 }
    )
  }

  try {
    const raw = await readFile(CROPS_ANALYSES_PATH, "utf-8")
    const data = JSON.parse(raw) as { analyses: unknown[] }
    const list = Array.isArray(data.analyses) ? data.analyses : []
    return NextResponse.json({ analyses: list })
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ analyses: [] })
    }
    console.error("Read crops_analyses:", e)
    return NextResponse.json(
      { error: "Failed to read analyses" },
      { status: 500 }
    )
  }
}
