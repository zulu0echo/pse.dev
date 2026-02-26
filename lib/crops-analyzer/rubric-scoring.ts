/**
 * Repo-assessment rubric scoring (0–3 scale). Uses same GitHub file fetch as CROPS analyzer.
 * Applies the rubric criteria A1–F3 with evidence from repo artifacts.
 */

import { blobUrl, blobUrlWithLines } from "./github"
import type { FileContent } from "./github"
import type { EvidenceItem } from "./types"
import type { RubricCriterionId, RubricCriterionResult } from "./rubric-types"
import { RUBRIC_CRITERION_LABELS } from "./rubric-types"

export interface RubricScoringContext {
  owner: string
  repo: string
  ref: string
  files: Map<string, FileContent>
}

function ev(
  ctx: RubricScoringContext,
  path: string,
  snippet?: string,
  lineStart?: number,
  lineEnd?: number
): EvidenceItem {
  const url =
    lineStart != null
      ? blobUrlWithLines(ctx.owner, ctx.repo, path, ctx.ref, lineStart, lineEnd)
      : blobUrl(ctx.owner, ctx.repo, path, ctx.ref)
  return {
    filePath: path,
    lineStart,
    lineEnd,
    snippet: snippet?.slice(0, 300),
    blobUrl: url,
  }
}

function findLine(content: string, pattern: RegExp): number | null {
  const lines = content.split("\n")
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1
  }
  return null
}

/** Get a single line (1-based) from content without going out of bounds. */
function getLine(content: string, oneBasedLine: number): string {
  const lines = content.split("\n")
  const idx = Math.max(0, Math.min(oneBasedLine - 1, lines.length - 1))
  return lines[idx] ?? content.slice(0, 200)
}

/** Get concatenated content from first matching path (e.g. GOVERNANCE.md or docs/governance). */
function getContent(ctx: RubricScoringContext, paths: string[]): string {
  for (const p of paths) {
    const file = ctx.files.get(p)
    if (file?.content) return file.content
  }
  return ""
}

