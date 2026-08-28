# Interactive Web Tutorial Plan — "Securing LLMs in the Enterprise"

*A MECE (Mutually Exclusive, Collectively Exhaustive) build plan for a highly interactive React tutorial teaching enterprise LLM security, grounded in [`llm-enterprise-security-research.md`](./llm-enterprise-security-research.md).*

---

## 0. How to read this plan

The plan is organized into MECE trees at two levels:

- **Content tree (Part A)** — every concept the tutorial teaches, partitioned so each idea lives in exactly one module and the modules together cover the whole research doc.
- **Build tree (Part B)** — every engineering workstream, partitioned so no two workstreams overlap and together they ship the product.

MECE check at each level is stated explicitly. Nothing in the research doc should be un-homed; nothing should appear twice.

> **Cross-cutting requirement — every reference is openable (applies to all modules).**
> Throughout the tutorial, *every* external reference the learner encounters — every cited paper (arXiv/USENIX), CVE, OWASP/NIST/MITRE framework entry, tool/vendor, and every research-doc §-anchor — is a live, openable element, never inert text. Concretely:
> - Each citation renders as a **`<Citation>` component** (not a bare hyperlink) that, on click/Enter, opens a **slide-over reference panel** showing the title, authors, venue/date, a one-paragraph plain-language summary, the exact claim being cited *as used in this tutorial*, and a "Open source ↗" button to the canonical URL (new tab). This keeps the learner in-flow instead of losing them to a browser tab.
> - Citations are **keyboard-focusable, screen-reader-labelled** (`aria-label="Reference: <short-title>, opens reference panel"`), and visually marked as interactive.
> - Internal `research §x` anchors open the same panel scoped to that section's summary, with a link into the full research doc.
> - A per-module **"References"** drawer lists every source that module touches; a global **Bibliography** view aggregates all of them, deduplicated, each entry openable.
> - **Data source:** one typed `references.ts` registry (id → {title, authors, venue, date, url, summary, claimAsUsed}); components reference sources by id so no URL or citation text is ever hand-duplicated. This registry is owned by workstream **B4** and is a build-gate artifact (§Part D).

---

## Part A — Content architecture (MECE by learner concept)

**Partition principle:** the learner journey is split by *cognitive stage* — Understand the threat → Experience it → Learn defenses → Confront the limits → Apply. Each concept from the research maps to exactly one stage.

### Module 0 — Orientation & threat model (Understand)
- **Learning objective:** learner can state why LLM security differs from classical appsec (instruction/data non-separation) and name the trifecta.
- **Content source:** research §1, §2.1, §3.1.
- **Interactive elements:**
  - `TokenStreamViz` — animated context window showing system prompt / user input / retrieved doc / tool output rendered as *indistinguishable* token streams. Learner toggles "what the model sees" vs. "what we wish it saw."
  - `TrifectaBuilder` — drag the three legs (private data, untrusted content, external comms) onto an agent; the danger meter arms only when all three are present.
- **Assessment:** classify 5 sample systems as trifecta-complete or not.

### Module 1 — The OWASP LLM Top 10 map (Understand)
- **Objective:** learner can locate any concrete vulnerability on the OWASP 2025 taxonomy.
- **Source:** research §2.1, §2.2.
- **Interactive:** `RiskMatrix` — clickable 10-cell grid; each cell expands to a real incident + the framework (NIST/ATLAS/OWASP) that governs it. Filter by "new in 2025."
- **Assessment:** given an incident description, tag the correct OWASP ID.

### Module 2 — Attack sandbox: Prompt Injection (Experience)
- **Objective:** learner successfully executes a direct and an indirect injection against a simulated assistant.
- **Source:** research §3.1 (incl. EchoLeak).
- **Interactive:** `InjectionPlayground` — a mock email/RAG assistant (fully client-side, scripted responses — **no live LLM calls**). Learner edits an incoming email's hidden text and watches the assistant exfiltrate a "secret" into a rendered link. Reproduces EchoLeak's shape in miniature.
- **Assessment:** achieve exfiltration, then identify which trifecta leg to cut.

### Module 3 — Attack sandbox: Jailbreaks, RAG poisoning, Tool/MCP poisoning (Experience)
- **Objective:** learner sees the three other headline attack classes hands-on.
- **Source:** research §3.2, §3.3, §3.4, §3.5.
- **Interactive (three linked labs):**
  - `SuffixLab` — append a mock adversarial suffix; watch a refusal flip to compliance; visualize "attention hijacking" as highlighted tokens (illustrative, from §3.2).
  - `RAGPoisonLab` — inject one poisoned passage into a corpus; watch it dominate the retrieved answer (PoisonedRAG shape, single-doc variant).
  - `MCPPoisonLab` — edit a tool description; watch the agent silently follow embedded instructions (Tool Poisoning shape).
