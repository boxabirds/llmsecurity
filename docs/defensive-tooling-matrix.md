# Defensive Tooling vs. Vulnerability Coverage Matrix

*Compiled 2026-08-28. Companion to [`llm-enterprise-security-research.md`](./llm-enterprise-security-research.md). Tool capabilities are drawn from vendor/project documentation and cited; where a tool is research-stage rather than a deployable product, it is marked **(R)**. This is a defensive map, not an endorsement — no tool here closes an indefensible gap (research §6); they raise cost and shrink blast radius.*

---

## 1. Vulnerability rows (V) — consolidated from OWASP LLM Top 10 + research §6

| ID | Vulnerability | OWASP / research anchor |
|----|---------------|--------------------------|
| **V1** | Direct prompt injection | LLM01 |
| **V2** | Indirect prompt injection (untrusted content → action); the lethal-trifecta / EchoLeak class | LLM01, research §3.1, §6.2 |
| **V3** | Jailbreaks / adversarial suffixes (alignment bypass) | research §3.2, §6.3 |
| **V4** | Sensitive information / PII disclosure | LLM02 |
| **V5** | System-prompt leakage | LLM07 |
| **V6** | RAG / knowledge-base poisoning | LLM04, research §3.3, §6.6 |
| **V7** | Vector / embedding weaknesses | LLM08 |
| **V8** | MCP / tool poisoning, rug-pull, shadowing | LLM03/LLM06, research §3.4, §6.7 |
| **V9** | Excessive agency / unauthorized actions | LLM06 |
| **V10** | Weight-level model backdoors (Sleeper Agents class) | LLM03/LLM04, research §3.5, §6.5 |
| **V11** | Improper output handling (output → downstream code/SQL/HTML) | LLM05 |
| **V12** | Covert data exfiltration channels | research §6.8 |
| **V13** | Multi-agent / agent-to-agent propagation | research §3.4, §6.7 |
| **V14** | Unbounded consumption / denial-of-wallet | LLM10 |

## 2. Tool categories (C) — with representative products/projects

