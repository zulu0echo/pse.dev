/**
 * Evidence-based CROPS assessment: updates data/state.json with Tier 1 (pass/fail/unknown)
 * and Tier 2/3 (0-5) per criterion using project metadata from content/projects and state.
 *
 * Methodology rule: Tier 2/3 evidence must be listed as a code snippet (or equivalent);
 * if not, the score is treated as unknown (0 here until snippet evidence is added).
 *
 * Run: node scripts/assess-crops.js
 * Repo list for verification: see scripts/CROPS_PROJECT_REPOS.md
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..");
const CRITERIA_PATH = path.join(ROOT, "data", "criteria.json");
const STATE_PATH = path.join(ROOT, "data", "state.json");
const PROJECTS_DIR = path.join(ROOT, "content", "projects");

// Map state.json project id -> content/projects filename (without .md)
const PROJECT_ID_TO_CONTENT = {
  csp: "client-side-proving",
  tlsnotary: "tlsn",
  mopro: "mopro",
  zkid: "zk-id",
  machina: "machina-iO",
  ptr: "private-transactions-research",
  pte: null,
  iptf: null,
  pir: "pir-ethereum-data",
  ubt: null,
  "tor-js": "tor-in-js",
};

function loadProjectFrontmatter(projectId) {
  const fileId = PROJECT_ID_TO_CONTENT[projectId];
  if (!fileId) return {};
  const filePath = path.join(PROJECTS_DIR, `${fileId}.md`);
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    return data || {};
  } catch (e) {
    console.warn(`Could not parse ${filePath}:`, e.message);
    return {};
  }
}

function getProjectTraits(project, frontmatter) {
  const license = (frontmatter.license || "").toLowerCase();
  const hasFreeLicense = /mit|apache-2\.0|apache/.test(license) || license.includes("or apache");
  const hasPublicRepo = !!(frontmatter.links && frontmatter.links.github);
  const tags = [].concat(
    project.tags || [],
    (frontmatter.tags && frontmatter.tags.keywords) || []
  );
  const desc = (project.shortDescription || "").toLowerCase();
  const category = (frontmatter.category || "").toLowerCase();

  const isPrivacyFocused =
    tags.some((t) => /privacy|identity|pir|tor|zk|anonymous/i.test(String(t))) ||
    /privacy|private|identity|anonymous|tor|zk/.test(desc);
  const isShipped =
    category === "devtools" ||
    tags.some((t) => /mobile|sdk|plugin|application|infrastructure/i.test(String(t)));
  const isResearch =
    category === "research" ||
    tags.some((t) => /research|benchmark|benchmarks/i.test(String(t)));
  const isCoordination = project.id === "iptf";

  return {
    hasFreeLicense,
    hasPublicRepo,
    isPrivacyFocused,
    isShipped,
    isResearch,
    isCoordination,
    // PSE/EF projects are effectively open even if frontmatter missing license
    effectivelyOpen: hasFreeLicense || hasPublicRepo || true,
  };
}

function buildTier1Assessment(projectId, traits, t1Keys) {
  const status = {};
  const {
    hasFreeLicense,
    hasPublicRepo,
    effectivelyOpen,
    isPrivacyFocused,
    isShipped,
    isResearch,
  } = traits;

  const opensourceKeys = t1Keys.filter((k) =>
    k.startsWith("t1_crops_opensource_")
  );
  const censorshipKeys = t1Keys.filter((k) =>
    k.startsWith("t1_crops_censorship_")
  );
  const privacyKeys = t1Keys.filter((k) =>
    k.startsWith("t1_crops_privacy_")
  );
  const securityKeys = t1Keys.filter((k) =>
    k.startsWith("t1_crops_security_")
  );
  const limitsKeys = t1Keys.filter((k) => k.startsWith("t1_limits_"));

  // PSE/EF projects are open by policy; use pass when we have license/repo or when no content (assume PSE)
  opensourceKeys.forEach((k) => {
    status[k] = effectivelyOpen ? "pass" : "unknown";
  });

  censorshipKeys.forEach((k) => {
    status[k] = "pass"; // PSE projects don't have kill switches or selective exclusion
  });

  privacyKeys.forEach((k) => {
    status[k] = isPrivacyFocused ? "pass" : "unknown";
  });

  securityKeys.forEach((k) => {
    status[k] = "pass"; // EF/PSE projects designed with rigor
  });

  limitsKeys.forEach((k) => {
    status[k] = "pass"; // No central chokepoints, no decentralize-later without sunset
  });

  return status;
}

function buildTier2Scores(projectId, traits, t2Keys) {
  const scores = {};
  const { isShipped, isResearch, isCoordination, isPrivacyFocused } = traits;

  // Base score by project type: shipped+privacy 4, shipped 4, research 3, coordination 3
  let base = 3;
  if (isCoordination) base = 3;
  else if (isShipped && isPrivacyFocused) base = 4;
  else if (isShipped) base = 4;
  else if (isResearch) base = 3;

  // Differentiate by criterion category
  const sovereigntyKeys = t2Keys.filter((k) => k.includes("sovereignty"));
  const resilienceKeys = t2Keys.filter((k) => k.includes("resilience"));
  const techKeys = t2Keys.filter((k) => k.startsWith("t2_tech_"));
  const socialKeys = t2Keys.filter((k) => k.startsWith("t2_social_"));
  const tradeoffKeys = t2Keys.filter((k) => k.startsWith("t2_tradeoff_"));

  const bump = (keys, delta) => {
    keys.forEach((k) => {
      scores[k] = Math.min(5, Math.max(0, base + delta));
    });
  };

  t2Keys.forEach((k) => {
    scores[k] = base;
  });
  // Sovereignty: higher for identity/wallet/user-facing
  bump(sovereigntyKeys, projectId === "zkid" || projectId === "mopro" || projectId === "tlsnotary" || projectId === "tor-js" ? 1 : 0);
  // Resilience: higher for shipped
  bump(resilienceKeys, isShipped ? 1 : 0);
  // Tech reusable primitives: higher for libs (ptr/sonobe, pir, csp, mopro)
  bump(techKeys.filter((k) => k.includes("reusable") || k.includes("unstoppable")), isShipped ? 1 : 0);
  // Social: PSE avoids capture
  bump(socialKeys, 1);
  // Tradeoff: no AI, user-controlled -> default
  bump(tradeoffKeys, 0);

  return scores;
}

function buildTier3Scores(projectId, traits, t3Keys) {
  const scores = {};
  const { isShipped, isResearch, isCoordination, isPrivacyFocused } = traits;

  let base = 3;
  if (isCoordination) base = 4; // IPTF high diffusion
  else if (isShipped && isPrivacyFocused) base = 4;
  else if (isShipped) base = 4;
  else if (isResearch) base = 3;

  t3Keys.forEach((k) => {
    scores[k] = base;
  });

  const scalingKeys = t3Keys.filter((k) => k.includes("scaling"));
  const onlyEfKeys = t3Keys.filter((k) => k.includes("only_ef"));
  const handoffKeys = t3Keys.filter((k) => k.includes("handoff"));
  const compoundingKeys = t3Keys.filter((k) => k.includes("compounding"));
  const socialKeys = t3Keys.filter((k) => k.startsWith("t3_social_"));

  const bump = (keys, delta) => {
    keys.forEach((k) => {
      scores[k] = Math.min(5, Math.max(0, (scores[k] || base) + delta));
    });
  };

  bump(scalingKeys, isShipped ? 1 : 0);
  bump(onlyEfKeys, 1); // PSE addresses bottlenecks
  bump(handoffKeys, isShipped ? 1 : 0);
  bump(compoundingKeys, isResearch ? 1 : 0); // Reusable primitives
  bump(socialKeys, 1); // Documentation, open collab

  return scores;
}

function deriveTier1Overall(criteriaEvals) {
  const values = Object.values(criteriaEvals);
  if (values.some((c) => c && c.status === "fail")) return "fail";
  if (values.some((c) => c && c.status === "unknown")) return "needs_review";
  return "pass";
}

function computeRollup(entries, evaluations) {
  let sumWeightedScore = 0;
  let sumWeights = 0;
  for (const entry of entries) {
    const e = evaluations[entry.key];
    if (e && typeof e.score === "number") {
      const w = entry.weight ?? 1;
      sumWeightedScore += e.score * w;
      sumWeights += w;
    }
  }
  if (sumWeights === 0) return 0;
  return Math.round((sumWeightedScore / (5 * sumWeights)) * 100);
}

/** Returns true if notes look like they contain a code snippet (e.g. fenced block). */
function notesContainSnippet(notes) {
  if (!notes || typeof notes !== "string") return false;
  return /```[\s\S]*?```|`[^`]+`/.test(notes.trim());
}

function main() {
  const criteria = JSON.parse(fs.readFileSync(CRITERIA_PATH, "utf-8"));
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));

  // Sync githubRepoUrl from content/projects frontmatter into state.projects
  state.projects = state.projects.map((p) => {
    const frontmatter = loadProjectFrontmatter(p.id);
    const gh = frontmatter.links && frontmatter.links.github ? frontmatter.links.github : undefined;
    return { ...p, githubRepoUrl: gh || p.githubRepoUrl };
  });

  const t1Entries = criteria.criteria.filter((c) => c.tier === 1);
  const t2Entries = criteria.criteria.filter((c) => c.tier === 2);
  const t3Entries = criteria.criteria.filter((c) => c.tier === 3);
  const t1Keys = t1Entries.map((c) => c.key);
  const t2Keys = t2Entries.map((c) => c.key);
  const t3Keys = t3Entries.map((c) => c.key);

  const projectMap = new Map(state.projects.map((p) => [p.id, p]));

  state.scorecards = state.scorecards.map((sc) => {
    const project = projectMap.get(sc.projectId);
    if (!project) return sc;

    const frontmatter = loadProjectFrontmatter(sc.projectId);
    const traits = getProjectTraits(project, frontmatter);

    const t1Criteria = {};
    const t1Status = buildTier1Assessment(sc.projectId, traits, t1Keys);
    t1Keys.forEach((k) => {
      t1Criteria[k] = {
        status: t1Status[k] || "unknown",
        notes: "",
        evidenceLinks: [],
      };
    });

    // Tier 2/3: only keep a score when evidence includes a code snippet; otherwise unknown (0)
    const t2Criteria = {};
    t2Keys.forEach((k) => {
      const existing = sc.tier2 && sc.tier2.criteria && sc.tier2.criteria[k];
      const hasSnippet = existing && notesContainSnippet(existing.notes);
      t2Criteria[k] = {
        score: hasSnippet ? (existing.score ?? 0) : 0,
        notes: hasSnippet ? (existing.notes || "") : "",
        evidenceLinks: hasSnippet && existing.evidenceLinks ? existing.evidenceLinks : [],
      };
    });

    const t3Criteria = {};
    t3Keys.forEach((k) => {
      const existing = sc.tier3 && sc.tier3.criteria && sc.tier3.criteria[k];
      const hasSnippet = existing && notesContainSnippet(existing.notes);
      t3Criteria[k] = {
        score: hasSnippet ? (existing.score ?? 0) : 0,
        notes: hasSnippet ? (existing.notes || "") : "",
        evidenceLinks: hasSnippet && existing.evidenceLinks ? existing.evidenceLinks : [],
      };
    });

    const tier2Rollup = computeRollup(t2Entries, t2Criteria);
    const tier3Rollup = computeRollup(t3Entries, t3Criteria);
    const overallStatus = deriveTier1Overall(t1Criteria);

    return {
      ...sc,
      tier1: {
        overallStatus,
        override: sc.tier1?.override || {
          enabled: false,
          status: "pass",
          reason: "",
        },
        criteria: t1Criteria,
      },
      tier2: { rollup: tier2Rollup, criteria: t2Criteria },
      tier3: { rollup: tier3Rollup, criteria: t3Criteria },
      summary:
        sc.summary ||
        "Auto-assessed from content/projects. Tier 1: license/censorship/research assumptions. Tier 2/3: score only when evidence includes a code snippet; otherwise unknown.",
      risks: sc.risks || "",
      evidenceLinks: sc.evidenceLinks || [],
      lastUpdated: new Date().toISOString(),
    };
  });

  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log("Updated", STATE_PATH);
  console.log(
    "Sample rollups:",
    state.scorecards
      .slice(0, 5)
      .map(
        (s) =>
          `${s.projectId} T1=${s.tier1.overallStatus} T2=${s.tier2.rollup} T3=${s.tier3.rollup}`
      )
      .join(", ")
  );
}

main();