- **Assessment:** for each lab, name the OWASP ID and the root cause.

### Module 4 — Defenses that hold (Learn)
- **Objective:** learner can apply architectural defenses and explain *why* they're deterministic vs. probabilistic.
- **Source:** research §4.1, §4.2, §4.3.
- **Interactive:**
  - `DefensePatternPicker` — choose one of the six patterns from arXiv:2506.08837 (Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM, Code-Then-Execute, Context-Minimization) for a given workflow; simulator shows residual capability vs. residual risk. Human-in-the-loop is presented separately as a cross-cutting control, not one of the six.
  - `CaMeLFlow` — animated data-flow/capability-tag walkthrough showing why untrusted data can't reach control flow.
  - `ArchitectureBuilder` (capstone-lite) — assemble the §4.3 defense-in-depth stack; each layer added updates a live risk score.
- **Assessment:** re-secure the Module 2 assistant by cutting a trifecta leg; verify exfiltration now fails.

### Module 5 — The indefensible frontier (Confront)
- **Objective:** learner can articulate what *cannot* currently be prevented and why, and avoid overclaiming.
- **Source:** research §6 (all subsections) + §3.6 guardrail limits.
- **Interactive:**
  - `GuardrailGauntlet` — learner plays attacker against a probabilistic guardrail with unlimited attempts; fragmentation/rephrasing eventually gets through; a counter shows attacker-success-over-time, driving home "rate limiter, not boundary."
  - `IndefensibleMap` — the 8 indefensible areas (§6.1–6.8) as an interactive tree tracing each back to the single root cause (instruction/data non-separation) plus the two force multipliers.
- **Assessment:** critique a vendor claim ("our guardrail stops all prompt injection") and explain the flaw.

### Module 6 — Apply: enterprise decision workshop (Apply)
- **Objective:** learner makes a go/no-go and architecture decision for a realistic enterprise scenario.
- **Source:** synthesizes all prior; research §4.3, §5, §6.
- **Interactive:** `ScenarioSimulator` — branching case study (e.g. "AI assistant over the company inbox"). Learner chooses model source, data access, tool scope, egress policy, guardrail posture; the simulator narrates the resulting incident or safe outcome, mapped to MITRE ATLAS techniques.
- **Assessment:** produce a scored risk memo (auto-generated from choices) the learner can export.

**MECE verification (content):**
- *Mutually exclusive:* each research section maps to one module — §1/§2→M0–M1, §3.1→M2, §3.2–3.5→M3, §4→M4, §3.6/§6→M5, §5/synthesis→M6. No concept taught twice (cross-references, not repetition).
- *Collectively exhaustive:* every research section (§1–§6) and every OWASP Top 10 item is assigned. Coverage matrix maintained in `content/coverage-matrix.md` as a build gate.

---

## Part B — Engineering workstreams (MECE by build concern)

**Partition principle:** split by *technical concern* so two developers never touch the same surface. Six workstreams, no overlap.

### B1 — App shell, routing & state
- React 18 + TypeScript, built and run with **Bun** (not npm) as package manager and script runner. Vite for the dev/build toolchain, output as a static bundle. React Router for module navigation; deep links per module/lab.
- Global progress state (Zustand) — completion, assessment scores, learner's saved architecture choices. Persist to `localStorage`.
- Layout: left module rail, main content, right "concept inspector" panel.
- **Owns:** routing, layout, persistence, progress model. **Touches no lab logic.**

### B2 — Simulation engine (the interactive core)
- A single deterministic, **client-side** simulation kernel powering all labs — **no external LLM API calls** (safety, reproducibility, offline, zero cost, no data egress from a security tutorial).
- Scripted "model" = a rules/state-machine responder keyed to learner inputs, returning pre-authored responses that demonstrate the real attack mechanics.
- Shared primitives: `ContextWindow`, `ScriptedAgent`, `ToolRegistry`, `Corpus`, `Guardrail(prob)`, `ExfilChannel`. Each lab composes these.
- **Owns:** all attack/defense logic. **This is the highest-value, highest-risk workstream — build first, harden with unit tests.**

### B3 — Interactive components & visualizations
- Reusable viz kit: `TokenStreamViz`, `TrifectaBuilder`, `RiskMatrix`, `AttentionHighlight`, `DataFlowDiagram`, `RiskScoreMeter`, `AttackSuccessChart`.
- Drag-and-drop (dnd-kit); animation (Framer Motion); diagrams as inline SVG/React (self-contained, theme-aware, accessible).
- **Owns:** presentational interactive widgets. Consumes B2 state via props; contains no business logic.

