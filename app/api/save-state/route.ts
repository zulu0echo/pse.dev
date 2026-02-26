import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { stateSchema } from "@/lib/mandate/schemas"

const STATE_PATH = path.join(process.cwd(), "data", "state.json")

export async function POST(request: Request) {
  const fileWriteEnabled = process.env.FILE_WRITE_ENABLED === "true"
  if (!fileWriteEnabled) {
    return NextResponse.json(
      { error: "Server-side save is disabled. Export state.json and commit manually." },
      { status: 403 }
    )
  }

  // Auth: cookie set by admin login (we'll add middleware later)
  const cookieHeader = request.headers.get("cookie") ?? ""
  if (!cookieHeader.includes("mandate_admin_session=")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = stateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid state payload", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await writeFile(STATE_PATH, JSON.stringify(parsed.data, null, 2), "utf-8")
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Failed to write state:", e)
    return NextResponse.json(
      { error: "Failed to write state file" },
      { status: 500 }
    )
  }
}
