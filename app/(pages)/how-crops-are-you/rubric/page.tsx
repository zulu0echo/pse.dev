import Link from "next/link"

export const metadata = {
  title: "Assessment rubric",
  description:
    "Repo-assessment rubric for CROPS: how to conduct the analysis, what to look for in a GitHub repo, and how to score each criterion consistently.",
}

export default function HowCropsRubricPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8">
      <div className="flex items-center gap-4">
        <Link
          href="/how-crops-are-you"
          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← How CROPS are you?
        </Link>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Repo-assessment rubric
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          For each Mandate criterion, this page gives (a) what it <em>means in practice</em>, (b){" "}
          <strong>what to look for in a GitHub repo</strong>, and (c){" "}
          <strong>how to score it</strong> consistently. All criteria are grounded in the EF Mandate, especially the CROPS section and Principles for Action.
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Optimized for <em>assessing repos</em>: social-pillar items are translated into evidence in repo artifacts (docs, governance files, licensing, reproducibility, etc.).
        </p>
      </header>

      {/* Scoring model */}
      <section className="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/80">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Scoring model (use across all criteria)
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Use a consistent <strong>0–3 scale</strong>:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-600 dark:text-neutral-400">
          <li><strong>0</strong> = No evidence / contradicts</li>
          <li><strong>1</strong> = Partial / aspirational claims only</li>
          <li><strong>2</strong> = Implemented but with gaps / unproven</li>
          <li><strong>3</strong> = Strong evidence, tested, and maintainable</li>
        </ul>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          And two flags:
        </p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-neutral-600 dark:text-neutral-400">
          <li><strong>Hard Gate (HG):</strong> if violated, the repo can’t be considered mandate-aligned regardless of other scores (e.g. license not free/open; obvious privileged black-box).</li>
          <li><strong>Risk Note:</strong> short explanation of the most important caveat.</li>
        </ul>
      </section>

      {/* A) CROPS */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          A) CROPS (Hard-gated technical properties)
        </h2>

        <CriterionCard
          id="A1"
          title="A1. Censorship Resistance (HG)"
          meaning="“No actor can selectively exclude valid use… maximally unstoppable… no centralized intermediaries or kill switches… resistant to extra-technical pressure.”"
          repoEvidence={[
            "Architecture docs: dependency map shows whether critical path relies on a single hosted service / admin key / allowlist.",
            "Code: presence of “denylist/allowlist” enforcement, privileged admin functions, centralized relay requirements, forced vendor routing.",
            "Operational docs: can users run it permissionlessly? Is there an “escape hatch” (alt backends, p2p fallback, offline mode)?",
            "Threat model: includes censorship adversary (RPC blocking, relay cartel, app store removal, legal pressure).",
          ]}
          scoring={[
            "0: central chokepoint required; kill switch; mandatory allowlists.",
            "1: claims CR but relies on centralized service in critical path.",
            "2: designed for CR but still has default chokepoints or weak fallback.",
            "3: permissionless-by-default + documented, tested routing around censorship.",
          ]}
        />

        <CriterionCard
          id="A2"
          title="A2. Open Source & Free “as in Freedom” (HG)"
          meaning="“No privileged code or hidden specifications… public and auditable… forkable… no source-available licenses… supported projects must pledge they will not change their open source or copyleft license.”"
          repoEvidence={[
            "LICENSE file: OSI-approved or strong copyleft; not “source-available”, not “commons clause”, etc.",
            "Spec openness: protocol formats, APIs, cryptographic constructions documented.",
            "Build provenance: scripts to build from source; no closed blobs required for core function.",
            "“License change pledge”: explicit statement in docs or governance (if relevant).",
          ]}
          scoring={[
            "0: non-free / source-available / missing license.",
            "1: open-ish but critical parts undocumented or depend on closed components.",
            "2: open and buildable; some unclear specs or heavy external dependencies.",
            "3: fully auditable, forkable, reproducible builds, clear specs, explicit stability pledge.",
          ]}
        />

        <CriterionCard
          id="A3"
          title="A3. Privacy (HG for privacy-relevant repos; otherwise normal)"
          meaning="“User data not exposed beyond necessity… maximal privacy as default… unconditional privacy must be protocol-level viable… users must not be required to prove anything to obtain it.”"
          repoEvidence={[
            "Data flow docs: what user data is collected, stored, logged, exported.",
            "Defaults: privacy-preserving by default vs opt-in.",
            "Telemetry: is it present? opt-in? local-only? clearly documented?",
            "Cryptography: if claims privacy, shows protocol-level mechanism; not just “use Tor/VPN”.",
          ]}
          scoring={[
            "0: leaks/collects data by default; opaque telemetry; requires “prove identity” for privacy.",
            "1: privacy mentioned but no concrete mechanisms; privacy is an add-on.",
            "2: privacy mechanisms exist; defaults still leaky or rely on trusted operator.",
            "3: privacy-by-default + clear threat model + minimal metadata + tests.",
          ]}
        />

        <CriterionCard
          id="A4"
          title="A4. Security (HG for security-critical repos; otherwise normal)"
          meaning="“Does what it claims, no more no less… rigorous designs… simplicity/verifiability… high threshold for new protocol domains… governance minimization… walkaway test for users (avoid forced complex migrations)… protect from failure, entrapment, coercion.”"
          repoEvidence={[
            "SECURITY.md: disclosure process, threat model, security assumptions.",
            "Audits / formal verification links, fuzzing, property tests, CI quality gates.",
            "Simplicity: modularity, small trusted computing base, avoidance of “magic” dependencies.",
            "Upgrade/admin: timelocks, multisig transparency, minimized privileged actions.",
            "Migration docs: stable formats, backward compatibility, safe upgrades.",
          ]}
          scoring={[
            "0: unsafe patterns, no tests, admin-key god mode, unclear claims.",
            "1: basic CI/tests; no threat model; security posture implicit.",
            "2: solid testing + partial threat modeling; some privileged controls remain.",
            "3: strong assurance practices + minimized privileges + clear invariants + upgrade safety.",
          ]}
        />
      </section>

      {/* B) No new leverage */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          B) “No new leverage” / anti-chokepoint design
        </h2>

        <CriterionCard
          id="B1"
          title="B1. No privileged intermediaries / no “secret sauce” layer (HG when present)"
          meaning="Avoid closed components, whitelists, soft-default routing, dependency-heavy integrations that create leverage."
          repoEvidence={[
            "Closed binaries, opaque SaaS dependency, mandatory proprietary API keys.",
            "“Default route” hardcoded to one provider / preferred relays.",
            "Whitelisted provider sets in config.",
          ]}
          scoring={[
            "0: privileged intermediary required.",
            "1: intermediary is default + hard to avoid.",
            "2: intermediary exists but optional + documented escape.",
            "3: open market / permissionless set + easy substitution.",
          ]}
        />

        <CriterionCard
          id="B2"
          title="B2. Credible exit paths (“forkability” in practice)"
          meaning="“Predictable exit paths… unacceptable friction to forking.”"
          repoEvidence={[
            "Clear contributor docs enabling community forks (CONTRIBUTING.md).",
            "No trademark/policy traps blocking forks from operating.",
            "Minimal reliance on hosted infra; easy to self-host.",
          ]}
          scoring={[
            "0: fork blocked by license/policy/dependency.",
            "1: fork possible but practically unusable.",
            "2: fork feasible with effort; docs exist.",
            "3: fork/alternative operators are first-class supported.",
          ]}
        />

        <CriterionCard
          id="B3"
          title="B3. Anti-entrenchment / “decentralize later” skepticism"
          meaning="Prefer fully-CROPS from the beginning; be suspicious of “we’ll remove chokepoints later.”"
          repoEvidence={[
            "Roadmap issues: does it repeatedly postpone removal of trust assumptions?",
            "Architecture: temporary trust assumptions have enforceable sunset plan?",
            "Tests: demonstrates ability to run without privileged infra.",
          ]}
          scoring={[
            "0: centralization now + vague future decentralization.",
            "1: roadmap mentions decentralization without enforceable plan.",
            "2: concrete plan with milestones; partial implementation.",
            "3: trust-minimized now; any exceptions tightly bounded + sunset-tested.",
          ]}
        />
      </section>

      {/* C) User agency */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          C) User agency over paternalism
        </h2>

        <CriterionCard
          id="C1"
          title="C1. User-controlled defenses (not forced restrictions)"
          meaning="Defenses should be user-empowering, opt-in/opt-out, transparent; avoid silent blocking, steering, uninspectable AI copilot, reporting “back home.”"
          repoEvidence={[
            "Config options: allow override paths; transparent rule sets.",
            "Lists/filters: multiple sources supported; local verification; user can disable.",
            "AI components: model inspectability, local execution, no silent reporting.",
          ]}
          scoring={[
            "0: silent enforcement/steering; no override.",
            "1: some knobs but defaults are paternalistic.",
            "2: user controls exist; defaults could be better explained.",
            "3: user sovereignty-by-default; transparency + override are first-class.",
          ]}
        />
      </section>

      {/* D) Discipline */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          D) “Discipline” translated into repo hygiene
        </h2>

        <CriterionCard
          id="D1"
          title="D1. Legibility via documentation"
          meaning="“Make their work legible through comprehensive and open documentation… publish early… invite critique.”"
          repoEvidence={[
            "README explains purpose, non-goals, architecture, threat model, assumptions.",
            "Specs in repo (or linked) + rationale docs.",
            "Examples, tutorials, diagrams; changelog.",
          ]}
          scoring={[
            "0: barely any docs.",
            "1: README only; unclear assumptions.",
            "2: architecture/spec docs; some gaps.",
            "3: thorough docs + threat model + rationale + onboarding.",
          ]}
        />

        <CriterionCard
          id="D2"
          title="D2. Reproducibility & verifiability"
          meaning="“Work must be verifiable to many… simplicity… public and auditable.”"
          repoEvidence={[
            "Deterministic builds, lockfiles, pinned toolchains, release attestations.",
            "CI proves builds/tests; minimal “works on my machine”.",
          ]}
          scoring={[
            "0: not buildable.",
            "1: buildable but flaky/unpinned.",
            "2: reproducible for contributors; some gaps.",
            "3: reproducible releases + verification docs.",
          ]}
        />

        <CriterionCard
          id="D3"
          title="D3. Mission-critical reliability"
          meaning="“Make sure what we ship is mission-critically reliable.”"
          repoEvidence={[
            "Test coverage, fuzzing, chaos testing, benchmarks where relevant.",
            "Release discipline: versioning, changelog, deprecation policy.",
          ]}
          scoring={[
            "0: no tests/release discipline.",
            "1: basic tests.",
            "2: strong tests + some reliability practices.",
            "3: robust assurance + operational playbooks.",
          ]}
        />
      </section>

      {/* E) Only-EF rule */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          E) Only-EF rule / upstream leverage
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Harder to infer from a repo alone; assess <em>signals</em>.
        </p>

        <CriterionCard
          id="E1"
          title="E1. Upstream, reusable primitives (high leverage)"
          meaning="“As far upstream and high leverage as possible… primitives… specs… tooling… evaluation methods… freely reused, extended, operated independently.”"
          repoEvidence={[
            "Library/primitive nature vs bespoke product.",
            "Reuse signals: modular API, integration guides, minimal coupling.",
            "Standards/spec alignment, reference implementations.",
          ]}
          scoring={[
            "0: tightly coupled one-off.",
            "1: reusable in theory but coupled in practice.",
            "2: reusable modules + docs.",
            "3: clear primitive/spec/tooling with broad reuse affordances.",
          ]}
        />

        <CriterionCard
          id="E2"
          title="E2. Dependency reduction / “subtraction for resilience”"
          meaning="“Ethereum more resilient when it does not depend on us… bias toward work that makes us less necessary.”"
          repoEvidence={[
            "Maintainer bus factor documentation; multi-maintainer ownership.",
            "Governance/roadmap encourages external maintainers.",
            "Handoff plan or ecosystem adoption strategy.",
          ]}
          scoring={[
            "0: single-person critical repo, no process.",
            "1: a few maintainers, no continuity plan.",
            "2: shared ownership + contribution pathways.",
            "3: explicit handoff/continuity + active external contribution.",
          ]}
        />
      </section>


      {/* Matrix columns */}
      <section className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
          Matrix columns (GitHub-specific)
        </h2>
        <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
          For each criterion row, add these columns:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li><strong>Signal(s) to check</strong> — files/paths (e.g. LICENSE, SECURITY.md, docs/architecture.md)</li>
          <li><strong>Pass/Fail hard gate</strong> — Y/N</li>
          <li><strong>Score (0–3)</strong></li>
          <li><strong>Evidence link</strong> — file path + commit/tag</li>
          <li><strong>Risk note</strong> — 1–2 lines</li>
        </ul>
      </section>

      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/how-crops-are-you"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to How CROPS are you?
        </Link>
      </div>
    </div>
  )
}

function CriterionCard({
  id,
  title,
  meaning,
  repoEvidence,
  scoring,
}: {
  id: string
  title: string
  meaning: string
  repoEvidence: string[]
  scoring: string[]
}) {
  return (
    <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        <strong>Meaning:</strong> {meaning}
      </p>
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Repo evidence to check
        </h4>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-neutral-600 dark:text-neutral-400">
          {repoEvidence.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Scoring guidance
        </h4>
        <ul className="mt-1 space-y-0.5 text-sm text-neutral-600 dark:text-neutral-400">
          {scoring.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

