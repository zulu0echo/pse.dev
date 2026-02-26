#!/usr/bin/env node
/**
 * Run CROPS rubric assessment for every repo in a GitHub org.
 * Requires the dev server (or deployed app) to be running so the API is available.
 *
 * Usage:
 *   node scripts/run-rubric-org.js <org> [limit]
 *   BASE_URL=http://localhost:3000 node scripts/run-rubric-org.js privacy-ethereum 20
 *
 * Examples:
 *   node scripts/run-rubric-org.js privacy-ethereum     # up to 50 repos (default)
 *   node scripts/run-rubric-org.js ethereum 100         # up to 100 repos
 *
 * Set GITHUB_TOKEN in the environment where the Next.js server runs (not here)
 * for higher rate limits and private org access.
 */
const org = process.argv[2]
const limit = process.argv[3] ? parseInt(process.argv[3], 10) : 50
const baseUrl = process.env.BASE_URL || "http://localhost:3000"

if (!org) {
  console.error("Usage: node scripts/run-rubric-org.js <org> [limit]")
  console.error("Example: node scripts/run-rubric-org.js privacy-ethereum 20")
  process.exit(1)
}

async function main() {
  const url = `${baseUrl}/api/crops/analyze-rubric-org`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org, limit }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("Error:", data.error || res.statusText)
    process.exit(1)
  }
  console.log(JSON.stringify(data, null, 2))
  if (data.errors?.length) {
    console.error("\nRepos that failed:", data.errors.length)
    data.errors.forEach((e) => console.error("  -", e.repo, e.error))
  }
}

main()
