/**
 * Tier 2 and Tier 3 evidence signals for methodology, admin rubric, tooltips, and evidence checklist.
 * Reviewers look for these in: GitHub repos, specs/RFCs, threat models, docs, governance docs,
 * deployment configs, architecture diagrams.
 */

export type EvidenceTheme = {
  id: string
  title: string
  measures: string
  highSignals: string[]
  redFlags: string[]
  mandateAnchor: string
}

export const TIER2_CORE_QUESTION =
  "Does this remove structural power over users?"

export const TIER3_CORE_QUESTION =
  "Does this reduce EF's necessity over time?"

export const TIER2_EVIDENCE_THEMES: EvidenceTheme[] = [
  {
    id: "t2.1",
    title: "T2.1 Routing & Access Leverage",
    measures:
      "Does the system avoid privileged routing paths or curated intermediaries?",
    highSignals: [
      "Open P2P architecture diagrams",
      "No hardcoded relay endpoints",
      "Configurable routing endpoints",
      "Multiple client implementations supported",
      "Documentation explicitly describing how to self-host or route independently",
      "Threat model includes censorship scenarios",
      "Tests simulating relay or RPC failure",
    ],
    redFlags: [
      "Hardcoded default RPC URLs in code",
      "Whitelisted relayer list embedded in client",
      "\"Trusted partner\" relay mentioned without elimination path",
      "No instructions for independent routing",
      "Architecture diagram shows single aggregator in critical path",
    ],
    mandateAnchor: "Avoid chokepoints; no privileged routing",
  },
  {
    id: "t2.2",
    title: "T2.2 Upgrade & Governance Leverage",
    measures: "Does the system minimize discretionary power?",
    highSignals: [
      "Governance model documented",
      "Explicit statement of upgrade authority limits",
      "No unilateral admin keys in core contracts",
      "Time-locked upgrades",
      "Transparent versioning policy",
      "Governance minimization explained in README",
      "Migration strategy documented",
    ],
    redFlags: [
      "onlyOwner upgrade functions without constraint",
      "Undocumented admin privileges",
      "No threat model for insider compromise",
      "No clear upgrade process",
    ],
    mandateAnchor: "Governance minimization; walkaway test",
  },
  {
    id: "t2.3",
    title: "T2.3 Data & Information Leverage",
    measures: "Does the system avoid creating structural data asymmetries?",
    highSignals: [
      "No analytics dependencies in core flow",
      "Privacy section in documentation",
      "Explicit data minimization policy",
      "Telemetry optional and documented",
      "No silent data export calls",
      "Cryptographic privacy primitives visible in architecture",
    ],
    redFlags: [
      "Undocumented telemetry",
      "Centralized analytics SDK embedded",
      "Server logs required for core function",
      "\"AI risk scoring\" without transparency",
    ],
    mandateAnchor: "Privacy prevents structural asymmetry",
  },
  {
    id: "t2.4",
    title: "T2.4 Economic Extraction Leverage",
    measures: "Does the system embed rent-seeking chokepoints?",
    highSignals: [
      "Open marketplace design",
      "No fixed intermediary set",
      "Intermediaries replaceable",
      "Fee logic transparent and bounded",
      "Removal path for temporary coordination layers documented",
    ],
    redFlags: [
      "Embedded protocol fee to specific entity",
      "Closed intermediary layer",
      "Hardcoded profit recipient",
      "No explanation of how privileged roles sunset",
    ],
    mandateAnchor: "Avoid centralized extraction pipelines",
  },
  {
    id: "t2.5",
    title: "T2.5 Dependency Surface Reduction",
    measures: "Can system survive third-party or team disappearance?",
    highSignals: [
      "No required proprietary API",
      "Clear offline / degraded mode documentation",
      "Reproducible builds",
      "Open dependency list",
      "Infrastructure self-hosting instructions",
      "\"Unhappy case\" documented in threat model",
    ],
    redFlags: [
      "Critical path depends on closed SaaS",
      "CDN required for core logic",
      "No alternative provider path",
      "Repo inactive but system requires live service",
    ],
    mandateAnchor: "Resilience beyond team presence",
  },
  {
    id: "t2.6",
    title: "T2.6 Exit & Forkability Strength",
    measures: "How credible is forkability?",
    highSignals: [
      "Permissive or copyleft OSI license",
      "Complete build instructions",
      "No proprietary components",
      "All specs public",
      "No trademark/legal constraints blocking fork",
      "Reference client fully open",
    ],
    redFlags: [
      "\"Source-available\" license",
      "Missing build instructions",
      "Closed coordination service required",
      "Proprietary key material required",
    ],
    mandateAnchor: "Open and free, predictable exit",
  },
  {
    id: "t2.7",
    title: "T2.7 User Agency vs Paternalism",
    measures: "Are defenses user-controlled?",
    highSignals: [
      "Filters configurable",
      "Safety modules optional",
      "Clear override paths",
      "No silent blocking logic",
      "Transparent rule sets in code",
    ],
    redFlags: [
      "Hardcoded blocklists",
      "Default-on filtering without override",
      "Proprietary scoring systems",
      "Silent transaction steering",
    ],
    mandateAnchor: "Empower agency, not high priests",
  },
]

