import { describe, it, expect } from "vitest"
import {
  deriveTier1Overall,
  computeTierRollup,
} from "@/lib/mandate/rollup"
import type { CriteriaEntry, Tier1CriterionEval, Tier2Or3CriterionEval } from "@/lib/mandate/schemas"

describe("deriveTier1Overall", () => {
  it("returns override status when override is enabled", () => {
    const criteria: Record<string, Tier1CriterionEval> = {
      a: { status: "fail", notes: "", evidenceLinks: [] },
    }
    expect(
      deriveTier1Overall(criteria, { enabled: true, status: "pass", reason: "" })
    ).toBe("pass")
    expect(
      deriveTier1Overall(criteria, { enabled: true, status: "fail", reason: "" })
    ).toBe("fail")
  })

  it("returns fail when any criterion is fail and override disabled", () => {
    expect(
      deriveTier1Overall(
        {
          a: { status: "pass", notes: "", evidenceLinks: [] },
          b: { status: "fail", notes: "", evidenceLinks: [] },
        },
        { enabled: false, status: "pass", reason: "" }
      )
    ).toBe("fail")
  })

  it("returns needs_review when any criterion is unknown and none fail", () => {
    expect(
      deriveTier1Overall(
        {
          a: { status: "pass", notes: "", evidenceLinks: [] },
          b: { status: "unknown", notes: "", evidenceLinks: [] },
        },
        { enabled: false, status: "pass", reason: "" }
      )
    ).toBe("needs_review")
  })

  it("returns pass when all criteria are pass", () => {
    expect(
      deriveTier1Overall(
        {
          a: { status: "pass", notes: "", evidenceLinks: [] },
          b: { status: "pass", notes: "", evidenceLinks: [] },
        },
        { enabled: false, status: "pass", reason: "" }
      )
    ).toBe("pass")
  })
})

describe("computeTierRollup", () => {
  const entries: CriteriaEntry[] = [
    { key: "a", tier: 2, pillar: "Technical", category: "X", shortLabel: "A", fullText: "", weight: 1, source: { doc: "" } },
    { key: "b", tier: 2, pillar: "Technical", category: "X", shortLabel: "B", fullText: "", weight: 1, source: { doc: "" } },
  ]

  it("returns 0 when no evaluations", () => {
    expect(computeTierRollup(entries, {})).toBe(0)
  })

  it("returns 100 when all scores are 5", () => {
    const evals: Record<string, Tier2Or3CriterionEval> = {
      a: { score: 5, notes: "", evidenceLinks: [] },
      b: { score: 5, notes: "", evidenceLinks: [] },
    }
    expect(computeTierRollup(entries, evals)).toBe(100)
  })

  it("returns 0 when all scores are 0", () => {
    const evals: Record<string, Tier2Or3CriterionEval> = {
      a: { score: 0, notes: "", evidenceLinks: [] },
      b: { score: 0, notes: "", evidenceLinks: [] },
    }
    expect(computeTierRollup(entries, evals)).toBe(0)
  })

  it("returns 60 when all scores are 3 (3/5 = 60%)", () => {
    const evals: Record<string, Tier2Or3CriterionEval> = {
      a: { score: 3, notes: "", evidenceLinks: [] },
      b: { score: 3, notes: "", evidenceLinks: [] },
    }
    expect(computeTierRollup(entries, evals)).toBe(60)
  })

  it("excludes N/A (null) criteria from rollup", () => {
    const evals: Record<string, Tier2Or3CriterionEval> = {
      a: { score: 5, notes: "", evidenceLinks: [] },
      b: { score: null, notes: "", evidenceLinks: [] },
    }
    expect(computeTierRollup(entries, evals)).toBe(100)
  })

  it("returns 0 when all criteria are N/A", () => {
    const evals: Record<string, Tier2Or3CriterionEval> = {
      a: { score: null, notes: "", evidenceLinks: [] },
      b: { score: null, notes: "", evidenceLinks: [] },
    }
    expect(computeTierRollup(entries, evals)).toBe(0)
  })
})
