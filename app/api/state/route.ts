import { NextResponse } from "next/server"
import { loadState } from "@/lib/mandate/data-loader"

export async function GET() {
  try {
    const state = await loadState()
    return NextResponse.json(state)
  } catch (e) {
    console.error("Failed to load state:", e)
    return NextResponse.json(
      { error: "Failed to load state" },
      { status: 500 }
    )
  }
}
