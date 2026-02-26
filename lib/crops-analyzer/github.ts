/**
 * GitHub API helpers for CROPS analyzer. Works with public repos without token;
 * use GITHUB_TOKEN for higher rate limits and private repo access.
 */

export { parseRepoUrl, parseOrgSlug } from "./parse-github-url"

const GITHUB_API = "https://api.github.com"
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024 // 50MB
const MAX_FILES_DEEP = 10_000
const REQUEST_TIMEOUT_MS = 30_000

export interface RepoInfo {
  owner: string
  repo: string
  defaultBranch: string
}

export interface FileContent {
  path: string
  content: string
  sha: string
}

function getAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "PSE-CROPS-Analyzer",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(), ...options?.headers },
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GitHub API ${res.status}: ${text.slice(0, 500)}`)
    }
    return (await res.json()) as T
  } catch (e) {
    clearTimeout(timeout)
    throw e
  }
}

/**
 * List public repos for a GitHub org (supports pagination).
 * Requires GITHUB_TOKEN for orgs with many repos; without token, only first page (30 repos) is available.
 */
export async function listOrgRepos(
  org: string,
  options?: { perPage?: number; page?: number }
): Promise<{ name: string; fullName: string }[]> {
  const perPage = Math.min(100, Math.max(1, options?.perPage ?? 100))
  const page = options?.page ?? 1
  const res = await fetchJson<{ name: string; full_name: string }[]>(
    `${GITHUB_API}/orgs/${encodeURIComponent(org)}/repos?per_page=${perPage}&page=${page}&sort=full_name&type=all`
  )
  return Array.isArray(res)
    ? res.map((r) => ({ name: r.name, fullName: r.full_name }))
    : []
}

/**
 * Get repo info and resolve ref to commit SHA.
 */
export async function getRepoAndCommit(
  owner: string,
  repo: string,
  ref?: string
): Promise<{ defaultBranch: string; commitSha: string }> {
  const repoRes = await fetchJson<{ default_branch: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}`
  )
  const branch = ref || repoRes.default_branch

  const commitRes = await fetchJson<{ sha: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`
  )
  return { defaultBranch: repoRes.default_branch, commitSha: commitRes.sha }
}

/**
 * Fetch a single file content. Returns null if 404 or not a file.
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<FileContent | null> {
  try {
    const res = await fetchJson<{ content?: string; encoding?: string; sha?: string }>(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`
    )
    if (!res.content || res.encoding !== "base64") return null
    const content = Buffer.from(res.content, "base64").toString("utf-8")
    return { path, content, sha: res.sha ?? "" }
  } catch {
    return null
  }
}

/**
 * List directory contents (path names only, one level).
 */
export async function listDir(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string[]> {
  try {
    const res = await fetchJson<{ type: string; name: string }[]>(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`
    )
    return Array.isArray(res) ? res.map((e) => e.name) : []
  } catch {
    return []
  }
}

/**
 * Build GitHub blob URL for a file at a given ref (commit SHA).
 */
export function blobUrl(owner: string, repo: string, path: string, ref: string): string {
  return `https://github.com/${owner}/${repo}/blob/${ref}/${path}`
}

/**
 * Build GitHub blob URL with line anchor.
 */
export function blobUrlWithLines(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  lineStart: number,
  lineEnd?: number
): string {
  const anchor = lineEnd && lineEnd !== lineStart ? `#L${lineStart}-L${lineEnd}` : `#L${lineStart}`
  return `https://github.com/${owner}/${repo}/blob/${ref}/${path}${anchor}`
}

/**
 * Target files to fetch first (CROPS evidence).
 */
export const TARGET_FILES = [
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "GOVERNANCE.md",
  "CHANGELOG.md",
  "package.json",
  "package-lock.json",
  "Cargo.toml",
  "Cargo.lock",
  "go.mod",
  "go.sum",
  "pyproject.toml",
]

export const TARGET_DIRS = [
  "docs",
  "spec",
  "specs",
  "design",
  "adr",
  "architecture",
  "audits",
  "threat-model",
  "threat_model",
  ".github/workflows",
]

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const fetchCache = new Map<string, { at: number; data: Map<string, FileContent> }>()

function cacheKey(owner: string, repo: string, ref: string): string {
  return `${owner}/${repo}/${ref}`
}

/**
 * Fetch target files and optional dir contents. Does not download full archive.
 * Results are cached in memory for 5 minutes to avoid re-fetching on repeated runs.
 */
export async function fetchTargetFiles(
  owner: string,
  repo: string,
  ref: string
): Promise<Map<string, FileContent>> {
  const key = cacheKey(owner, repo, ref)
  const hit = fetchCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data

  const out = new Map<string, FileContent>()
  for (const path of TARGET_FILES) {
    const file = await getFileContent(owner, repo, path, ref)
    if (file) out.set(path, file)
  }
  for (const dir of TARGET_DIRS) {
    const names = await listDir(owner, repo, dir, ref)
    for (const name of names) {
      const fullPath = `${dir}/${name}`
      const file = await getFileContent(owner, repo, fullPath, ref)
      if (file) out.set(fullPath, file)
    }
  }
  fetchCache.set(key, { at: Date.now(), data: out })
  return out
}
