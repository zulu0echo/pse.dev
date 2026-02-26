/**
 * Types for the public CROPS repo analyzer (evidence-based, no DB).
 */

export type Dimension = "C" | "O" | "P" | "S"

export interface EvidenceItem {
  filePath: string
  lineStart?: number
  lineEnd?: number
  snippet?: string
  blobUrl: string
}

export type CheckStatus = "pass" | "fail" | "unknown"

export interface CheckResult {
  id: string
  dimension: Dimension
  name: string
  description: string
  maxPoints: number
  pointsAwarded: number
  status: CheckStatus
  evidence: EvidenceItem[]
}

export interface CropScores {
  overall: number
  C: number
  O: number
  P: number
  S: number
}

export interface CropAnalysis {
  analysisId: string
  repoUrl: string
  ref?: string
  commitSha: string
  runAt: string
  scores: CropScores
  checks: CheckResult[]
  filesScanned: string[]
  deepScan?: boolean
}

export const DIMENSION_LABELS: Record<Dimension, string> = {
  C: "Censorship resistance",
  O: "Open source & free",
  P: "Privacy",
  S: "Security",
}
