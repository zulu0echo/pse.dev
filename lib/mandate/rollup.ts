import type { CriteriaEntry, Scorecard, Tier1CriterionEval, Tier2Or3CriterionEval } from "./schemas"

const TIER1_FAIL = "fail" as const
const TIER1_UNKNOWN = "unknown" as const
const TIER1_PASS = "pass" as const

/**
 * Derive Tier 1 overall status from criteria (unless override is enabled).
 * - If ANY criterion is fail => "fail"
 * - Else if ANY criterion is unknown => "needs_review"
 * - N/A criteria are excluded (do not trigger fail or needs_review)
 * - Else => "pass"
 */
export function deriveTier1Overall(
  criteria: Record<string, Tier1CriterionEval>,
  override: { enabled: boolean; status: "pass" | "fail" | "needs_review" }
): "pass" | "fail" | "needs_review" {
  if (override.enabled) return override.status
  const values = Object.values(criteria)
  if (values.some((c) => c.status === TIER1_FAIL)) return "fail"
  if (values.some((c) => c.status === TIER1_UNKNOWN)) return "needs_review"
  return "pass"
}

/**
 * Compute Tier 2 or Tier 3 rollup: round( (sum(score*weight) / (5 * sum(weights))) * 100 ).
 * Criteria with score N/A (null) are excluded from the sum and from the weight total.
 */
export function computeTierRollup(
  criteriaEntries: CriteriaEntry[],
  evaluations: Record<string, Tier2Or3CriterionEval>
): number {
  let sumWeightedScore = 0
  let sumWeights = 0
  for (const entry of criteriaEntries) {
    const eval_ = evaluations[entry.key]
    if (eval_ == null) continue
    if (eval_.score == null) continue // N/A — exclude from aggregate
    const w = entry.weight ?? 1
    sumWeightedScore += eval_.score * w
    sumWeights += w
  }
  if (sumWeights === 0) return 0
  const normalized = (sumWeightedScore / (5 * sumWeights)) * 100
  return Math.round(normalized)
}

/**
 * Get Tier 1 criteria keys from registry.
 */
export function getTier1Keys(registry: { criteria: CriteriaEntry[] }): string[] {
  return registry.criteria.filter((c) => c.tier === 1).map((c) => c.key)
}

/**
 * Get Tier 2 criteria keys from registry.
 */
export function getTier2Keys(registry: { criteria: CriteriaEntry[] }): string[] {
  return registry.criteria.filter((c) => c.tier === 2).map((c) => c.key)
}

/**
 * Get Tier 3 criteria keys from registry.
 */
export function getTier3Keys(registry: { criteria: CriteriaEntry[] }): string[] {
  return registry.criteria.filter((c) => c.tier === 3).map((c) => c.key)
}

/**
 * Ensure scorecard tier rollups are recomputed and return updated scorecard (no mutate).
 */
export function syncScorecardRollups(
  scorecard: Scorecard,
  criteriaEntriesByTier: {
    tier1: CriteriaEntry[]
    tier2: CriteriaEntry[]
    tier3: CriteriaEntry[]
  }
): Scorecard {
  const tier1Overall = deriveTier1Overall(scorecard.tier1.criteria, scorecard.tier1.override)
  const tier2Rollup = computeTierRollup(criteriaEntriesByTier.tier2, scorecard.tier2.criteria)
  const tier3Rollup = computeTierRollup(criteriaEntriesByTier.tier3, scorecard.tier3.criteria)
  return {
    ...scorecard,
    tier1: {
      ...scorecard.tier1,
      overallStatus: tier1Overall,
    },
    tier2: { ...scorecard.tier2, rollup: tier2Rollup },
    tier3: { ...scorecard.tier3, rollup: tier3Rollup },
  }
}
