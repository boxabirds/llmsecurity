# Design Proposals: Tools to Close the Indefensible Gaps

*Compiled 2026-08-28. Builds on [`defensive-tooling-matrix.md`](./defensive-tooling-matrix.md) §4 (Gaps A–D) and [`llm-enterprise-security-research.md`](./llm-enterprise-security-research.md) §6. Each proposal is scored on a **novelty ledger** so nothing published is passed off as original — where a 2026 paper already stakes out territory, it is named and the proposal is positioned as extension or synthesis, not invention.*

> **Framing / honest caveat.** None of these "solves" prompt injection — research §6.1 establishes that a general-purpose agent over untrusted content is not securable. The realistic goal is to (a) make the defensible parts *deterministic* rather than probabilistic, (b) fill matrix columns that are empty today, and (c) turn diffuse best-practices into *checkable, enforceable properties*. Two proposals are genuinely novel; three are integrations/extensions of published research that are not yet productized. That distinction is stated per proposal.

---

## Proposal 1 — Provenance-Typed Context Bus (PTCB)
**Targets:** V2, V6, V11, V12, V13 · **Gap:** D (siloed provenance) · **Novelty: HIGH (synthesis)**

### Problem
Provenance and trust are tracked per-layer with incompatible representations — RAG provenance (RAGShield), MCP trust (MCP-Scan), IFC labels (CaMeL), egress policy (agent firewalls) — so the pipeline has an ungoverned seam at every boundary. The lethal trifecta is a whole-pipeline property; a defense fragmented across layers loses at the joins. EchoLeak lived in exactly such a seam.

### Design
A single **provenance label** — a typed capability tag `{origin, trust_tier, sensitivity, allowed_sinks}` — is minted at every ingestion point (user turn, retrieved chunk, tool result, sub-agent output) and travels *bound to the span of text it describes* through the entire context assembly. A policy engine at two chokepoints — **tool-call** and **egress** — evaluates the labels of all context that influenced the call against a lattice policy (e.g. "no value tainted by `trust_tier: untrusted` may flow to a `sink: external_network`"). This is CaMeL's information-flow-control idea **lifted out of the interpreter and made a pipeline-wide bus** that RAG, MCP, and egress layers all speak.

### Why it beats today's tools
- Deterministic (IFC lattice), not probabilistic — a ● where C1 guardrails are ◐.
- Closes the inter-layer seams by construction: one label vocabulary end to end.
- The label that reaches the guard is the *reassembled full context* the model infers over — which also structurally defeats the Prompt Overflow fragmentation attack (see Proposal 3, subsumed here).

