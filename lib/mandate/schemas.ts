import { z } from "zod"

const evidenceLinkSchema = z.object({
  label: z.string(),
  url: z.union([z.string().url(), z.literal("")]),
})

const tier1CriterionSchema = z.object({
  /** pass | fail | unknown | na (N/A = not applicable; excluded from overall gate). */
  status: z.enum(["pass", "fail", "unknown", "na"]),
  notes: z.string().default(""),
  evidenceLinks: z.array(evidenceLinkSchema).default([]),
})

const tier2Or3CriterionSchema = z.object({
  /** 0–5 or null for N/A (not applicable); N/A criteria are excluded from rollup. */
  score: z.union([z.number().min(0).max(5).int(), z.null()]),
  notes: z.string().default(""),
  evidenceLinks: z.array(evidenceLinkSchema).default([]),
})

export const tier1OverrideSchema = z.object({
  enabled: z.boolean(),
  status: z.enum(["pass", "fail", "needs_review"]),
  reason: z.string(),
})

export const criteriaEntrySchema = z.object({
  key: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pillar: z.enum([
    "CROPS",
    "Technical",
    "Social",
    "Operating",
    "Limits",
    "Tradeoffs",
    "Horizon",
  ]),
  category: z.string(),
  shortLabel: z.string(),
  fullText: z.string(),
  weight: z.number().min(0).default(1),
  source: z.object({
    doc: z.string(),
    section: z.string().optional(),
    pageHint: z.number().optional(),
  }),
  /** How this criterion is assessed: what evidence to look for, what 0–5 or pass/fail means. */
  assessmentGuidance: z.string().optional(),
  /** When the criterion cannot be assessed; explain this in Notes/Links and use N/A. */
  whenNa: z.string().optional(),
})

export const criteriaRegistrySchema = z.object({
  criteria: z.array(criteriaEntrySchema),
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortDescription: z.string().optional().default(""),
  ownerTeam: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
  status: z.enum(["proposed", "active", "sunset", "completed"]),
  githubRepoUrl: z.string().optional(),
})

export const scorecardSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  periodLabel: z.string(),
  isCurrent: z.boolean(),
  tier1: z.object({
    overallStatus: z.enum(["pass", "fail", "needs_review"]),
    override: tier1OverrideSchema,
    criteria: z.record(z.string(), tier1CriterionSchema),
  }),
  tier2: z.object({
    rollup: z.number().min(0).max(100),
    criteria: z.record(z.string(), tier2Or3CriterionSchema),
  }),
  tier3: z.object({
    rollup: z.number().min(0).max(100),
    criteria: z.record(z.string(), tier2Or3CriterionSchema),
  }),
  summary: z.string().default(""),
  risks: z.string().default(""),
  evidenceLinks: z.array(evidenceLinkSchema).default([]),
  lastUpdated: z.string().optional().default(""),
  /** Last repo rubric assessment (admin-run); excluded from rollup. */
  rubricLastRunAt: z.string().optional(),
  rubricRepoUrl: z.string().optional(),
  rubricAverageScore: z.number().min(0).max(3).optional(),
  rubricCriteria: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        score: z.number().min(0).max(3),
        explanation: z.string().optional(),
      })
    )
    .optional(),
})

export const stateSchema = z.object({
  projects: z.array(projectSchema),
  scorecards: z.array(scorecardSchema),
})

export type EvidenceLink = z.infer<typeof evidenceLinkSchema>
export type Tier1CriterionEval = z.infer<typeof tier1CriterionSchema>
export type Tier2Or3CriterionEval = z.infer<typeof tier2Or3CriterionSchema>
export type Tier1Override = z.infer<typeof tier1OverrideSchema>
export type CriteriaEntry = z.infer<typeof criteriaEntrySchema>
export type CriteriaRegistry = z.infer<typeof criteriaRegistrySchema>
export type Project = z.infer<typeof projectSchema>
export type Scorecard = z.infer<typeof scorecardSchema>
export type MandateState = z.infer<typeof stateSchema>