export const TIER3_EVIDENCE_THEMES: EvidenceTheme[] = [
  {
    id: "t3.1",
    title: "T3.1 Only-EF Justification Strength",
    measures: "Is this clearly public-good infrastructure?",
    highSignals: [
      "Explicit rationale in docs for why work has no natural market owner",
      "Upstream research or spec repo",
      "Multi-client or neutral coordination artifacts",
      "No product positioning language",
    ],
    redFlags: [
      "Consumer UX focus",
      "Branding emphasis",
      "Market capture framing",
      "Could clearly be venture-backed",
    ],
    mandateAnchor: "Only-EF Rule",
  },
  {
    id: "t3.2",
    title: "T3.2 Ecosystem Diffusion Readiness",
    measures: "Can responsibility move outward?",
    highSignals: [
      "CONTRIBUTING.md comprehensive",
      "Multiple external contributors",
      "Maintainer diversity",
      "Documentation enabling replication",
      "Public issue tracking",
    ],
    redFlags: [
      "Single maintainer bottleneck",
      "No onboarding docs",
      "No roadmap transparency",
      "Knowledge siloed in private channels",
    ],
    mandateAnchor: "Handoff for ecosystem maturity",
  },
  {
    id: "t3.3",
    title: "T3.3 Upstream Leverage & Reusability",
    measures: "Is it primitive-level or product-level?",
    highSignals: [
      "Modular architecture",
      "Clear API boundaries",
      "Spec-first development",
      "Independent test suite usable by others",
      "Reference implementations minimal, not dominant",
    ],
    redFlags: [
      "Tight coupling to one app",
      "No reusable components",
      "UX-specific logic in core layer",
    ],
    mandateAnchor: "Compounding effects; upstream bias",
  },
  {
    id: "t3.4",
    title: "T3.4 EF Dependency Reduction",
    measures: "Does system require EF to maintain neutrality?",
    highSignals: [
      "No EF-hosted coordination requirement",
      "Governance not EF-mediated",
      "Funding model independent",
      "Neutral specification ownership",
    ],
    redFlags: [
      "EF must arbitrate disputes",
      "EF signs releases centrally",
      "EF infra required for core function",
    ],
    mandateAnchor: "Walkaway test",
  },
  {
    id: "t3.5",
    title: "T3.5 Long-Horizon Robustness",
    measures: "Is it designed for adversarial centuries?",
    highSignals: [
      "Explicit long-term assumptions documented",
      "Cryptographic soundness review",
      "Migration minimization plan",
      "Avoidance of political assumptions",
      "Durable design choices justified",
    ],
    redFlags: [
      "Relies on regulatory status quo",
      "Relies on specific geopolitical stability",
      "Short-term incentives dominate",
    ],
    mandateAnchor: "Thousand-year horizon",
  },
  {
    id: "t3.6",
    title: "T3.6 Chokepoint Prevention",
    measures: "Does it actively relieve coordination bottlenecks?",
    highSignals: [
      "Identifies ecosystem choke surfaces",
      "Provides neutral tooling",
      "Encourages multi-client diversity",
      "Removes centralized coordination requirement",
    ],
    redFlags: [
      "Creates new central registry",
      "Introduces new gatekeeper layer",
      "Requires single authority endorsement",
    ],
    mandateAnchor: "Prevent capture of protocol/ecosystem",
  },
  {
    id: "t3.7",
    title: "T3.7 Principle Diffusion & Legibility",
    measures: "Does it spread CROPS-native norms?",
    highSignals: [
      "Early research publication",
      "Open threat models",
      "Design tradeoff documentation",
      "Clear articulation of leverage tradeoffs",
      "Invites critique",
    ],
    redFlags: [
      "Social proof before technical scrutiny",
      "Marketing-first rollout",
      "Sparse documentation",
    ],
    mandateAnchor: "Judge revealed preferences; publish early",
  },
]

export const EVIDENCE_SOURCES_INTRO =
  "Reviewers look for evidence in: GitHub repositories, specs/RFCs, threat models, documentation sites, governance docs, deployment configs, and architecture diagrams."