| ID | Category | Representative tools (verified) |
|----|----------|--------------------------------|
| **C1** | Input/output guardrail classifiers | [Lakera Guard](https://www.getmaxim.ai/articles/top-5-ai-guardrail-solutions-for-production-llm-applications-in-2026/) (Check Point), [NVIDIA NeMo Guardrails](https://dev.to/agdex_ai/best-ai-agent-security-guardrails-tools-in-2026-llm-guard-vs-nemo-vs-guardrails-ai-5e5d), [Protect AI LLM Guard](https://dev.to/agdex_ai/best-ai-agent-security-guardrails-tools-in-2026-llm-guard-vs-nemo-vs-guardrails-ai-5e5d), [Guardrails AI](https://www.giskard.ai/knowledge/best-ai-guardrail-tools-in-2026-understanding-features-functions-and-solutions), [Microsoft Prompt Shields](https://www.morphllm.com/llm-guardrails), [Meta Prompt Guard / Llama Guard (Purple Llama)](https://ploomber.io/blog/presidio/), [Rebuff](https://www.protecto.ai/blog/best-llm-security-tools-safeguarding-large-language-models/), [Vigil](https://huggingface.co/VigilGuard/vigil-llm-guard) |
| **C2** | PII / DLP redaction | [Microsoft Presidio](https://ploomber.io/blog/presidio/) |
| **C3** | MCP scanners | [Invariant MCP-Scan](https://invariantlabs.ai/blog/introducing-mcp-scan), [Cisco MCP Scanner](https://blogs.cisco.com/ai/securing-the-ai-agent-supply-chain-with-ciscos-open-source-mcp-scanner), [Snyk agent-scan](https://github.com/snyk/agent-scan) |
| **C4** | Red-teaming / adversarial eval | [garak](https://www.giskard.ai/knowledge/nvidia-garak-alternatives-ai-red-teaming), [Microsoft PyRIT](https://generalanalysis.com/guides/best-ai-red-teaming-tools), [DeepTeam](https://www.trydeepteam.com/docs/frameworks-owasp-top-10-for-llms), [Giskard](https://www.giskard.ai/knowledge/nvidia-garak-alternatives-ai-red-teaming), Promptfoo |
| **C5** | Model supply-chain scanners | [Protect AI ModelScan](https://github.com/protectai/modelscan), [HiddenLayer Model Scanner](https://www.hiddenlayer.com/platform/ai-supply-chain-security) |
| **C6** | RAG-poisoning defenses **(mostly R)** | [RAGShield (R)](https://arxiv.org/html/2604.00387), [Cordon-MAS (R)](https://arxiv.org/pdf/2605.26754), RAGDefender (R), [RevPRAG (R)](https://arxiv.org/pdf/2411.18948) |
| **C7** | Information-flow / capability runtimes | [CaMeL (R)](https://arxiv.org/abs/2503.18813), [Capability tracking for agents (R)](https://arxiv.org/pdf/2603.00991) |
| **C8** | Agent egress firewall / runtime authority | [Agent firewalls (egress)](https://pipelab.org/agent-firewall/), [AIRGuard (R)](https://arxiv.org/pdf/2605.28914), [PAuth (R)](https://arxiv.org/pdf/2603.17170), [ActPlane (R)](https://arxiv.org/pdf/2606.25189) |
| **C9** | Observability / governance | [Arize](https://www.truefoundry.com/blog/best-ai-observability-platforms-for-llms-in-2026), [Fiddler](https://www.fiddler.ai/llmops), Credo AI |

---

## 3. The coverage matrix

**Legend:** ● = primary/strong control · ◐ = partial or probabilistic · ○ = indirect/detective only · — = no meaningful coverage. Ratings reflect *what the category can do at its best*, not a guarantee.

| Vuln ↓ / Category → | C1 Guardrails | C2 PII/DLP | C3 MCP scan | C4 Red-team | C5 Model scan | C6 RAG def | C7 IFC/CaMeL | C8 Egress/authority | C9 Observ. |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **V1** Direct injection | ◐ | — | — | ○ | — | — | ● | ○ | ○ |
| **V2** Indirect injection (trifecta) | ◐ | — | ◐ | ○ | — | ◐ | ● | ● | ○ |
| **V3** Jailbreaks / suffixes | ◐ | — | — | ◐ | — | — | ○ | ○ | ○ |
| **V4** PII / sensitive disclosure | ◐ | ● | — | ○ | — | — | ◐ | ◐ | ○ |
| **V5** System-prompt leakage | ◐ | — | — | ◐ | — | — | ○ | — | ○ |
| **V6** RAG poisoning | ○ | — | — | ○ | — | ◐ | ○ | — | ○ |
| **V7** Vector/embedding weakness | ○ | — | — | ○ | — | ◐ | ○ | — | ○ |
| **V8** MCP/tool poisoning | ◐ | — | ● | ◐ | — | — | ◐ | ◐ | ○ |
| **V9** Excessive agency | — | — | ○ | ○ | — | — | ● | ● | ○ |
| **V10** Weight-level backdoors | — | — | — | ◐ | ◐ | — | — | ○ | ○ |
| **V11** Improper output handling | ◐ | ◐ | — | ○ | — | — | ● | ○ | ○ |
| **V12** Covert exfiltration | ○ | ◐ | — | ○ | — | — | ● | ● | ◐ |
| **V13** Multi-agent propagation | ○ | — | ◐ | ○ | — | ◐ | ◐ | ◐ | ○ |
| **V14** Unbounded consumption | — | — | — | ○ | — | — | ○ | ◐ | ● |

### How to read it
- **No row is all-●.** Even the best-covered vulnerabilities depend on architectural controls (C7/C8), and those trade capability for safety.
- **C7 (IFC/CaMeL) is the only column with multiple ●**, because deterministic control-/data-flow separation is the only approach that *structurally* prevents rather than *probabilistically* detects. Its catch: it is research-stage and caps agent utility (research §4.1 — 77% of tasks vs 84% undefended).
- **C1 (guardrails) is mostly ◐** by design: a probabilistic classifier facing an adaptive adversary is a rate-limiter, not a boundary (research §6.4). EchoLeak bypassed exactly this layer.
- **Whole columns are thin.** No production tool meaningfully addresses V6/V7 (RAG poisoning) or V10 (weight-level backdoors) — those are the emptiest, most exposed rows.

---

## 4. The gap analysis — where the matrix is honestly empty

Reading the matrix by row exposes four under-served vulnerabilities. These drive the design proposals in [`novel-tool-proposals.md`](./novel-tool-proposals.md).

### Gap A — Weight-level behavioral backdoors (V10): no deployable coverage
Model scanners (C5) are the wrong tool. [ModelScan](https://github.com/protectai/modelscan) detects *serialization/code* attacks (malicious pickle, unsafe deserialization); [HiddenLayer](https://www.hiddenlayer.com/platform/ai-supply-chain-security) adds architectural-backdoor and code-execution detection. **Neither detects a backdoor encoded in the weights and triggered by an input phrase** — the Sleeper Agents class (research §3.5). Behavioral backdoor detection remains an open research problem ([arXiv:2511.19874](https://arxiv.org/pdf/2511.19874)). This is the single emptiest row against the highest-trust asset.

### Gap B — Guardrails inspect a different thing than the model infers (V1–V3)
The [Prompt Overflow](https://arxiv.org/html/2605.23196v1) result (research §3.6): C1 tools that score segments independently and threshold-aggregate are *structurally* beatable by fragmentation — no amount of classifier quality fixes an architectural mismatch. The matrix's pervasive ◐ in C1 is this weakness.

### Gap C — MCP scanning is a snapshot, but the attacks are temporal (V8, V13)
[MCP-Scan](https://invariantlabs.ai/blog/introducing-mcp-scan) does static description scanning + tool-pinning. But rug-pulls and tool-shadowing are *behavioral and time-varying* — a server benign at scan time turns malicious later. Point-in-time scanning cannot see this; continuous attestation is needed and largely absent from products.

### Gap D — Provenance/trust is siloed per layer (V2, V6, V12, V13)
RAG provenance (C6), MCP trust (C3), IFC labels (C7), and egress policy (C8) each track "where did this come from / can it do that" **in isolation, with incompatible representations**. The lethal trifecta is a whole-pipeline property, so a defense fragmented across layers has seams at every boundary — exactly where EchoLeak-class exfiltration lives. No product carries one provenance label end-to-end from ingestion through tool-call to egress.

---

## 5. Practical enterprise stack (what to actually deploy today)

Given the gaps, the defensible posture is *layered architecture*, not any single tool:

1. **Architecture first (C7/C8):** for any high-privilege agent, adopt a CaMeL-style or design-pattern-constrained topology and an egress allowlist. This is the only ● coverage available. Break the trifecta wherever possible.
2. **Guardrails as friction (C1/C2):** deploy Presidio + a guardrail suite on input, retrieved content, *and* tool outputs — understood as rate-limiters, never as the boundary.
3. **Supply chain (C5):** gate every model/adapter through ModelScan/HiddenLayer for code/serialization attacks — while knowing V10 (weight backdoors) remains uncovered.
4. **MCP hygiene (C3):** scan + pin all MCP servers; treat every third-party server as untrusted.
5. **Continuous assurance (C4/C9):** run garak/PyRIT/DeepTeam in CI and Arize/Fiddler in production, mapped to MITRE ATLAS. These find failures; they never prove their absence.
