# Ceetrix Story Coverage — MECE check against the tech-design doc

*Compiled 2026-08-28. Verifies that the Ceetrix epic `llm-sec-tutorial` (13 active stories) covers the intended scope of [`interactive-tutorial-tech-design.md`](./interactive-tutorial-tech-design.md) losslessly and MECE. Every mapped doc section maps to exactly one owning story; module stories consume the cross-cutting machinery but do not own it (so there is no double-ownership). **Scope note:** §6 (product-team measurement) is intentionally deferred — the former Story 14 was removed pending a decision on cross-learner analytics (which would require server persistence, ruled out for now). §6 is the one doc section not currently mapped, by choice.*

## Story index

| Story | Title (outcome) | Owns doc section(s) |
|---|---|---|
| 1 | Discover why LLM security is different… | §3 Module 0 |
| 2 | Explore the OWASP LLM Top 10 as a living map | §3 Module 1 |
| 3 | Learn prompt injection by attacking… | §3 Module 2 |
| 4 | Tell jailbreaks, RAG & tool poisoning apart | §3 Module 3 |
| 7 | Tell defenses that hold from ones that slow | §3 Module 4 |
| 5 | Feel why guardrails are not a boundary | §3 Module 5 |
| 6 | Make and defend an enterprise go/no-go | §3 Module 6 |
| 8 | Learn effectively — learning science, not gimmicks | §1 principles + anti-patterns + closing design stance + global no-live-LLM |
| 9 | Always know where I am… | §2.1 learning shell |
| 10 | Learn from every interaction through consequences | §2.2 + §2.3 + §2.4 |
| 11 | Open any citation in place | §2.5 |
| 12 | Use the tutorial comfortably on any device… | §2.6 + §2.7 + §5 |
| 13 | Prove I truly understand… | §4 |
| — | *(deferred)* Product-team measurement | §6 — not currently built |

## Lossless coverage matrix — every doc element → owning anchor

| Doc element | Story | Capability anchor |
|---|---|---|
| §1 all 11 named principles (Kolb…Hattie/Shute) | 8 | x1.principle_traceability |
| §1 anti-pattern: seductive details | 8 | x1.no_seductive_details |
| §1 anti-pattern: gamification rewards clicking | 8 | x1.reward_reasoning_not_clicks |
| §1 anti-pattern: teaching attacks as spectacle | 8 | x1.attack_bookended_by_defense |
| §1 anti-pattern: false mastery (recognition) | 8 | x1.generation_for_mastery |
| Closing design stance (attack = means to insight) | 8 | x1.attack_bookended_by_defense (+ problem) |
| Global no-live-LLM safety (cited in M2/M3/§B2) | 8 | x1.no_live_llm |
| §2.1 three-pane shell | 9 | x2.three_pane |
| §2.1 cognitive-stage wayfinding | 9 | x2.stage_path |
| §2.1 one interaction at a time (segmenting) | 9 | x2.single_stage_focus |
| §2.1 concept inspector (adjacent elaboration) | 9 | x2.concept_inspector |
| §2.2 consequence (diegetic, no modal) | 10 | x3.consequence_first |
| §2.2 signal the causal element | 10 | x3.signal |
| §2.2 self-explanation before reveal | 10 | x3.self_explanation |
| §2.3 one new concept per interaction | 10 | x3.one_concept |
| §2.3 worked-example first contact | 10 | x3.worked_example_first |
| §2.3 progressive disclosure | 10 | x3.progressive_disclosure |
| §2.4 scaffolding ladder Watch→Complete→Do→Vary | 10 | x3.scaffolding_ladder |
| §2.5 citation is interactive not inert | 11 | x4.citation_component |
| §2.5 slide-over reference panel | 11 | x4.reference_panel |
| §2.5 confidence & caveat line | 11 | x4.claim_and_caveat |
| §2.5 internal anchors open same panel | 11 | x4.internal_anchor |
| §2.5 per-module drawer + global bibliography | 11 | x4.module_and_global_bib |
| §2.5 reference-integrity build gate | 11 | x4.registry_integrity |
| §2.6 explanatory motion only (200–400ms) | 12 | x5.explanatory_motion |
| §2.6 consistent interaction verbs | 12 | x5.consistent_verbs |
| §2.6 reduced-motion parity | 12 | x5.reduced_motion_parity |
| §2.7 ARIA live-region outcome announcements | 12 | x5.aria_outcomes |
| §2.7 keyboard equivalents for drag | 12 | x5.keyboard_equivalents |
| §3 M0 cold-open leak scene | 1 | m0.cold_open |
| §3 M0 reflective beat | 1 | m0.reflective_beat |
| §3 M0 TokenStreamViz | 1 | m0.token_stream_viz |
| §3 M0 TrifectaBuilder | 1 | m0.trifecta_builder |
| §3 M0 discovery-safe failure UX | 1 | m0.failure_recovery |
| §3 M0 5-system mastery check | 1 | m0.mastery_check |
| §3 M1 RiskMatrix living map | 2 | m1.risk_matrix |
| §3 M1 incident + framework expand | 2 | m1.incident_expand |
| §3 M1 "new in 2025" signaling | 2 | m1.new_2025_signal |
| §3 M1 interleaved completion state | 2 | m1.interleaved_completion |
| §3 M1 near-miss feedback | 2 | m1.near_miss_feedback |
| §3 M1 6-vignette interleaved mastery | 2 | m1.mastery_check |
| §3 M2 Watch / Complete / Do / Vary / Turn | 3 | m2.watch, m2.complete, m2.do_playground, m2.vary_transfer, m2.turn_to_defense |
| §3 M2 diagnostic reasoning trace + reset | 3 | m2.reasoning_trace |
| §3 M2 transfer+leg mastery check | 3 | m2.mastery_check |
| §3 M3 shared shell + root-cause ledger | 4 | m3.shared_shell, m3.root_cause_ledger |
| §3 M3 SuffixLab / RAGPoisonLab / MCPPoisonLab | 4 | m3.suffix_lab, m3.rag_poison_lab, m3.mcp_poison_lab |
| §3 M3 why-inspector failure UX | 4 | m3.why_inspector |
| §3 M3 novel-scenario mastery check | 4 | m3.mastery_check |
| §3 M4 CaMeLFlow / PatternPicker / ArchitectureBuilder | 7 | m4.camel_flow, m4.pattern_picker, m4.architecture_builder |
| §3 M4 re-run-and-fail aha | 7 | m4.aha_refail |
| §3 M4 weak-choice-consequence failure UX | 7 | m4.weak_choice_consequence |
| §3 M4 re-secure + justify mastery check | 7 | m4.mastery_check |
| §3 M5 prediction (cognitive-conflict) beat | 5 | m5.prediction_beat |
| §3 M5 GuardrailGauntlet success curve | 5 | m5.guardrail_gauntlet |
| §3 M5 IndefensibleMap tree | 5 | m5.indefensible_map |
| §3 M5 demoralization-guard framing | 5 | m5.demoralization_guard |
| §3 M5 vendor-claim critique mastery | 5 | m5.mastery_check |
| §3 M6 ScenarioSimulator (choices + ATLAS chips) | 6 | m6.scenario_simulator |
| §3 M6 full-circle EchoLeak incident | 6 | m6.full_circle_incident |
| §3 M6 exportable risk memo | 6 | m6.risk_memo |
| §3 M6 one-variable replay | 6 | m6.replay |
| §3 M6 memo-content mastery check | 6 | m6.mastery_check |
| §4 formative everywhere / summative sparse | 13 | x6.formative_everywhere |
| §4 interleaving across modules | 13 | x6.interleaving |
| §4 generation over recognition | 13 | x6.generation_over_recognition |
| §4 self-explanation graded on reasoning | 13 | x6.self_explanation_graded |
| §4 metacognitive mirror (confidence vs actual) | 13 | x6.metacognitive_mirror |
| §5 seven interactive states | 12 | x5.interactive_states |
| §5 risk semantics never colour-only | 12 | x5.risk_not_colour_only |
| §5 reduced-motion parity (impl-facing) | 12 | x5.reduced_motion_parity |
| §5 latency honesty / learner-paced beats | 12 | x5.learner_paced |
| §6 measurement (transfer rate, calibration gap, self-explanation trend, time-to-consequence, anti-metric) | — | *deferred — Story 14 removed; re-add when cross-learner analytics is scoped* |

