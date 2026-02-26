import { NextResponse } from "next/server"
import { loadCriteria } from "@/lib/mandate/data-loader"

export async function GET() {
  try {
    const criteria = await loadCriteria()
    return NextResponse.json(criteria)
  } catch (e) {
    console.error("Failed to load criteria:", e)
    return NextResponse.json(
      { error: "Failed to load criteria" },
      { status: 500 }
    )
  }
}
