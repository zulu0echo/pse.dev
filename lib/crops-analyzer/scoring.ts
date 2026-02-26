/**
 * Evidence-based CROPS scoring. Each check returns points and evidence (file path, blob URL).
 * Unknown when evidence not found; no hallucinations.
 */

import type { CheckResult, Dimension, EvidenceItem } from "./types"
import { blobUrl, blobUrlWithLines } from "./github"
import type { FileContent } from "./github"

export interface ScoringContext {
  owner: string
  repo: string
  ref: string
  files: Map<string, FileContent>
}

function evidence(
  ctx: ScoringContext,
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

function runCheck(
  ctx: ScoringContext,
  dimension: Dimension,
  id: string,
  name: string,
  description: string,
  maxPoints: number,
  run: () => { points: number; status: "pass" | "fail" | "unknown"; evidence: EvidenceItem[] }
): CheckResult {
  const result = run()
  return {
    id,
    dimension,
    name,
    description,
    maxPoints,
    pointsAwarded: result.points,
    status: result.status,
    evidence: result.evidence,
  }
}

export function runAllChecks(ctx: ScoringContext): CheckResult[] {
  const checks: CheckResult[] = []

  // --- C: Censorship resistance ---
  const readme = ctx.files.get("README.md")?.content ?? ""
  checks.push(
    runCheck(ctx, "C", "c-license", "License file present", "Repository has a LICENSE file.", 25, () => {
      const lic = Array.from(ctx.files.keys()).find((p) => p.toUpperCase().startsWith("LICENSE"))
      if (!lic) return { points: 0, status: "unknown", evidence: [] }
      const content = ctx.files.get(lic)!
      return {
        points: 25,
        status: "pass",
        evidence: [evidence(ctx, lic, content.content.slice(0, 200))],
      }
    })
  )
  checks.push(
    runCheck(ctx, "C", "c-permissionless", "Permissionless / no kill switch in README", "README does not suggest centralized kill switches.", 25, () => {
      if (!readme) return { points: 0, status: "unknown", evidence: [] }
      const killPattern = /kill\s*switch|centralized\s*control|admin\s*disable|backdoor/i
      const line = findLine(readme, killPattern)
      if (line !== null)
        return { points: 0, status: "fail", evidence: [evidence(ctx, "README.md", readme.split("\n")[line - 1], line)] }
      const permPattern = /permissionless|decentralized|open\s*participation/i
      const permLine = findLine(readme, permPattern)
      if (permLine !== null)
        return { points: 25, status: "pass", evidence: [evidence(ctx, "README.md", readme.split("\n")[permLine - 1], permLine)] }
      return { points: 0, status: "unknown", evidence: [] }
    })
  )

  // --- O: Open source & free ---
  const licenseFile = Array.from(ctx.files.keys()).find((p) => p.toUpperCase().startsWith("LICENSE"))
  const licenseContent = licenseFile ? ctx.files.get(licenseFile)?.content ?? "" : ""
  checks.push(
    runCheck(ctx, "O", "o-license-type", "Recognized open license", "LICENSE contains MIT, Apache, GPL, or similar.", 25, () => {
      if (!licenseContent) return { points: 0, status: "unknown", evidence: [] }
      const openLicenses = /MIT|Apache-2|GPL|BSD-3|BSD-2|ISC|CC0|Unlicense/i
      const line = findLine(licenseContent, openLicenses)
      if (line !== null && licenseFile)
        return {
          points: 25,
          status: "pass",
          evidence: [evidence(ctx, licenseFile, licenseContent.split("\n")[line - 1], line)],
        }
      if (licenseFile)
        return { points: 0, status: "fail", evidence: [evidence(ctx, licenseFile, licenseContent.slice(0, 200))] }
      return { points: 0, status: "unknown", evidence: [] }
    })
  )
  checks.push(
    runCheck(ctx, "O", "o-no-proprietary", "No proprietary language in README", "README does not state proprietary or closed-source.", 25, () => {
      if (!readme) return { points: 0, status: "unknown", evidence: [] }
      const propPattern = /proprietary|closed\s*source|not\s*open/i
      const line = findLine(readme, propPattern)
      if (line !== null)
        return { points: 0, status: "fail", evidence: [evidence(ctx, "README.md", readme.split("\n")[line - 1], line)] }
      return { points: 25, status: "pass", evidence: [evidence(ctx, "README.md", readme.slice(0, 200))] }
    })
  )

  // --- P: Privacy ---
  const securityMd = ctx.files.get("SECURITY.md")?.content ?? ""
  checks.push(
    runCheck(ctx, "P", "p-privacy-docs", "Privacy or security documentation", "SECURITY.md or docs mention privacy.", 25, () => {
      if (securityMd) {
        const line = findLine(securityMd, /privacy|data\s*protection|user\s*data/i)
        if (line !== null)
          return { points: 25, status: "pass", evidence: [evidence(ctx, "SECURITY.md", securityMd.split("\n")[line - 1], line)] }
        return { points: 15, status: "pass", evidence: [evidence(ctx, "SECURITY.md", securityMd.slice(0, 200))] }
      }
      const readmePrivacy = findLine(readme, /privacy|user\s*data|confidential/i)
      if (readmePrivacy !== null)
        return { points: 15, status: "pass", evidence: [evidence(ctx, "README.md", readme.split("\n")[readmePrivacy - 1], readmePrivacy)] }
      return { points: 0, status: "unknown", evidence: [] }
    })
  )
  const pkg = ctx.files.get("package.json")?.content ?? ""
  checks.push(
    runCheck(ctx, "P", "p-no-telemetry", "No obvious telemetry in package.json", "package.json does not list analytics/telemetry deps.", 25, () => {
      if (!pkg) return { points: 0, status: "unknown", evidence: [] }
      const telemetryPattern = /analytics|telemetry|segment|mixpanel|amplitude|google-analytics|posthog/i
      const line = findLine(pkg, telemetryPattern)
      if (line !== null)
        return { points: 0, status: "fail", evidence: [evidence(ctx, "package.json", pkg.split("\n")[line - 1], line)] }
      return { points: 25, status: "pass", evidence: [evidence(ctx, "package.json", pkg.slice(0, 200))] }
    })
  )

  // --- S: Security ---
  checks.push(
    runCheck(ctx, "S", "s-security-md", "SECURITY.md present", "Repository has SECURITY.md for disclosure.", 25, () => {
      if (!securityMd) return { points: 0, status: "unknown", evidence: [] }
      return { points: 25, status: "pass", evidence: [evidence(ctx, "SECURITY.md", securityMd.slice(0, 200))] }
    })
  )
  const contributing = ctx.files.get("CONTRIBUTING.md")?.content ?? ""
  checks.push(
    runCheck(ctx, "S", "s-contributing", "CONTRIBUTING or CODE_OF_CONDUCT", "Project has contribution or conduct guidelines.", 25, () => {
      if (contributing)
        return { points: 25, status: "pass", evidence: [evidence(ctx, "CONTRIBUTING.md", contributing.slice(0, 200))] }
      const coc = ctx.files.get("CODE_OF_CONDUCT.md")?.content
      if (coc) return { points: 25, status: "pass", evidence: [evidence(ctx, "CODE_OF_CONDUCT.md", coc.slice(0, 200))] }
      return { points: 0, status: "unknown", evidence: [] }
    })
  )

  return checks
}

export function scoresFromChecks(checks: CheckResult[]): { overall: number; C: number; O: number; P: number; S: number } {
  const byDim: Record<string, { total: number; max: number }> = { C: { total: 0, max: 0 }, O: { total: 0, max: 0 }, P: { total: 0, max: 0 }, S: { total: 0, max: 0 } }
  for (const c of checks) {
    byDim[c.dimension].total += c.pointsAwarded
    byDim[c.dimension].max += c.maxPoints
  }
  const C = byDim.C.max > 0 ? Math.round((byDim.C.total / byDim.C.max) * 100) : 0
  const O = byDim.O.max > 0 ? Math.round((byDim.O.total / byDim.O.max) * 100) : 0
  const P = byDim.P.max > 0 ? Math.round((byDim.P.total / byDim.P.max) * 100) : 0
  const S = byDim.S.max > 0 ? Math.round((byDim.S.total / byDim.S.max) * 100) : 0
  const overall = Math.round((C + O + P + S) / 4)
  return { overall, C, O, P, S }
}
