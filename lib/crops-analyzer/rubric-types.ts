/**
 * Types for the repo-assessment rubric (0–3 scale, A1–F3).
 */

import type { EvidenceItem } from "./types"

export type RubricCriterionId =
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "B1"
  | "B2"
  | "B3"
  | "C1"
  | "D1"
  | "D2"
  | "D3"
  | "E1"
  | "E2"

export interface RubricCriterionResult {
  id: RubricCriterionId
  title: string
  score: 0 | 1 | 2 | 3
  evidence: EvidenceItem[]
  hardGateViolation?: boolean
  riskNote?: string
  /** Short explanation of why this score was assigned (evidence-based). */
  explanation?: string
}

export interface RubricAnalysis {
  repoUrl: string
  ref?: string
  commitSha: string
  runAt: string
  criteria: RubricCriterionResult[]
  filesScanned: string[]
}

export const RUBRIC_CRITERION_LABELS: Record<RubricCriterionId, string> = {
  A1: "Censorship Resistance (HG)",
  A2: "Open Source & Free (HG)",
  A3: "Privacy (HG when relevant)",
  A4: "Security (HG when relevant)",
  B1: "No privileged intermediaries (HG when present)",
  B2: "Credible exit paths",
  B3: "Anti-entrenchment / decentralize later",
  C1: "User-controlled defenses",
  D1: "Legibility via documentation",
  D2: "Reproducibility & verifiability",
  D3: "Mission-critical reliability",
  E1: "Upstream, reusable primitives",
  E2: "Dependency reduction / subtraction",
}
