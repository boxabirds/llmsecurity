# Interactive Tutorial — UX & Pedagogical Technical Design

*Compiled 2026-08-28. Companion to [`interactive-tutorial-plan.md`](./interactive-tutorial-plan.md) (the table of contents) and grounded in [`llm-enterprise-security-research.md`](./llm-enterprise-security-research.md). Where the plan says *what* each module covers, this doc specifies *how the learner experiences it* — the moment-to-moment interaction design that makes the concept stick, derived from established learning science.*

---

## 1. Pedagogical foundations (the principles we build on)

Every design choice below traces to a named, evidence-based principle. Stating them once here so each module can reference them by name.

| Principle | Source | What it dictates for us |
|-----------|--------|-------------------------|
| **Experiential learning cycle** | Kolb | The whole arc: Concrete Experience → Reflective Observation → Abstract Conceptualization → Active Experimentation. Our Understand→Experience→Learn→Confront→Apply spine *is* Kolb's cycle. |
| **Productive failure** | Kapur | Let the learner attempt and *fail* to secure a system before we teach the defense. Struggle first, instruction second — it builds durable, transferable understanding. This is why learners play **attacker before defender**. |
| **Cognitive Load Theory** | Sweller | Manage intrinsic load (sequence simple→complex), ruthlessly cut extraneous load (no decorative animation, no split-attention), invest in germane load (schema-building). |
| **Multimedia principles** | Mayer | Segmenting, signaling, spatial/temporal contiguity, redundancy avoidance, coherence. Words + relevant visuals *adjacent and synchronized*, narration not duplicated as on-screen text. |
| **Dual coding** | Paivio | Pair verbal and visual representations of the same idea (e.g. the trifecta as words *and* three interlocking rings). |
| **Testing effect / retrieval practice** | Roediger & Karpicke | Frequent low-stakes retrieval beats re-reading. Every module ends in *doing/recalling*, not a summary slide. |
| **Desirable difficulties** | Bjork | Some friction *aids* retention: generation, spacing, interleaving, varied contexts. We deliberately don't make everything frictionless. |
| **Scaffolding & fading (worked→completion→problem)** | Sweller/Renkl/Vygotsky ZPD | Start with a worked example, then a completion problem (fill the gap), then an unaided problem. Fade support as competence grows. |
| **Self-explanation prompts** | Chi | Ask "why did that work?" at the moment of insight; learners who explain to themselves transfer better. |
| **Concreteness fading** | Goldstone/Fyfe | Begin with a concrete, story-grounded instance; fade to the abstract principle — never start abstract. |
| **Immediate, specific feedback** | Hattie/Shute | Feedback within the interaction, targeting the gap between attempt and goal, not just "right/wrong." |

### Anti-patterns we explicitly avoid (the honest part)
- **Seductive details** (Mayer): flashy, tangential "cool hacks" that raise engagement but *lower* learning. Every animation must carry information.
- **Gamification that rewards clicking over thinking**: points/badges for *completion* train speed-running. We reward *correct reasoning and self-explanation*, not clicks.
- **Teaching attacks as spectacle**: an attack demo without the immediate "here's the root cause and the leg you'd cut" frame produces learners who can exploit but not defend. Every attack lab is *bookended by the defensive lens*.
- **False mastery**: recognition (multiple-choice) overstates competence. High-stakes checks require *generation* (do the thing / critique the claim).

---

## 2. Cross-cutting experience patterns

These apply to every module; the per-module sections (§3) only note deviations.