### B4 — Content & assessment system
- MDX per module (prose + embedded interactive components). Content authored from the research doc; every claim carries a citation back to the source paper.
- **Reference system (see cross-cutting requirement above):** the typed `references.ts` registry + the `<Citation>` component + slide-over reference panel + per-module References drawer + global Bibliography. Every citation in copy is authored as `<Citation id="..."/>`, never a raw link, so all references are guaranteed openable and no source text is duplicated. Owns the registry's completeness.
- Assessment framework: question types (classify, tag, achieve-goal, critique), auto-grading, feedback. Assessment definitions in typed data files.
- `coverage-matrix.md` gate ensuring MECE content completeness.
- **Owns:** all copy, citations, reference registry, questions. **Touches no rendering internals.**

### B5 — Design system, accessibility & theming
- Tokenized light/dark theme; WCAG 2.2 AA (keyboard-navigable labs, ARIA for drag-drop and live regions announcing simulation outcomes, non-color-dependent risk signaling).
- Typography/spacing scale; responsive (wide labs scroll within their own container, page never scrolls horizontally).
- **Owns:** tokens, a11y patterns, responsive rules. Cross-cutting but delivered as shared CSS/util layer, not per-component overrides.

### B6 — Build, test, deploy
- **Bun** is the package manager, script runner, and test runner (`bun install`, `bun run`, `bun test`) — not npm. Vitest for unit (esp. B2 kernel), Playwright for e2e (per lab happy-path + a11y smoke), both invoked via Bun.
- CI (Bun-based): typecheck, lint, test, coverage-matrix check, reference-integrity check, build.
- **Local build & dev under Miniflare** to mirror the Cloudflare runtime; **deployed to Cloudflare Pages** as a static single-page bundle. No backend and no live LLM — reinforces the "no data egress" property that is itself part of the subject matter.
- **Owns:** tooling, CI, Cloudflare Pages deploy, Miniflare local. **Touches no product code.**

**MECE verification (build):**
- *Mutually exclusive:* concerns are disjoint — shell (B1) ≠ logic (B2) ≠ widgets (B3) ≠ content (B4) ≠ design/a11y (B5) ≠ infra (B6). Dependency direction is one-way: B3/B4 depend on B2; B5 is cross-cutting utilities only; B6 wraps all.
- *Collectively exhaustive:* every artifact the app needs (route, state, sim logic, widget, copy, question, theme, test, pipeline) belongs to exactly one workstream.

---

## Part B addendum — Frontend performance conventions (Vercel React best practices)

Stack reminder: React 18 + TypeScript, Vite bundling, Bun tooling, **static Cloudflare Pages, no SSR/RSC/Next.js, no backend, no remote data fetching**. That scoping decides which Vercel rules apply.

**Not applicable (stated so nobody adds a backend to satisfy an irrelevant rule):**
- The entire **Server-Side Performance** category (RSC caching, server actions, `after()`, server parallel fetching) — there is no server.
- The **data-waterfall** rules (`async-parallel`, `async-api-routes`, `async-dependencies`, …) — no remote/async data; all model behaviour is synchronous scripted-kernel calls. The one waterfall-adjacent rule we *do* use is `async-suspense-boundaries` (for code-split loading).
- `bundle-defer-third-party` — no third-party analytics/logging (the no-egress property).