const TELEMETRY_PATTERNS = /analytics|telemetry|segment|mixpanel|posthog|amplitude|fullstory|hotjar|heap|sentry|datadog|newrelic|google-analytics|gtag|ga\(/i

/** Check package.json (and optional lock) for telemetry/analytics deps. */
function hasTelemetryDeps(ctx: RubricScoringContext): { line: number; name: string } | null {
  const pkg = ctx.files.get("package.json")?.content
  if (!pkg) return null
  try {
    const json = JSON.parse(pkg) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    const deps = { ...json.dependencies, ...json.devDependencies }
    for (const [name, _] of Object.entries(deps || {})) {
      if (TELEMETRY_PATTERNS.test(name)) return { line: findLine(pkg, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")) ?? 1, name }
    }
  } catch {
    // fallback: line-based search
    const line = findLine(pkg, TELEMETRY_PATTERNS)
    if (line) return { line, name: "dependency" }
  }
  return null
}

function criterion(
  id: RubricCriterionId,
  score: 0 | 1 | 2 | 3,
  evidence: EvidenceItem[],
  hardGateViolation?: boolean,
  riskNote?: string,
  explanation?: string
): RubricCriterionResult {
  return {
    id,
    title: RUBRIC_CRITERION_LABELS[id],
    score,
    evidence,
    hardGateViolation,
    riskNote,
    explanation,
  }
}

export function runRubric(ctx: RubricScoringContext): RubricCriterionResult[] {
  const readme = ctx.files.get("README.md")?.content ?? ""
  const securityMd = ctx.files.get("SECURITY.md")?.content ?? ""
  const contributing = ctx.files.get("CONTRIBUTING.md")?.content ?? ""
  const coc = ctx.files.get("CODE_OF_CONDUCT.md")?.content ?? ""
  const pkg = ctx.files.get("package.json")?.content ?? ""
  const licensePath = Array.from(ctx.files.keys()).find((p) => p.toUpperCase().startsWith("LICENSE"))
  const licenseContent = licensePath ? ctx.files.get(licensePath)?.content ?? "" : ""

  const results: RubricCriterionResult[] = []

  // A1. Censorship Resistance (HG) — multi-signal: README + GOVERNANCE; negation for "no kill switch"
  const governance = getContent(ctx, ["GOVERNANCE.md", "docs/governance.md"])
  const a1Text = `${readme}\n${governance}`
  const crKill = findLine(a1Text, /kill\s*switch|centralized\s*control|admin\s*disable|allowlist|denylist/i)
  const crNoKill = findLine(a1Text, /no\s*kill\s*switch|without\s*allowlist|permissionless\s*by\s*design/i)
  const crPerm = findLine(a1Text, /permissionless|decentralized|escape\s*hatch|p2p|offline/i)
  if (crKill && !crNoKill) {
    const path = readme && findLine(readme, /kill\s*switch|centralized|allowlist|denylist/i) ? "README.md" : "GOVERNANCE.md"
    const line = findLine(readme, /kill\s*switch|centralized|allowlist|denylist/i) ?? findLine(governance, /kill\s*switch|centralized|allowlist|denylist/i) ?? 1
    const content = path === "README.md" ? readme : governance
    results.push(criterion("A1", 0, [ev(ctx, path, getLine(content, line), line)], true, undefined, "A1: 0 — Kill switch or allowlist/centralized control mentioned"))
  } else if (crPerm || crNoKill) {
    const path = findLine(readme, /permissionless|decentralized|escape|p2p|offline|no\s*kill|without\s*allowlist/i) ? "README.md" : "GOVERNANCE.md"
    const content = path === "README.md" ? readme : governance
    const line = findLine(content, /permissionless|decentralized|escape|p2p|offline|no\s*kill|without\s*allowlist/i) ?? 1
    results.push(criterion("A1", 3, [ev(ctx, path, getLine(content, line), line)], false, undefined, "A1: 3 — Permissionless/decentralized or no-kill-switch language found"))
  } else if (readme) {
    results.push(criterion("A1", 1, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "A1: 1 — README present; no strong censorship-resistance signal"))
  } else {
    results.push(criterion("A1", 0, [], false, undefined, "A1: 0 — No README or governance evidence"))
  }

  // A2. Open Source & Free (HG)
  const osiMatch = /MIT|Apache-2|GPL|BSD-3|BSD-2|ISC|CC0|Unlicense/i.test(licenseContent)
  const nonFree = /source-available|commons clause|proprietary|all rights reserved/i.test(licenseContent) && !osiMatch
  if (!licensePath || !licenseContent) {
    results.push(criterion("A2", 0, [], true, "No LICENSE file found", "A2: 0 — No LICENSE file found"))
  } else if (nonFree) {
    results.push(criterion("A2", 0, [ev(ctx, licensePath, licenseContent.slice(0, 200))], true, undefined, "A2: 0 — Non-OSI or proprietary terms in LICENSE"))
  } else if (osiMatch) {
    results.push(criterion("A2", 3, [ev(ctx, licensePath, licenseContent.slice(0, 200))], false, undefined, "A2: 3 — OSI-approved license (e.g. MIT, Apache-2) in LICENSE"))
  } else {
    results.push(criterion("A2", 1, [ev(ctx, licensePath, licenseContent.slice(0, 200))], false, undefined, "A2: 1 — LICENSE present; license type not clearly OSI"))
  }

  // A3. Privacy — use parsed deps for telemetry; multi-signal from SECURITY/README
  const privDoc = findLine(securityMd || readme, /privacy|data\s*protection|user\s*data|confidential/i)
  const telemetryDep = hasTelemetryDeps(ctx)
  if (telemetryDep && pkg) {
    results.push(
      criterion(
        "A3",
        0,
        [ev(ctx, "package.json", getLine(pkg, telemetryDep.line), telemetryDep.line)],
        false,
        "Telemetry/analytics in deps",
        `A3: 0 — Telemetry/analytics dependency detected (${telemetryDep.name})`
      )
    )
  } else if (privDoc) {
    const path = securityMd ? "SECURITY.md" : "README.md"
    const content = securityMd || readme
    results.push(criterion("A3", 2, [ev(ctx, path, getLine(content, privDoc), privDoc)], false, undefined, "A3: 2 — Privacy/data protection mentioned in docs"))
  } else if (readme) {
    results.push(criterion("A3", 1, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "A3: 1 — README present; no privacy or telemetry signal"))
  } else {
    results.push(criterion("A3", 0, [], false, undefined, "A3: 0 — No evidence"))
  }

  // A4. Security — also check threat-model / docs for threat model
  const threatModelContent = Array.from(ctx.files.entries())
    .filter(([p]) => /threat-model|threat_model|security/i.test(p))
    .map(([, f]) => f.content)
    .join("\n")
  const combinedSecurity = `${securityMd}\n${threatModelContent}`
  const threatMention = findLine(combinedSecurity, /threat|disclosure|assumption|model/i)
  if (securityMd) {
    const threat = findLine(securityMd, /threat|disclosure|assumption/i) || threatMention
    const path = threatMention && !findLine(securityMd, /threat|disclosure|assumption/i) ? Array.from(ctx.files.keys()).find((p) => /threat-model|threat_model/i.test(p)) ?? "SECURITY.md" : "SECURITY.md"
    results.push(criterion("A4", threat ? 3 : 2, [ev(ctx, path, (ctx.files.get(path)?.content ?? securityMd).slice(0, 250))], false, undefined, threat ? "A4: 3 — Threat model or disclosure process documented" : "A4: 2 — SECURITY.md present"))
  } else if (readme && findLine(readme, /security|SECURITY|threat\s*model/i)) {
    results.push(criterion("A4", 1, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "A4: 1 — Security mentioned in README"))
  } else {
    results.push(criterion("A4", 0, [], false, undefined, "A4: 0 — No security documentation"))
  }

  // B1. No privileged intermediaries
  const defaultRoute = findLine(readme, /default\s*route|hardcoded|single\s*provider|whitelist|allowlist/i)
  if (defaultRoute) {
    results.push(criterion("B1", 1, [ev(ctx, "README.md", getLine(readme, defaultRoute), defaultRoute)], false, "Default routing to single provider mentioned", "B1: 1 — Default route or single-provider language found"))
  } else if (readme) {
    results.push(criterion("B1", 2, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "B1: 2 — No obvious privileged-intermediary signal in README"))
  } else {
    results.push(criterion("B1", 0, [], false, undefined, "B1: 0 — No evidence"))
  }

  // B2. Credible exit paths — GOVERNANCE.md counts as strong signal
  if (contributing) {
    results.push(criterion("B2", 3, [ev(ctx, "CONTRIBUTING.md", contributing.slice(0, 200))], false, undefined, "B2: 3 — CONTRIBUTING.md documents contribution and exit paths"))
  } else if (governance) {
    results.push(criterion("B2", 3, [ev(ctx, "GOVERNANCE.md", governance.slice(0, 200))], false, undefined, "B2: 3 — GOVERNANCE.md documents governance and exit paths"))
  } else if (readme && findLine(readme, /fork|contribute|self-host/i)) {
    results.push(criterion("B2", 2, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "B2: 2 — Fork/contribute/self-host mentioned in README"))
  } else {
    results.push(criterion("B2", 1, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, readme ? "B2: 1 — README only" : "B2: 1 — No evidence"))
  }

  // B3. Anti-entrenchment
  const decentralize = findLine(readme, /decentraliz|sunset|trust\s*assumption|roadmap/i)
  if (decentralize) {
    results.push(criterion("B3", 2, [ev(ctx, "README.md", getLine(readme, decentralize), decentralize)], false, undefined, "B3: 2 — Decentralization or roadmap/sunset language found"))
  } else {
    results.push(criterion("B3", 1, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, "B3: 1 — README only; no anti-entrenchment signal"))
  }

  // C1. User-controlled defenses
  const userControl = findLine(readme, /config|override|opt-in|opt-out|user\s*control|transparent/i)
  if (userControl) {
    results.push(criterion("C1", 2, [ev(ctx, "README.md", getLine(readme, userControl), userControl)], false, undefined, "C1: 2 — Config/opt-in/user control mentioned"))
  } else {
    results.push(criterion("C1", 1, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, "C1: 1 — README only"))
  }

  // D1. Legibility via documentation — specs, ADR, architecture dirs
  const hasReadme = readme.length > 200
  const hasSpec = Array.from(ctx.files.keys()).some((p) => /spec|design|adr|docs|architecture/i.test(p))
  if (hasReadme && hasSpec) {
    results.push(criterion("D1", 3, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "D1: 3 — README + spec/ADR/docs/architecture present"))
  } else if (hasReadme) {
    results.push(criterion("D1", 2, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "D1: 2 — Substantial README"))
  } else if (readme) {
    results.push(criterion("D1", 1, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "D1: 1 — README present"))
  } else {
    results.push(criterion("D1", 0, [], false, undefined, "D1: 0 — No documentation"))
  }

  // D2. Reproducibility — CI in .github/workflows
  const workflowPaths = Array.from(ctx.files.keys()).filter((p) => p.includes(".github/workflows"))
  const workflowMentionsTest = workflowPaths.some((path) => {
    const content = ctx.files.get(path)?.content ?? ""
    return /test|ci|build|check|lint/i.test(content)
  })
  const hasCi = workflowPaths.length > 0 && workflowMentionsTest
  if (pkg && hasCi) {
    results.push(criterion("D2", 3, [ev(ctx, "package.json", pkg.slice(0, 150))], false, undefined, "D2: 3 — Lockfile/deps + CI workflow with test/build"))
  } else if (pkg || ctx.files.has("Cargo.toml") || ctx.files.has("go.mod")) {
    const path = pkg ? "package.json" : "Cargo.toml"
    const content = pkg || (ctx.files.get("Cargo.toml")?.content ?? "")
    results.push(criterion("D2", 2, [ev(ctx, path, content.slice(0, 150))], false, undefined, "D2: 2 — Declared dependencies; no CI or weak CI"))
  } else {
    results.push(criterion("D2", 1, [], false, undefined, "D2: 1 — No dependency or CI evidence"))
  }

  // D3. Mission-critical reliability
  const hasTests = findLine(readme, /test|ci|fuzz|benchmark|coverage/i)
  if (securityMd && hasTests) {
    results.push(criterion("D3", 3, [ev(ctx, "SECURITY.md", securityMd.slice(0, 150))], false, undefined, "D3: 3 — SECURITY.md + test/CI mentioned"))
  } else if (hasTests) {
    results.push(criterion("D3", 2, [ev(ctx, "README.md", readme.slice(0, 200))], false, undefined, "D3: 2 — Test/CI mentioned in README"))
  } else {
    results.push(criterion("D3", 1, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, "D3: 1 — README only"))
  }

  // E1. Upstream, reusable primitives
  const reusable = findLine(readme, /library|primitive|modular|reusable|spec|reference\s*impl/i)
  if (reusable) {
    results.push(criterion("E1", 3, [ev(ctx, "README.md", getLine(readme, reusable), reusable)], false, undefined, "E1: 3 — Library/primitive/reusable/spec language found"))
  } else {
    results.push(criterion("E1", 2, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, "E1: 2 — README only"))
  }

  // E2. Dependency reduction / handoff — GOVERNANCE.md counts
  const handoff = findLine(readme, /maintainer|governance|handoff|bus\s*factor|community\s*ownership/i) || (governance && findLine(governance, /maintainer|governance|handoff|bus|community/i))
  if ((contributing || governance) && handoff) {
    const path = contributing ? "CONTRIBUTING.md" : "GOVERNANCE.md"
    results.push(criterion("E2", 3, [ev(ctx, path, (contributing || governance).slice(0, 150))], false, undefined, "E2: 3 — CONTRIBUTING or GOVERNANCE + handoff/governance language"))
  } else if (contributing || coc || governance) {
    const path = contributing ? "CONTRIBUTING.md" : governance ? "GOVERNANCE.md" : "CODE_OF_CONDUCT.md"
    results.push(criterion("E2", 2, [ev(ctx, path, (contributing || governance || coc).slice(0, 150))], false, undefined, "E2: 2 — CONTRIBUTING, GOVERNANCE, or CoC present"))
  } else {
    results.push(criterion("E2", 1, readme ? [ev(ctx, "README.md", readme.slice(0, 200))] : [], false, undefined, "E2: 1 — README only"))
  }

  return results
}