### Novelty ledger
- **Prior art (must credit):** CaMeL (IFC in a custom interpreter, [2503.18813](https://arxiv.org/abs/2503.18813)); "Tracking Capabilities for Safer Agents" ([2603.00991](https://arxiv.org/pdf/2603.00991)); RAGShield provenance ([2604.00387](https://arxiv.org/html/2604.00387)); Cordon-MAS IFC-for-RAG ([2605.26754](https://arxiv.org/pdf/2605.26754)).
- **Net-new:** a *single label representation spanning ingestion → retrieval → tool-call → egress*, so IFC is enforced without requiring the whole agent to run inside a CaMeL interpreter. It makes IFC adoptable incrementally (wrap the boundaries, not the runtime) — the main barrier to CaMeL's deployment.

### Feasibility & limits
Buildable as middleware around existing orchestration (LangChain/LlamaIndex/MCP client hooks). **Hard limit:** label propagation through the *model itself* is lossy — once tainted text enters generation, output taint is inferred conservatively (over-taint → utility loss, the same 77%-vs-84% tax CaMeL pays). Does not help if the enterprise wants the trifecta fully assembled; it forces an explicit, logged policy decision at the seam instead of a silent one.

---

## Proposal 2 — Trifecta Linter + Runtime Interlock
**Targets:** V2, V9, V12 · **Gap:** D · **Novelty: HIGH (net-new framing)**

### Problem
The lethal trifecta (private data + untrusted content + external egress) is today diagnosed by humans reading architecture diagrams. There is no tool that *checks* whether a deployment has assembled it, and no CI gate that fails a build for doing so.

### Design
Two components:
1. **Static linter** — ingests an agent's tool manifest, data-source config, and MCP server list; builds the capability graph; and emits a **trifecta score** plus the specific path (`data_source X → context → tool Y with external egress`). Runs in CI; fails the build or requires sign-off when all three legs co-occur on one path.
2. **Runtime interlock** — when PTCB (Proposal 1) labels show untrusted-tainted data is live in a context that also holds private-tier data, the interlock **dynamically quarantines egress** (blocks or human-gates outbound tool calls) for that turn. It cuts the third leg *only when the other two are simultaneously present*, minimizing utility cost.

### Why it beats today's tools
Turns research §6.2's core insight into an enforceable, testable property — nothing in categories C1–C9 does this. It is the "you can have full capability or a guarantee, not both" trade-off made *explicit and per-request* rather than global.

### Novelty ledger
- **Prior art:** the trifecta concept (Willison, 2025) is descriptive; PAuth task-scoped authorization ([2603.17170](https://arxiv.org/pdf/2603.17170)) and AIRGuard runtime authority ([2605.28914](https://arxiv.org/pdf/2605.28914)) enforce per-action permissions.
- **Net-new:** treating "trifecta-completeness" as a *static + runtime checkable property of a whole deployment*, with a CI linter. Prior work authorizes individual actions; none flags the emergent three-leg condition at build time.

### Feasibility & limits
Static linter is straightforward and high-value (ship first). Interlock depends on PTCB taint quality. **Limit:** conservative quarantine can break legitimate workflows (e.g. "summarize this external email and email me back" *is* the trifecta) — the tool's honest output is often "this workflow is inherently unsafe," which is a finding, not a fix.

---

## Proposal 3 — Full-Context Semantic Guard (FCSG)
**Targets:** V1, V2, V3 · **Gap:** B (guard ≠ what model infers) · **Novelty: MEDIUM (fixes a named flaw)**

### Problem
[Prompt Overflow (2605.23196)](https://arxiv.org/html/2605.23196v1) proves that guardrails scoring segments independently and threshold-aggregating are beaten by fragmentation — malicious intent split so no window looks malicious, yet the full-context model reassembles it. This is the structural cause of C1's pervasive ◐.

### Design
A guard that **inspects the exact assembled token window the downstream model will infer over** — same context, same order, same length — using a long-context judge model rather than sliding-window segment scoring. Where the window exceeds the guard's context, it uses *global* reasoning (attention-variance / cross-segment consistency checks) instead of per-segment thresholds, so there is no "weak-by-design segment" to hide in.

### Why it beats today's tools
Removes the architectural mismatch rather than tuning the classifier. Deployed as a drop-in replacement for the input/output stage of C1 tools.

### Novelty ledger
- **Prior art:** Prompt Overflow *names* the flaw and gestures at full-context inspection; Attention-Variance Filter (RAG) uses global attention statistics.
- **Net-new:** engineering the guard to inspect the model's actual inference window as a product pattern, and combining full-context judging with attention-variance for over-length prompts. This is an *incremental but important* fix, not a new paradigm — labeled honestly as such.

### Feasibility & limits
Buildable now with a long-context guard model. **Limits:** cost/latency (judging the full window every call); still probabilistic (remains ◐, just a *stronger* ◐ that fragmentation no longer trivially beats); an adaptive adversary will find new evasions — it raises the floor, it is not a boundary.

---

## Proposal 4 — MCP Continuous Attestation Registry (MCAR)
**Targets:** V8, V13 · **Gap:** C (scanning is a snapshot) · **Novelty: MEDIUM-HIGH**

### Problem
[MCP-Scan](https://invariantlabs.ai/blog/introducing-mcp-scan) and peers do point-in-time description scanning + tool-pinning. Rug-pulls (server turns malicious after approval) and tool-shadowing are *temporal/behavioral* — invisible to a snapshot. Research §6.7: MCP has no native continuous trust verification.

### Design
A registry that (1) records a signed **attestation manifest** (tool description hash, declared scopes, expected call/response shapes) at approval; (2) **continuously diffs live server behavior** against the manifest — description drift, scope creep, anomalous response patterns that resemble injected instructions; and (3) **auto-quarantines** a server on deviation, revoking its tools from all connected agents until re-attested. Effectively **certificate-transparency-style monitoring for MCP tools**.

### Why it beats today's tools
Converts one-time scanning (C3, ◐/●) into continuous assurance, catching exactly the rug-pull/shadowing attacks that MCPTox showed succeed 60–73% of the time and that snapshots miss.

### Novelty ledger
- **Prior art:** MCP-Scan tool-pinning (detects rug-pull *at next scan*); MCP-DPT defense-placement taxonomy ([2604.07551](https://arxiv.org/pdf/2604.07551)); MCPGuard ([2510.23673](https://arxiv.org/html/2510.23673v1)).
- **Net-new:** *continuous behavioral attestation with automated quarantine and a transparency-log trust model*, versus static/periodic scanning. Borrows the CT-log analogy from web PKI — not yet applied to MCP in productized form.

### Feasibility & limits
The manifest/diff mechanics are practical. **Limits:** behavioral baselining produces false positives on legitimately-updated servers; a sophisticated malicious server can mimic its attested behavior until a trigger condition — attestation narrows but does not eliminate the trust gap.

---

## Proposal 5 — Behavioral Backdoor Probe Gate (BBPG)
**Targets:** V10 · **Gap:** A (emptiest row) · **Novelty: MEDIUM (productizes research into an empty column)**

### Problem
The matrix's emptiest, highest-stakes row. ModelScan/HiddenLayer catch *code/serialization/architectural* backdoors but **not weight-encoded behavioral triggers** (Sleeper Agents, research §3.5). Enterprises consuming open-weight models or third-party fine-tunes accept an unverifiable trust assumption.

### Design
A pre-promotion CI gate that runs, on any candidate model/adapter, an ensemble of *behavioral* backdoor probes: (1) **activation-space detectors** — the Sleeper Agents "detector direction" (a two-prompt contrast that separated deceptive from honest activation states without knowing the trigger); (2) **trigger-search fuzzing** — automated search for input perturbations that flip a safety-relevant behavior; (3) **fine-tune diffing** — compare adapter activations against the base model to flag anomalous behavioral deltas. Fails promotion or flags for review on positive signal.

### Why it beats today's tools
It populates a column that does not exist in production. It is complementary to C5 (which it does not replace — code scanning is still needed).

### Novelty ledger
- **Prior art (heavily):** Sleeper Agents' detector-direction method ([2401.05566](https://arxiv.org/abs/2401.05566)); cross-LLM behavioral backdoor detection ([2511.19874](https://arxiv.org/pdf/2511.19874)).
- **Net-new:** packaging these research methods into a *supply-chain CI gate with an ensemble + AIBOM integration* — engineering/integration novelty, not scientific novelty. Stated plainly.

### Feasibility & limits — the most honest caveat of all
**This is probabilistic and the underlying science is unresolved.** Sleeper Agents itself showed adversarial training can *hide* triggers from detection, and detection generalization across models is an open problem. BBPG raises the cost of shipping a backdoored model and catches known-shape backdoors; it **cannot certify a model backdoor-free**, and must never be marketed as doing so. Its real value is forcing the trust assumption into the open and adding a probabilistic tripwire where today there is nothing.

---

## Summary: proposals mapped to gaps and honesty

| Proposal | Closes gap | Fills matrix column | Deterministic? | Novelty |
|----------|-----------|--------------------|:--------------:|---------|
| 1. Provenance-Typed Context Bus | D | new C7/C8 fabric | Yes (IFC) | High (synthesis) |
| 2. Trifecta Linter + Interlock | D | new (CI + C8) | Yes (interlock) | High (net-new framing) |
| 3. Full-Context Semantic Guard | B | strengthens C1 | No (stronger ◐) | Medium |
| 4. MCP Continuous Attestation | C | extends C3 | Partly | Medium-High |
| 5. Behavioral Backdoor Probe Gate | A | new C5-adjacent | No (probabilistic) | Medium |

**The strategic through-line:** the highest-leverage work is not better classifiers (Proposal 3 is the weakest, most incremental) but **making information-flow control adoptable** (Proposals 1–2) and **filling the two empty columns** — continuous MCP trust (4) and behavioral backdoor detection (5). Proposals 1 and 2 are the ones worth prototyping first: they convert the research's central, verified insight — that only architectural, deterministic control-/data-flow separation actually prevents these attacks — from a research artifact (CaMeL, 77% utility ceiling) into something an enterprise can bolt onto an existing stack incrementally.

### Recommended build order
1. **Trifecta Linter (static half of Proposal 2)** — cheapest, highest immediate value, no dependencies; ships as a CI tool in weeks.
2. **PTCB (Proposal 1)** — the foundational fabric the interlock and FCSG both build on.
3. **MCAR (Proposal 4)** — independent, addresses an active-exploitation area (72.8% ASR).
4. **FCSG (Proposal 3)** and **BBPG (Proposal 5)** — valuable but each is a *stronger probabilistic tripwire*, not a guarantee; sequence them after the deterministic layers exist.
