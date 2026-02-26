import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE = "mandate_admin_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: Request) {
  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD
  if (!user || !pass) {
    return NextResponse.json(
      { error: "Admin auth not configured" },
      { status: 503 }
    )
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (body.username === user && body.password === pass) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}