**Applied globally (and embedded per-design in each Ceetrix design's "Performance conventions" section):**
- **Bundle:** code-split every module and heavy lab/sim behind `React.lazy` + `Suspense` (`bundle-dynamic-imports`, `async-suspense-boundaries`); direct imports, no barrel files (`bundle-barrel-imports`); load feature modules only when activated (`bundle-conditional`); preload the next module on rail hover/focus (`bundle-preload`).
- **localStorage:** the progress store uses a **versioned, minimal schema** with cached reads (`client-localstorage-schema`, `js-cache-storage`).
- **Init-once:** sim kernel, progress store, and runtime guards initialize a single time per app load (`advanced-init-once`).
- **Re-render:** derive state during render, never in effects (`rerender-derived-state-no-effect`); functional setState (`rerender-functional-setstate`); memoize expensive sim/viz components and hoist static JSX and default non-primitive props (`rerender-memo`, `rendering-hoist-jsx`, `rerender-memo-with-default-value`); never define components inside components (`rerender-no-inline-components`); hold transient high-frequency values (attempt counters, animation frames) in refs (`rerender-use-ref-transient-values`); use `startTransition`/`useDeferredValue` for non-urgent heavy updates — the gauntlet success chart, token-stream toggle, live risk score (`rerender-transitions`, `rerender-use-deferred-value`).
- **Rendering:** `content-visibility`/`Activity` for long lists and hidden panes — the 1000-doc corpus, the bibliography, off-stage module panes (`rendering-content-visibility`, `rendering-activity`); **animate a wrapper `div`, not the SVG** for every diagram/viz (`rendering-animate-svg-wrapper`) with reduced coordinate precision (`rendering-svg-precision`); ternaries not `&&` (`rendering-conditional-render`).
- **JS perf:** `Map`/`Set` for every repeated lookup — OWASP/adjacency tags, corpus retrieval, glossary, reference registry (`js-index-maps`, `js-set-map-lookups`); hoist RegExp out of loops (`js-hoist-regexp`); early-exit (`js-early-exit`); `requestIdleCallback` for non-critical work like trend recompute (`js-request-idle-callback`).
- **Events:** deduplicate global listeners; passive listeners for scroll (`client-event-listeners`, `client-passive-event-listeners`).

**Enforcement:** extend the Story 8 design-register lint with a lightweight perf-lint at implementation time (flag SVG-animated elements, barrel imports, and components-defined-in-components), so these conventions are checked in CI rather than left to reviewer memory.

---

## Part C — Delivery sequence

Ordered by dependency and de-risking (build the hard, load-bearing core first):

1. **Milestone 1 — Walking skeleton:** B1 shell + B6 CI + one trivial route. Proves the pipeline.
2. **Milestone 2 — Simulation kernel:** B2 primitives + unit tests. The technical crux; must be solid before any lab.
3. **Milestone 3 — Vertical slice:** Module 2 (`InjectionPlayground`) end-to-end through B2→B3→B4→B5. Validates the whole stack on the single most important interactive.
4. **Milestone 4 — Understand modules:** M0, M1 (lower interactivity, establishes framing).
5. **Milestone 5 — Experience/Learn modules:** M3 labs, M4 defenses (reuse kernel + viz kit).
6. **Milestone 6 — Confront/Apply:** M5 (`GuardrailGauntlet`, `IndefensibleMap`), M6 (`ScenarioSimulator`) — the differentiators.
7. **Milestone 7 — Hardening:** full a11y pass, coverage-matrix sign-off, e2e suite, performance.

---

## Part D — Guardrails on the build itself

- **Accuracy:** every teaching claim links to a paper in the research doc, and every statistic used has been verified against the primary source. Load-bearing figures (PoisonedRAG ~90% ASR with 5 texts / CorruptRAG >90% with a single text; MCPTox peak 72.8% on o1-mini across 45 servers & 353 tools; CaMeL 77% provably-secure vs 84% undefended; Andriushchenko et al. 100% adaptive-attack ASR) are cited inline with their exact conditions — never rounded up or stripped of caveats. Simulations are labeled "illustrative mechanics," not real model output.
- **Safety:** the tutorial teaches defense and demonstrates attacks in a sandbox; no live-weaponizable payloads, no real exfiltration endpoints, fully offline. This mirrors the subject matter — a security tutorial that itself has no data-egress vector.
- **No overclaiming:** Module 5 is load-bearing — the product's thesis is that parts of this problem are *unsolved*, and the tutorial must not imply otherwise.
- **References integrity (build gate):** CI fails if any `<Citation>` references an id missing from `references.ts`, if any registry entry lacks a resolvable URL/summary, or if any teaching claim in copy lacks a citation. A link-check job verifies every reference URL resolves. This operationalizes the cross-cutting "every reference is openable" requirement.
- **Definition of done:** coverage matrix 100% green (every research section homed), every reference openable and link-checked, all labs pass e2e, WCAG 2.2 AA verified, a learner completing M0–M6 can pass a final assessment drawn from all modules.

---

## Appendix — Concept → Module → Component traceability (build gate)

| Research section | Module | Primary component(s) |
|---|---|---|
| §1, §3.1 (trifecta, non-separation) | M0 | TokenStreamViz, TrifectaBuilder |
| §2.1, §2.2 (OWASP, frameworks) | M1 | RiskMatrix |
| §3.1 (prompt injection, EchoLeak) | M2 | InjectionPlayground |
| §3.2 (jailbreaks/suffixes) | M3 | SuffixLab |
| §3.3 (RAG poisoning) | M3 | RAGPoisonLab |
| §3.4, §3.5 (MCP/tool, training backdoors) | M3 | MCPPoisonLab |
| §4.1–4.3 (defenses, CaMeL, patterns) | M4 | DefensePatternPicker, CaMeLFlow, ArchitectureBuilder |
| §3.6, §6.1–6.8 (limits, indefensible) | M5 | GuardrailGauntlet, IndefensibleMap |
| §5 (enterprise deployment), synthesis | M6 | ScenarioSimulator |

*This table is the MECE enforcement mechanism: CI fails if any research section lacks a module+component assignment, or if any component claims a section already owned by another.*