### 2.1 The three-pane learning shell
- **Left — module rail:** progress, current cognitive stage (Understand/Experience/Learn/Confront/Apply) shown as a labelled path so learners always know *where they are in the arc* (metacognition support).
- **Center — the stage:** prose + the interactive. One primary interaction visible at a time (segmenting; no scroll-jungle of five widgets competing for attention).
- **Right — Concept Inspector + Reference panel:** context-sensitive. Surfaces the definition of the term under focus and the **slide-over reference panel** (per the plan's cross-cutting requirement). Rationale: keeps elaboration *adjacent* to the concept (spatial contiguity) instead of a tab away.

### 2.2 Feedback design — the "attempt → consequence → explanation" loop
Every interaction resolves in three beats, never one:
1. **Consequence (immediate, diegetic):** the system *shows* the result in-world — the secret leaks, the refusal flips, the answer gets poisoned. No "❌ Incorrect" modal; the world reacts.
2. **Signal (what just happened):** a synchronized highlight/annotation points at the causal element (Mayer signaling) — e.g. the exact hidden-text span that triggered exfiltration.
3. **Self-explanation prompt (why):** a lightweight prompt — "Which trifecta leg made this possible?" — with the learner answering *before* the canonical explanation reveals. Generation before feedback (Bjork).

### 2.3 Cognitive-load budget per screen
- Introduce **at most one new concept per interaction**. If a lab needs two (e.g. taint + capability), split into two beats with the first faded before the second.
- **Worked-example first contact:** the learner's first exposure to any lab is a *guided replay* (the system performs the attack step-by-step with narration), then hands over the controls. This is the worked-example effect — cheaper schema-building than unguided discovery for novices.
- **Progressive disclosure:** advanced knobs (e.g. suffix-optimization parameters) are collapsed until the base concept is demonstrated.

### 2.4 Scaffolding ladder (applied to every lab)
`Watch (worked example) → Complete (fill the missing step) → Do (unaided) → Vary (transfer to a new surface)`.
The final "Vary" rung is where transfer is tested — e.g. having proven injection in email, the learner is asked to achieve it via a *calendar invite* instead (interleaving + varied context).

### 2.5 Reference panel as an active learning tool (not a footnote)
Because every reference is openable (plan requirement), we make the panel *pedagogical*, not bibliographic: it states the **claim as used here**, a plain-language summary, and — crucially — a **"confidence & caveat" line** (e.g. "This ASR is 72.8% under benchmark conditions; real deployments vary"). This trains source-critical reading, directly serving Module 5's "don't overclaim" objective.

### 2.6 Motion & micro-interaction language
- Motion is **explanatory only**: it shows causality (data flowing from untrusted source → tool → egress) or state change. Duration 200–400ms; `prefers-reduced-motion` swaps to instant state changes with static before/after.
- Consistent verbs: *drag* = compose a system, *toggle* = reveal model's-eye-view, *inject* = author untrusted content, *cut* = remove a capability/leg.

### 2.7 Accessibility as pedagogy (not compliance tax)
Every simulation outcome is announced via an ARIA live region in words ("Secret exfiltrated: the account number was sent to attacker.example"). This helps screen-reader users **and** everyone else — verbalizing the outcome *is* the dual-coding channel. Keyboard paths for all drag interactions (the trifecta legs are also a focusable list with "add/remove" buttons).

---

## 3. Per-module experience design

Each module below specifies: **learning objective (Bloom level)**, the **driving principle**, the **interaction flow** (moment-to-moment), the **"aha" mechanic**, **failure/recovery UX**, and the **mastery check**.

---

### Module 0 — Orientation & threat model
**Objective (Bloom: Understand):** state why LLM security differs from classical appsec; name the trifecta.
**Driving principle:** Concreteness fading + dual coding. Do *not* open with "instruction/data non-separation" — open with a story.

**Interaction flow:**
1. **Cold open (concrete):** a 20-second scripted scene — the learner reads an innocuous-looking email in a mock inbox, clicks "Ask the assistant to summarize," and *watches their own account balance get emailed to a stranger*. No explanation yet. Visceral, story-grounded (situated learning).
2. **Reflective beat:** a single prompt — "The assistant did exactly what some text told it to. Whose text?" Learner picks from {you, the email sender, the developer}. This surfaces the naive mental model before correcting it.
3. **`TokenStreamViz` (the aha):** the context window animates in, showing system prompt + user msg + email all as **one undifferentiated token stream**. A toggle — *"What we wish the model saw"* vs *"what it actually sees"* — flips between a color-coded, neatly-separated view and the real flat stream. The gap between those two views *is* the lesson (dual coding: the abstract principle made visual).
4. **`TrifectaBuilder` (concept assembly):** three rings — private data, untrusted content, external comms — that the learner drags together. The danger meter stays cold until all three overlap, then arms with a synchronized "why" annotation. Keyboard-equivalent: a checklist with live-region arming announcement.

**Failure/recovery UX:** there is no "wrong" here — it's discovery. If the learner mis-answers the reflective beat, the TokenStreamViz *is* the corrective feedback, shown not told.
**Mastery check (generation, not recognition):** present 5 mini system descriptions; learner marks trifecta-complete or not *and* names the missing leg for the safe ones. Immediate per-item consequence + self-explanation.

---

### Module 1 — The OWASP LLM Top 10 map
**Objective (Bloom: Understand/Apply):** locate any concrete vulnerability on the OWASP 2025 taxonomy.
**Driving principle:** Advance organizer (Ausubel) — give learners the *map* before the territory so later modules have hooks to hang on.

**Interaction flow:**
1. `RiskMatrix` as a **living map**, not a table: 10 cells, each a card. Hover/focus raises a one-line plain-language gloss; activate expands to a *real documented incident* (EchoLeak on LLM01, etc.) with the governing framework (NIST/ATLAS) shown as a cross-reference chip that opens the reference panel.
2. **Signaling for "new in 2025":** the two additions (System-Prompt Leakage, Vector/Embedding) pulse once on first view — drawing attention to what changed, then settle (no persistent motion).
3. **Interleaved retrieval seed:** as learners will *return* to this map from later modules (each attack lab links back to its OWASP cell), the map becomes a spaced-repetition anchor. The cell the learner has "visited via a lab" gets a subtle completion state — building a sense of the map filling in.

**Failure/recovery UX:** the tag-the-incident check gives a "near miss" hint when the chosen ID is *adjacent* (e.g. picked LLM01 for a leakage case) rather than a flat wrong — feedback targeting the specific confusion.
**Mastery check:** given 6 incident vignettes, tag the OWASP ID; interleaved so no two consecutive share a category (desirable difficulty).

---

### Module 2 — Attack sandbox: Prompt Injection *(the vertical-slice flagship)*
**Objective (Bloom: Apply/Analyze):** execute a direct and an indirect injection; identify the trifecta leg to cut.
**Driving principle:** Productive failure — the learner **is the attacker**, and *succeeds*, before any defense is taught. Succeeding at the attack is what makes the later defense meaningful.

**Interaction flow (the scaffolding ladder in full):**
1. **Watch:** guided replay — the system performs a direct injection into the assistant, narrating each step with signaling. Learner just advances the beats.
2. **Complete:** the system sets up an indirect injection but leaves the payload blank in a hidden-text field of an email; the learner types the instruction that hijacks the assistant. Constrained, high-support.
3. **Do (`InjectionPlayground`, unaided):** full sandbox. Learner authors a malicious email; the scripted assistant (client-side, no live LLM — safety) processes it and exfiltrates a seeded fake secret into a rendered link. The **exfiltration channel animates** so the learner sees data physically leave.
4. **Vary (transfer):** "Now do it through a calendar invite instead of an email." Same principle, new surface — this is where understanding is proven.
5. **Turn (the pivot to defense):** immediately after success, the self-explanation prompt: "You just succeeded. Which of the three legs, if removed, stops *this exact attack*?" Learner toggles each leg off in the running scenario and observes which one kills the exploit. **This is the bridge to Module 4** — the learner discovers the defense by experiment, not lecture.

**"Aha" mechanic:** watching *the learner's own crafted text* become the instruction the assistant obeys — the instruction/data collapse from M0, now under their own hands.
**Failure/recovery UX:** if an injection attempt doesn't fire, the assistant's reasoning trace (a simplified, honest "why I didn't act on that") is inspectable, so failure is diagnostic, not a dead end. Reset is one click; state is never lost punitively.
**Mastery check:** achieve exfiltration on the *transfer* surface (calendar), then correctly name the leg to cut. Both required.

---

### Module 3 — Attack sandbox: Jailbreaks, RAG poisoning, Tool/MCP poisoning
**Objective (Bloom: Analyze):** distinguish three attack classes by mechanism and root cause.
**Driving principle:** Interleaving + contrasting cases (Bjork; Schwartz & Bransford). Three labs sharing a UI frame so the learner *contrasts mechanisms*, which is what builds discriminating schemas — better than three isolated demos.

**Interaction flow:** three labs (`SuffixLab`, `RAGPoisonLab`, `MCPPoisonLab`) behind a shared shell with a persistent **"root cause" ledger** on the right that the learner fills in after each. The pedagogical payload is the *comparison*: all three trace to instruction/data non-separation, but at different layers (model alignment / retrieval corpus / tool metadata).
- `SuffixLab`: append a mock suffix; the refusal flips to compliance; `AttentionHighlight` shows (illustratively, labelled as such) which tokens got "hijacked." Caveat surfaced in the reference panel: this is a *depiction* of the mechanism from arXiv:2506.12880, not live model internals.
- `RAGPoisonLab`: drop **one** poisoned passage into a 1,000-doc corpus; watch it dominate the retrieved answer (CorruptRAG single-doc shape). The "1 in 1,000 still wins" moment is the aha — scale intuition corrected.
- `MCPPoisonLab`: edit a tool *description* (not code); watch the agent silently obey embedded instructions. Aha: the attack surface is the *metadata*, which learners assume is inert.

**"Aha" mechanic:** the contrast ledger — three different-looking attacks resolving to one root cause — is the transferable insight.
**Failure/recovery UX:** each lab has a "why didn't it work?" inspector; the shared shell lets learners re-run any lab to compare, supporting the contrast.
**Mastery check:** for a *novel* fourth scenario, the learner classifies which of the three mechanisms it is and names the layer — pure transfer.

---

### Module 4 — Defenses that hold
**Objective (Bloom: Evaluate):** choose an architectural defense and justify deterministic vs probabilistic.
**Driving principle:** Worked example → problem, plus the "expertise reversal" awareness — by now learners are intermediate, so support fades and we lean on *decision-making* interactions.

**Interaction flow:**
1. `CaMeLFlow`: an animated data-flow walkthrough where the learner **taints a value** (marks it untrusted) and then *tries* to route it to a tool — the capability check blocks it, visibly. Learning by attempting the forbidden and seeing the guarantee hold (contrast with M2/M3 where attempts *succeeded*). The felt difference between "probabilistic filter I beat earlier" and "structural block I can't" is the core lesson.
2. `DefensePatternPicker`: given a workflow, choose among the six patterns (Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM, Code-Then-Execute, Context-Minimization). Each choice updates a **two-axis readout — residual capability vs residual risk** — making the *trade-off* tangible (there is no free lunch; the 77%-vs-84% CaMeL tax is shown as a real cost).
3. `ArchitectureBuilder` (capstone-lite): stack defense-in-depth layers; a live risk score updates. Signaling shows *which* attack from M2/M3 each layer would have stopped — closing the loop with prior modules (spaced retrieval).

**"Aha" mechanic:** re-running the Module 2 attack against the now-defended assistant and watching it **fail** — the learner's own earlier exploit, neutralized by a leg they chose to cut. Deeply motivating (self-efficacy; closure of the productive-failure loop).
**Failure/recovery UX:** picking a weak pattern for a workflow doesn't error — it *lets the attack through in simulation*, and the learner sees the consequence and revises. Evaluation learned through consequence.
**Mastery check:** re-secure the M2 assistant by cutting a leg and verify exfiltration now fails; then justify *why it's deterministic* in one sentence (self-explanation, graded on reasoning).

---

### Module 5 — The indefensible frontier
**Objective (Bloom: Evaluate):** articulate what cannot be prevented and why; resist overclaiming.
**Driving principle:** Refutation / cognitive conflict (Posner conceptual change) — deliberately induce and then correct the comfortable belief that "with enough guardrails, we're safe."

**Interaction flow:**
1. `GuardrailGauntlet`: the learner is handed a *probabilistic guardrail* and told to get a payload past it. They can try **unlimited times**. A running chart plots cumulative attacker success against attempts — it *always* trends to 100% given persistence. The emotional arc (frustration → breakthrough → realization) is the point: they *feel* why a filter facing an adaptive adversary is a rate-limiter, not a boundary. Grounded in the Prompt Overflow fragmentation result (reference panel links it).
2. **Cognitive-conflict beat:** *before* the gauntlet, the learner predicts "how many tries to get past a 95%-accurate guardrail?" Their (usually optimistic) prediction is saved and contrasted with the actual result — prediction-failure drives conceptual change harder than being told.
3. `IndefensibleMap`: the 8 §6 areas as an interactive tree; the learner traces each back to the single root cause + two force multipliers (agents-with-tools, adaptive adversaries). Collapsing eight scary-looking problems into one root is the schema consolidation.

**"Aha" mechanic:** the success-over-attempts curve refusing to plateau. Visceral proof.
**Failure/recovery UX:** n/a in the usual sense — struggling *is* the designed experience. Guardrail against demoralization: a clear framing card afterward — "This is why we build architecture (M4), not just filters. Unsolved ≠ hopeless."
**Mastery check:** critique a real-style vendor claim ("our guardrail stops all prompt injection") — free-text, graded on whether the learner names the structural (not incidental) flaw. This is the highest Bloom rung in the course.

---

### Module 6 — Apply: enterprise decision workshop
**Objective (Bloom: Create):** make and defend a go/no-go + architecture decision for a real scenario.
**Driving principle:** Authentic assessment + situated cognition — a realistic, consequential task with no single right answer, exercising everything prior.

**Interaction flow:**
1. `ScenarioSimulator`: a branching case ("AI assistant over the company inbox"). The learner makes sequenced choices — model source, data scope, tool permissions, egress policy, guardrail posture. Each choice narrows the risk surface; the sim narrates downstream consequences (an incident *or* a safe outcome), each mapped to a MITRE ATLAS technique chip (openable reference).
2. **Consequential branching (not a quiz):** choosing the trifecta-complete design *runs the EchoLeak-shaped incident* from M0 — but now the learner understands every step. Full-circle callback (the course's narrative closes where it opened).
3. **Reflection & artifact:** the sim auto-generates a **scored risk memo** from the learner's choices, which they can revise and export — a durable artifact (portfolio effect; also spaced retrieval of every concept).

**"Aha" mechanic:** seeing that the "most capable" configuration is often the *least* securable — the course thesis, now owned as a decision the learner made and defended.
**Failure/recovery UX:** any incident branch is replayable with one variable changed — supporting "what if" experimentation (active experimentation, closing Kolb's cycle).
**Mastery check:** the exported memo must correctly identify the trifecta status, name the single highest-leverage mitigation, and *state one residual risk that cannot be eliminated* (forcing the anti-overclaiming lesson into the capstone).

---

## 4. Assessment & retention architecture (course-wide)

- **Formative everywhere, summative sparsely:** every interaction is low-stakes retrieval; only the M6 memo is high-stakes. (Testing effect without test anxiety.)
- **Interleaving across modules:** later assessments pull from earlier concepts (M4 re-runs M2's attack; M6 pulls from all). Spacing is built into the sequence, not bolted on.
- **Generation over recognition** for anything load-bearing: name the leg, craft the payload, critique the claim, write the memo — never just pick A/B/C for the concepts that matter.
- **Self-explanation as a graded signal:** short free-text "why" prompts, graded on reasoning quality (keyword + rubric client-side), because explaining predicts transfer better than selecting.
- **Metacognitive mirror:** a per-module "how confident are you?" vs "how did you actually do?" calibration readout — trains learners to notice overconfidence, which *is* Module 5's meta-lesson applied to themselves.

## 5. Design language & state (implementation-facing)

- **States every interactive must define:** idle · guided-replay · learner-active · consequence-playing · explained · mastered · reset. No interactive ships without all seven designed (prevents the "what do I do now?" dead-air that kills flow).
- **Consistent risk semantics:** risk/danger is *never* encoded by color alone (WCAG + Module 5's "don't trust the signal" theme) — always icon + label + text. Green≠safe without the word "contained."
- **Reduced-motion parity:** every explanatory animation has a static before/after that carries the same causal information (the animation is an enhancement, never the sole channel).
- **Latency honesty:** because sims are client-side and instant, we *deliberately* pace the guided-replay beats (learner-advanced, not auto-timed) so comprehension, not the clock, sets tempo (segmenting principle — learner controls pacing).

## 6. How we'll know the UX actually teaches (measurement)

Instrument the build against learning outcomes, not engagement vanity metrics:
- **Transfer rate:** % who succeed on the *Vary/novel* rung (M2 calendar, M3 fourth scenario) — the real signal of understanding vs mimicry.
- **Calibration gap:** predicted vs actual performance (M5) shrinking across the course = metacognition improving.
- **Self-explanation quality trend:** rubric scores on "why" prompts rising module-over-module.
- **Time-to-consequence:** learners should reach their first *consequential* interaction within ~60s of a module (guards against front-loaded reading).
- **Anti-metric we refuse to optimize:** raw time-on-page and click-count — high values there often mean confusion or seductive-detail distraction, not learning.

---

*Design stance, stated plainly: the subject matter is unusually well-suited to experiential, productive-failure pedagogy because the learner can safely **become the attacker** and feel the vulnerability before being handed the defense — an emotional-cognitive arc most security training never achieves. The single biggest risk to this design is drifting into "cool exploit demos" (seductive details) that entertain without building the instruction/data-separation schema. Every module above is engineered so the attack is a *means to the defensive insight*, never the end.*
