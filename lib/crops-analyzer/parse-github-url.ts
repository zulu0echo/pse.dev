/**
 * Client-safe GitHub URL parsing (no Node/API). Used by UI and API.
 */

/**
 * Parse GitHub repo URL or "owner/repo" to owner/repo.
 * Accepts: full URL (with /tree/, /blob/, .git, query string), or "owner/repo".
 * Returns null if only one path segment (org only) or invalid.
 */
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  const trimmed = repoUrl.trim()
  const withoutQuery = trimmed.replace(/#.*$/, "").replace(/\?.*$/, "")
  const urlMatch = withoutQuery.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/i
  )
  if (urlMatch) {
    const owner = urlMatch[1]
    const repo = urlMatch[2]
    if (repo && repo !== "repositories" && repo !== "organizations") return { owner, repo }
  }
  const simple = trimmed.match(/^([^/]+)\/([^/]+)$/)
  if (simple) return { owner: simple[1], repo: simple[2] }
  return null
}

/**
 * Extract org name from URL or string (e.g. "https://github.com/privacy-ethereum" or "privacy-ethereum").
 */
export function parseOrgSlug(input: string): string | null {
  const trimmed = input.trim()
  const fromUrl = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/?$/i)
  if (fromUrl) return fromUrl[1]
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && !trimmed.includes("/")) return trimmed
  return null
}