export const GUARDRAIL_TEXT =
  "If evidence is missing, incomplete, or unverifiable, score defaults toward mid/low unless justified. The Mandate emphasizes legibility, openness, and observable alignment."

export const EVIDENCE_PANEL_INTRO =
  "For each score, the reviewer can attach: GitHub link(s), spec link(s), commit references, threat model reference, and a short written justification. This keeps scores auditable and grounded in observable artifacts."

/** Map criterion key to evidence theme id (t2.1–t2.7, t3.1–t3.7) for drilldown display. */
export const CRITERION_TO_EVIDENCE_THEME_ID: Record<string, string> = {
  // Tier 2
  t2_sovereignty_final_authority: "t2.6",
  t2_sovereignty_credible_exit: "t2.6",
  t2_sovereignty_no_new_leverage: "t2.6",
  t2_resilience_contributes_decentralization: "t2.5",
  t2_resilience_increases_resilience: "t2.5",
  t2_resilience_reduces_ef_reliance: "t2.5",
  t2_resilience_walkaway_test: "t2.5",
  t2_tech_maximally_unstoppable: "t2.1",
  t2_tech_avoids_centralized_intermediaries: "t2.1",
  t2_tech_no_privileged_routing: "t2.1",
  t2_tech_no_secret_intermediary: "t2.1",
  t2_tech_no_whitelist_without_elimination: "t2.1",
  t2_tech_avoids_dependency_leverage: "t2.5",
  t2_tech_high_necessity_new_domains: "t2.2",
  t2_tech_crypto_over_social_trust: "t2.3",
  t2_tech_reusable_primitives: "t2.6",
  t2_tech_ux_without_control_points: "t2.7",
  t2_social_avoids_private_capture: "t2.3",
  t2_social_avoids_extraction_architectures: "t2.4",
  t2_social_resilience_over_growth: "t2.7",
  t2_tradeoff_prefer_crops_native: "t2.7",
  t2_tradeoff_remove_leverage: "t2.4",
  t2_tradeoff_user_controlled_defenses: "t2.7",
  t2_tradeoff_no_uninspectable_ai: "t2.7",
  t2_tradeoff_open_markets_over_whitelist: "t2.4",
  // Tier 3
  t3_scaling_expands_sovereignty: "t3.3",
  t3_scaling_sovereignty_at_scale: "t3.3",
  t3_scaling_not_at_crops_cost: "t3.3",
  t3_only_ef_focus: "t3.1",
  t3_only_ef_bottlenecks: "t3.1",
  t3_only_ef_prevents_chokepoints: "t3.6",
  t3_only_ef_sustainable_funding_gaps: "t3.1",
  t3_handoff_designed_for_diffusion: "t3.2",
  t3_handoff_transition_stewardship: "t3.2",
  t3_handoff_reduces_ef_influence: "t3.4",
  t3_handoff_no_permanent_dependency: "t3.4",
  t3_compounding_upstream_high_leverage: "t3.3",
  t3_compounding_reusable_primitives: "t3.3",
  t3_compounding_shared_infra: "t3.3",
  t3_compounding_durable_precedents: "t3.3",
  t3_social_embodies_crops: "t3.7",
  t3_social_technical_rigor: "t3.7",
  t3_social_legible_documentation: "t3.7",
  t3_social_publishes_early_openly: "t3.7",
  t3_social_ships_reliability: "t3.7",
  t3_social_right_association: "t3.2",
  t3_social_encourages_independence: "t3.4",
  t3_social_open_collab_over_moat: "t3.2",
  t3_social_advances_ethereum_beyond_crypto: "t3.7",
  t3_social_civilizational_infra: "t3.7",
  t3_limits_not_consumer_app_team: "t3.1",
  t3_limits_not_accreditation_authority: "t3.1",
  t3_limits_not_hype_price: "t3.7",
  t3_limits_not_kingmaker: "t3.6",
  t3_tradeoff_evaluate_design_not_polish: "t3.7",
  t3_tradeoff_skeptical_social_proof: "t3.7",
  t3_horizon_thousand_year: "t3.5",
  t3_horizon_no_principled_drift: "t3.5",
  t3_horizon_sanctuary_infra: "t3.5",
  t3_horizon_strengthens_agency: "t3.5",
}

export function getEvidenceThemeById(
  themeId: string,
  tier: 2 | 3
): EvidenceTheme | null {
  const themes = tier === 2 ? TIER2_EVIDENCE_THEMES : TIER3_EVIDENCE_THEMES
  return themes.find((t) => t.id === themeId) ?? null
}