## MECE assertions

- **Collectively exhaustive (within active scope):** every section §1–§5, every module (M0–M6), every anti-pattern, every named interactive, and the closing design stance appears in the matrix. The only unmapped section is §6 (measurement), intentionally deferred.
- **Mutually exclusive:** each doc element is owned by exactly one story/anchor. Cross-cutting concerns (feedback loop, references, accessibility, no-live-LLM) are owned once by their platform story (8–13) and *consumed* by module stories via their "Out of scope" notes, never re-owned.
- **Boundary cases resolved deliberately:**
  - The global *no-live-LLM* constraint appears in the doc under M2/M3 and the plan's B2/safety notes; owned once by Story 8 (`x1.no_live_llm`), referenced by the module stories.
  - *Reduced-motion parity* is stated in both §2.6 and §5; single-owned by Story 12 (`x5.reduced_motion_parity`) — one anchor, cited from both.
  - The *Kolb experiential arc* (§1) is realised by the stage path in Story 9 (`x2.stage_path`) and registered as a principle in Story 8; principle-vs-realisation, not duplication.

## Technical foundation (all stories)

Per the epic's technical foundation: React 18 + TypeScript, **Vite** bundling, **Bun** (not npm) for install/scripts/tests, **Cloudflare Pages** deployment, **Miniflare** for local dev/builds, fully client-side, no backend, no SSR, no live LLM, and **localStorage-only per-device persistence** (no D1/Workers for now). Because there is no SSR/RSC/remote fetching, the Vercel **server-side and data-waterfall** performance rules do not apply; the app follows the client-side subset of Vercel React best practices (bundle/code-splitting, re-render, rendering, JS-perf, versioned-minimal localStorage), documented in `interactive-tutorial-plan.md` and embedded per-design in each design's "Performance conventions" section.

## Status

Each of the 13 active stories has a complete, gate-passing Ceetrix spec chain: **PRD (EARS) → design (structure/state/sequence diagrams + tabular test strategy + performance conventions) → tasks → tests**. All specification gates (G1 PRD→Design, G2 Design→Tasks, G3 Test Coverage, G8/G9 content/prose, G11/G12 coherence/semantic) pass on every story. The only pending gate is **G6 (All Tasks Complete)** — expected, since implementation has not started. 31 capabilities, 62 tasks (31 implementation + 31 test). Next step is implementation.
