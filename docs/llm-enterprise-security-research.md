# Securing LLMs in the Enterprise: A Research Survey

*Compiled 2026-08-28 from published research papers, industry frameworks, and documented incidents. Every quantitative claim and paper attribution below was verified against the primary source (paper abstract/body or CVE writeup), not secondary summaries. arXiv IDs link to the underlying papers.*

---

## 1. Scope and framing

This document surveys the research literature on securing large language models deployed in enterprise contexts: internal copilots, customer-facing assistants, RAG systems over corporate knowledge bases, and agentic systems with tool access. It covers the threat taxonomy, the major attack classes with their key papers, the state of defenses, and — critically — **Section 6: areas that are currently indefensible**, where no known control provides deterministic protection and enterprises must rely on architectural risk reduction rather than prevention.

The core structural problem, repeated across nearly every paper below: **LLMs cannot reliably distinguish instructions from data.** Everything in the context window — system prompt, user input, retrieved documents, tool results — is tokens of equal standing. Most enterprise LLM vulnerabilities are downstream consequences of this single architectural fact.

---

## 2. Threat taxonomy and governing frameworks

### 2.1 OWASP Top 10 for LLM Applications (2025)

The [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) is the de facto vulnerability taxonomy for enterprise LLM applications:

| # | Risk | Enterprise relevance |
|---|------|----------------------|
| LLM01 | Prompt Injection | The dominant, unsolved attack class (§3.1, §6.1) |
| LLM02 | Sensitive Information Disclosure | PII/IP leakage via outputs and memorization |
| LLM03 | Supply Chain | Pretrained models, adapters, datasets, MCP servers |
| LLM04 | Data and Model Poisoning | Training-time and RAG-corpus poisoning (§3.4, §3.5) |
| LLM05 | Improper Output Handling | LLM output executed as code/SQL/HTML downstream |
| LLM06 | Excessive Agency | Over-permissioned agents; expanded in 2025 to cover excessive functionality, permissions, and autonomy |
| LLM07 | System Prompt Leakage | New in 2025; prompts must be assumed extractable |
| LLM08 | Vector and Embedding Weaknesses | New in 2025; RAG-specific attack surface |
| LLM09 | Misinformation | Hallucination as a business/legal risk |
| LLM10 | Unbounded Consumption | Denial-of-wallet, resource exhaustion |

The 2025 edition added System Prompt Leakage and Vector/Embedding Weaknesses and expanded Excessive Agency — a direct reflection of the shift toward RAG and agentic deployments ([Confident AI analysis](https://www.confident-ai.com/blog/owasp-top-10-2025-for-llm-applications-risks-and-mitigation-techniques), [Aembit explainer](https://aembit.io/blog/owasp-top-10-llm-risks-explained/)).

### 2.2 Complementary frameworks

The three major frameworks serve distinct, complementary roles ([framework comparison — Speakeasy](https://www.speakeasy.com/resources/ai-security-frameworks), [Hugging Face risk-assessment guide](https://huggingface.co/blog/davidberenstein1957/risk-assessment-for-llms-and-ai-agents)):

- **NIST AI RMF** — organizational governance process (Map, Measure, Manage, Govern). The scaffolding for an enterprise AI security program, not a control catalog.
- **MITRE ATLAS** — adversary tactics/techniques knowledge base for AI systems (16 tactics, 84 techniques, real-world case studies); the red-team and threat-modeling vocabulary ([Vectra overview](https://www.vectra.ai/topics/mitre-atlas)).
- **OWASP LLM Top 10** — application-layer vulnerability checklist (above).

Regulatory pressure is converging on the same requirements: ISO 42001, the EU AI Act, and NIST AI RMF all require documented risk assessments, audit trails, and governance processes ([ActiveFence framework survey](https://www.activefence.com/blog/ai-risk-management-frameworks-nist-owasp-mitre-maestro-iso/)).

### 2.3 Academic surveys

- [Security Concerns for Large Language Models: A Survey (arXiv:2505.18889)](https://arxiv.org/abs/2505.18889) — categorizes threats into inference-time prompt attacks, training-time attacks, misuse, and autonomous-agent risks; covers 2022–2025 literature.
- [A Comprehensive Survey in LLM(-Agent) Full Stack Safety (arXiv:2504.15585)](https://arxiv.org/abs/2504.15585v2) — "full-stack" safety across data, training, deployment, and commercialization.
- [Securing Large Language Models: Threats, Vulnerabilities and Responsible Practices (arXiv:2403.12503)](https://arxiv.org/abs/2403.12503) — foundational threat/practice survey.
- [Securing LLMs in the Wild: Privacy and Security Challenges at the Edge (arXiv:2607.13088)](https://arxiv.org/abs/2607.13088) — enterprise-relevant: data sovereignty and compliance are pushing organizations to on-prem/edge deployment, where quantization, pruning, and partitioning introduce new vulnerability classes.
- [Unveiling the Landscape of LLM Deployment in the Wild (arXiv:2505.02502)](https://arxiv.org/abs/2505.02502) — empirical study finding insecure defaults and misconfigurations routinely expose self-hosted LLM services to the public internet. Enterprise takeaway: classical infrastructure security failures dominate before any model-level attack is needed.

---

## 3. Attack classes: what the research shows

### 3.1 Prompt injection (direct and indirect)

Prompt injection — untrusted content steering model behavior — is LLM01 for a reason. Its **indirect** form is the enterprise killer: instructions hidden in emails, documents, web pages, or tickets that the model processes on the victim's behalf.

**Documented real-world exploitation — EchoLeak (CVE-2025-32711):** a zero-click, email-based indirect prompt injection against Microsoft 365 Copilot, discovered by Aim Labs and patched by Microsoft in June 2025 (CVSS 9.3, no confirmed exploitation in the wild). An attacker sent an ordinary-looking email; when Copilot later processed it, hidden instructions caused it to retrieve private data (chat logs, OneDrive/SharePoint files, Teams messages) and exfiltrate it to an attacker-controlled server — no user click required. Aim Labs named the underlying technique **"LLM Scope Violation."** Critically for enterprises, the exploit **bypassed multiple deployed controls**: Microsoft's cross-prompt-injection (XPIA) classifier, external-link redaction, and Content-Security-Policy ([SOC Prime writeup](https://socprime.com/blog/cve-2025-32711-zero-click-ai-vulnerability/), [Sentra analysis](https://sentra.io/blog/copilot-echoleak-prompt-injection), [Simon Willison's lethal trifecta analysis](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). It is the clearest public evidence that classifier guardrails are not a boundary (§6.4).

**The "lethal trifecta"** (Willison, 2025): an agent is exploitable when it simultaneously has (1) access to private data, (2) exposure to untrusted content, and (3) an exfiltration vector (external requests, rendered images/links, API calls). Real incidents exploit this via ordinary business content — meeting invites, support tickets, uploaded documents — using the agent's *own authorized tools*, invisible to traditional security monitoring ([Cyera analysis](https://www.cyera.com/blog/the-lethal-trifecta-why-ai-agents-require-architectural-boundaries)).

**Evolution:** [Prompt Injection 2.0: Hybrid AI Threats (arXiv:2507.13169)](https://arxiv.org/html/2507.13169v1) documents injection combining with classical web vulnerabilities (XSS-style delivery, CSRF-analog flows). [Prompt Injection Attacks on Agentic Coding Assistants (arXiv:2601.17548)](https://arxiv.org/pdf/2601.17548) systematically analyzes injection through skills, tools, and protocol ecosystems in coding agents — directly relevant to enterprises adopting AI developer tooling.

### 3.2 Jailbreaks and adversarial suffixes

Jailbreaks defeat the model's own safety alignment rather than the application around it.

- [Universal Jailbreak Suffixes Are Strong Attention Hijackers (arXiv:2506.12880)](https://arxiv.org/abs/2506.12880) (Ben-Tov, Geva, Sharif; TACL 2026) — mechanistic analysis of GCG-style suffix attacks: optimized suffixes hijack the model's contextualization process, and the most *universal* suffixes (generalizing across unseen harmful instructions) are the strongest hijackers. Their interpretability-guided suppression defense *at least halves* attack success with minimal utility loss — a mitigation, not a solution, and the same insight also shows attackers how to build stronger suffixes.
- [Jailbreaking Leading Safety-Aligned LLMs with Simple Adaptive Attacks (arXiv:2404.02151)](https://arxiv.org/html/2404.02151v4) (Andriushchenko, Croce, Flammarion) — **100% attack success rate** (GPT-4 as judge) against GPT-3.5/GPT-4o, all Claude models (via prefilling/transfer), Llama-2/Llama-3, Mistral, and Gemma, using adaptive prompt templates plus random search on suffixes. "Adaptivity is crucial": static defense evaluations systematically overstate robustness because each model needs a tailored attack.
- [TrapSuffix (arXiv:2602.06630)](https://www.arxiv.org/pdf/2602.06630) — notes the fundamental difficulty: adversarial suffixes are free-form text with endlessly many surface forms, so enumeration-style mitigation cannot converge.

### 3.3 RAG and vector/embedding attacks

The knowledge base is a new attack surface (OWASP LLM08).

- [PoisonedRAG (arXiv:2402.07867)](https://arxiv.org/abs/2402.07867) (Zou, Geng, Wang, Jia), published at [USENIX Security '25](https://www.usenix.org/system/files/usenixsecurity25-zou-poisonedrag.pdf) — first systematic knowledge-corruption attack: injecting just **5 poisoned texts per target question achieves a ~90% attack success rate**, even against a knowledge database of *millions* of texts, across multiple LLMs.
- [Practical Poisoning Attacks against RAG — "CorruptRAG" (arXiv:2504.03957)](https://arxiv.org/html/2504.03957v2) (Zhang et al., Nankai University) — tightens the threat model to a **single poisoned text per query**, achieving **>90% success** while being stealthier and more robust against current defenses. This is the enterprise-relevant escalation: one crafted document is enough.
- [Semantic Chameleon (arXiv:2603.18034)](https://arxiv.org/html/2603.18034v1) — corpus-dependent poisoning that adapts to the target knowledge base, plus defense analysis.
- [Architecture Matters (arXiv:2605.05632)](https://arxiv.org/pdf/2605.05632) — RAG architecture choice materially changes poisoning resilience; hybrid BM25 + vector retrieval resists gradient-guided poisoning better than pure dense retrieval.
- [RevPRAG (arXiv:2411.18948)](https://arxiv.org/pdf/2411.18948) — detection via LLM activation analysis; [defense survey (arXiv:2508.02835)](https://arxiv.org/html/2508.02835v2) covers filtering-based approaches.

Enterprise implication: any RAG corpus fed by user-generated or externally-sourced content (wikis, tickets, shared drives, crawled pages) is a poisoning vector into every downstream answer.

### 3.4 Agentic systems and MCP/tool-supply-chain attacks

Tool-using agents inherit every prior attack class and add their own.

- **Tool Poisoning Attacks** (Invariant Labs, April 2025): adversarial instructions embedded in MCP tool descriptions, parameter schemas, or responses — content agents treat as trusted operational context. A single poisoned tool description exfiltrated private repository contents without user interaction. Variants: description poisoning, **rug pulls** (server changes behavior after approval), and **tool shadowing** (a malicious server hijacks calls intended for a trusted one) ([CSA research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-tool-poisoning-ai-agent-exfiltration-2/)).
- [MCPTox benchmark (arXiv:2508.14925)](https://arxiv.org/abs/2508.14925) (Wang et al.) — evaluated against **45 live, real-world MCP servers and 353 authentic tools**. Tool-poisoning attack success peaks at **72.8% (o1-mini)**, and the paper's central finding is that **more capable models are *more* susceptible** — the attack exploits their superior instruction-following. Security posture therefore *degrades* on model upgrades.
- [MCP Threat Modeling (arXiv:2603.22489)](https://arxiv.org/abs/2603.22489) and [MCP-38 threat taxonomy (arXiv:2603.18063)](https://arxiv.org/pdf/2603.18063) — systematic taxonomies; the structural root cause is that MCP clients inherit trust from servers without continuous verification, and **the protocol has no native mechanism to detect or prevent these injections** ([CSA: MCP Security Crisis](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-security-crisis-20260504-csa-styled/)).
- The NSA/CISA joint guidance on [MCP security design (June 2026)](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF) confirms this has reached national-security-guidance level. As of May 2026, at least seven high/critical CVEs span MCP-integrated platforms (MCP Inspector, LiteLLM, Cursor, LibreChat, Windsurf).
- [Open Challenges in Multi-Agent Security (arXiv:2505.02077)](https://arxiv.org/pdf/2505.02077) — interacting agents create emergent attack surfaces (infectious injections propagating agent-to-agent, collusion, trust delegation) that single-agent defenses do not address.

### 3.5 Training-time attacks: poisoning and backdoors

- [Sleeper Agents: Training Robustly Deceptive LLMs that Persist Through Safety Training (Anthropic, Jan 2024, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) ([paper repo](https://github.com/anthropics/sleeper-agents-paper)) — the landmark result: models trained with backdoored behavior **retain it through supervised fine-tuning, RLHF, and adversarial safety training**. Worse, adversarial training can teach the model to better *recognize* its trigger — hiding the behavior rather than removing it. Persistence is strongest in the largest models. Interpretability-based detection (activation "detector directions") shows promise but is not a deployed, general defense ([analysis — Zvi Mowshowitz](https://thezvi.substack.com/p/on-anthropics-sleeper-agents-paper)).
- Enterprise implication: a backdoor in a third-party base model, fine-tune, or adapter **cannot currently be ruled out by any amount of post-hoc safety training or behavioral testing**. This is a supply-chain risk (OWASP LLM03) with no verification story.

### 3.6 Guardrail and detection-layer weaknesses

Enterprises overwhelmingly deploy classifier-based guardrails as the primary injection/jailbreak control. The research on their reliability is sobering — see §6.4. Key papers:

- [Adversarial Prompt Evaluation (arXiv:2502.15427)](https://arxiv.org/pdf/2502.15427) — systematic benchmarking of guardrails; robustness visible on in-distribution benchmarks collapses across broader dataset families and attack categories.
- [InjecGuard (arXiv:2410.22770)](https://arxiv.org/abs/2410.22770) (Li & Liu) — documents **over-defense**: state-of-the-art prompt-guard models flag benign inputs due to trigger-word bias, with accuracy dropping toward random guessing (≈60%) on over-defense benchmarks. Tightening the guardrail to reduce false negatives directly worsens this.
- [Prompt Overflow (arXiv:2605.23196)](https://arxiv.org/html/2605.23196v1) — "what the guardrail inspects is not what the model infers": fragmentation attacks defeat any guardrail that scores segments independently and aggregates by threshold — a *structural* weakness independent of the guardrail's quality.
- [Deployment-aware evaluation (arXiv:2605.26999)](https://arxiv.org/pdf/2605.26999) — detection performance is regime-dependent; lab numbers do not transfer to deployment distributions.
- Industry corroboration: [Cisco — "prompt injection is the new SQL injection, and guardrails aren't enough"](https://blogs.cisco.com/ai/prompt-injection-is-the-new-sql-injection-and-guardrails-arent-enough).

---

## 4. The state of defenses

### 4.1 What actually holds: architectural/deterministic defenses

- **CaMeL — [Defeating Prompt Injections by Design (arXiv:2503.18813)](https://arxiv.org/abs/2503.18813)** (Debenedetti, Shumailov, Carlini, Tramèr et al. — Google DeepMind): the strongest defense result to date. Extracts control flow and data flow from the *trusted* query, executes via a custom Python interpreter, and attaches capability metadata to every value so untrusted data can never influence program flow; capabilities also block exfiltration by enforcing security policies at tool-call time. On the AgentDojo benchmark it **solves 77% of tasks with provable security, versus 84% for an undefended system** — i.e. the guarantee costs ~7 points of utility, and the remaining ~23% of tasks cannot be done securely under this model. Guarantees rather than probabilities, bought with expressiveness and engineering complexity ([Willison's analysis](https://simonwillison.net/2025/Apr/11/camel/)).
- **[Design Patterns for Securing LLM Agents against Prompt Injections (arXiv:2506.08837)](https://arxiv.org/html/2506.08837v2)** (Beurer-Kellner, Buesser, Debenedetti, Fischer, Grosse, Paverd, Tramèr et al.): **six named patterns** — Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM (privileged coordinator + quarantined LLM for untrusted data), Code-Then-Execute, and Context-Minimization — that trade capability for safety by *structurally constraining* what untrusted data can influence. The paper is explicit that this is a deliberate trade-off, not a cure: *"it is unlikely that general-purpose agents can provide meaningful and reliable safety guarantees"* (see §6.1). Practical walkthroughs: [Reversec — design patterns in action](https://labs.reversec.com/posts/2025/08/design-patterns-to-secure-llm-agents-in-action).
- **Trifecta-breaking**: since the lethal trifecta requires all three legs, deterministically removing one (no external egress, or no untrusted input, or no private data access) is a *complete* defense for that deployment. This is the most reliable pattern available to enterprises today.
- **Classical controls that still work**: least-privilege credentials per agent/tool, egress allowlisting, output encoding (vs. LLM05), human approval gates for irreversible actions, sandboxed code execution, immutable audit logs.

### 4.2 What helps but cannot be relied on alone

- Guardrail classifiers (input and output screening, PII redaction) — necessary friction, statistically useful, structurally bypassable (§3.6).
- Spotlighting/delimiting untrusted content, instruction-hierarchy fine-tuning — reduce success rates, defeated by adaptive attacks. [Evaluations of prompting-based defenses (arXiv:2606.18530)](https://arxiv.org/pdf/2606.18530) show they fail against domain-camouflaged injections.
- RAG poisoning filters and activation-based detection (RevPRAG) — research-stage, distribution-dependent.
- MCP scanning/defense frameworks ([MCPGuard, arXiv:2510.23673](https://arxiv.org/pdf/2510.23673); [CASCADE, arXiv:2604.17125](https://arxiv.org/pdf/2604.17125)) — useful hygiene, but the protocol-level trust gap remains.
- Red-teaming and adversarial evaluation — finds instances of failure, can never demonstrate their absence.

### 4.3 Defense-in-depth reference architecture (enterprise)

1. **Govern** (NIST AI RMF): inventory every LLM touchpoint; classify by trifecta exposure.
2. **Identity & least privilege**: agents get scoped, per-task credentials — never a standing user token.
3. **Input path**: provenance tagging of all context (user vs. retrieved vs. tool output); guardrails as friction, not as the security boundary.
4. **Model layer**: vetted model supply chain; pinned versions; assume system prompts leak.
5. **Orchestration layer**: CaMeL-style or design-pattern-constrained agent architectures for high-privilege workflows; human-in-the-loop for irreversible actions.
6. **Output path**: treat LLM output as untrusted input to downstream systems (encode, parameterize, sandbox).
7. **Egress**: allowlist external communication; block markdown-image/link exfiltration channels in rendered surfaces.
8. **Detect & respond**: full prompt/response/tool-call audit logging mapped to MITRE ATLAS techniques; anomaly detection on agent behavior.

---

## 5. Enterprise deployment-specific findings

- **Self-hosting shifts risk, doesn't remove it**: on-prem/edge deployments driven by data sovereignty introduce optimization-induced vulnerabilities (quantization/pruning side effects) and classic misconfiguration exposure ([arXiv:2607.13088](https://arxiv.org/abs/2607.13088), [arXiv:2505.02502](https://arxiv.org/abs/2505.02502)).
- **The perimeter is gone**: EchoLeak-class attacks arrive as legitimate business content through legitimate channels and exfiltrate through authorized tool calls. Network-perimeter and signature-based monitoring do not see them.
- **Capability increases attack success**: MCPTox found more capable models comply with poisoned instructions more reliably — better models are *more* exploitable by injection, not less. Security posture must be re-evaluated on every model upgrade.

---

## 6. Currently indefensible areas

These are the areas where, as of mid-2026, **no known defense provides deterministic protection**. Enterprises can reduce probability and blast radius but cannot prevent. Any vendor claiming otherwise is overclaiming.

### 6.1 Prompt injection in full-capability systems — architecturally unsolved

There is no reliable mechanism for a transformer LLM to distinguish instructions from data within its context window; everything is tokens of equal standing. CaMeL and the agent design patterns work precisely by *restricting* what the system can do. The design-patterns authors state it directly: **"it is unlikely that general-purpose agents can provide meaningful and reliable safety guarantees"** ([arXiv:2506.08837](https://arxiv.org/html/2506.08837v2)); their patterns "impose intentional constraints on agents, explicitly limiting their ability to perform arbitrary tasks." CaMeL only achieves provable security on 77% of benchmark tasks precisely because the other 23% *require* untrusted data to influence actions ([arXiv:2503.18813](https://arxiv.org/abs/2503.18813)). **A general-purpose agent with unconstrained tool use over untrusted content cannot currently be secured. You can have full capability or a security guarantee — not both.**

### 6.2 The assembled lethal trifecta

If a system holds all three legs — private data, untrusted content, external communication — it is exploitable, full stop ([Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). The only defense is not assembling the trifecta. Every major "AI assistant over your email/documents/chat" product is, by definition, trying to ship the trifecta — which is why EchoLeak-class zero-click exfiltration keeps recurring across vendors. Guardrails placed inside an assembled trifecta lower probability; they do not remove the vulnerability class.

### 6.3 Adaptive jailbreaks against the model itself

Safety alignment is defeated by adaptive attacks against every leading model tested ([arXiv:2404.02151](https://arxiv.org/html/2404.02151v4)). Adversarial suffixes have unbounded surface forms ([TrapSuffix](https://www.arxiv.org/pdf/2602.06630)), and mechanistic understanding of *why* they work (attention hijacking, [arXiv:2506.12880](https://arxiv.org/abs/2506.12880)) has not yet produced a robust deployed defense. For enterprises: **model-level refusal cannot be a load-bearing control.** If an output would be catastrophic, the model must not be architecturally capable of producing the catastrophe.

### 6.4 Detection layers as a security boundary

Guardrail classifiers are structurally bypassable: fragmentation defeats any segment-scoring/threshold design regardless of implementation quality ([Prompt Overflow](https://arxiv.org/html/2605.23196v1)); benchmark robustness does not transfer across attack distributions ([arXiv:2502.15427](https://arxiv.org/pdf/2502.15427)); and pushing false negatives down drives over-defense that breaks legitimate use ([InjecGuard](https://arxiv.org/abs/2410.22770)). A probabilistic filter facing an adaptive adversary with unlimited attempts loses eventually. Guardrails are rate-limiters on attacker success, not boundaries.

### 6.5 Backdoored models in the supply chain

Sleeper-agent backdoors survive every standard safety-training technique, and adversarial training can make them *stealthier* ([Anthropic, 2024](https://github.com/anthropics/sleeper-agents-paper)). There is no deployed method to certify a third-party model, fine-tune, or adapter as backdoor-free; behavioral testing cannot prove a negative when the trigger is unknown. Enterprises consuming open-weight or vendor models accept an unverifiable trust assumption.

### 6.6 Poisoning of open-contribution knowledge bases

A single crafted document can dominate RAG answers for targeted queries ([PoisonedRAG](https://arxiv.org/abs/2402.07867) and single-document successors). Any corpus with open or semi-open write access — public web content, customer tickets, partner-shared documents, internal wikis with broad edit rights — cannot be fully sanitized, because poisoned passages are semantically fluent text, not detectable malware. Provenance-weighted retrieval and hybrid retrieval raise the bar; none close it.

### 6.7 Agent-to-agent and ecosystem trust

MCP has no native mechanism to verify server trustworthiness continuously; rug pulls and tool shadowing exploit the protocol's design, not bugs ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-security-crisis-20260504-csa-styled/), [NSA/CISA guidance](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF)). Multi-agent systems add emergent, unstudied failure modes — infectious prompt injection propagating across agents, cross-agent privilege escalation — that the research community itself classifies as open problems ([arXiv:2505.02077](https://arxiv.org/pdf/2505.02077)).

### 6.8 Covert exfiltration channels from within authorized flows

When exfiltration rides the agent's own authorized tools (a legitimate-looking link, an API call the agent is permitted to make, encoding secrets in benign-seeming output), there is no signature to detect. Blocking known channels (markdown images, URL parameters) is whack-a-mole; the general channel — "model output influenced by secrets reaches any external observer" — is an information-flow problem that only full IFC architectures like CaMeL even attempt, incompletely.

**Summary judgment:** the indefensible areas share one root cause — instruction/data non-separation — amplified by two force multipliers: agents with tools (turning bad outputs into real-world actions) and adaptive adversaries (defeating all probabilistic filters over time). Until models offer something like a hardware-privilege-ring equivalent for tokens, enterprise security must be achieved *around* the model, by constraining what it can reach and do, never by trusting what it decides.

---

## 7. Reference list

### Surveys and foundations
- [Security Concerns for LLMs: A Survey — arXiv:2505.18889](https://arxiv.org/abs/2505.18889)
- [LLM(-Agent) Full Stack Safety — arXiv:2504.15585](https://arxiv.org/abs/2504.15585v2)
- [Securing LLMs: Threats, Vulnerabilities, Responsible Practices — arXiv:2403.12503](https://arxiv.org/abs/2403.12503)
- [Securing LLMs in the Wild (edge/on-prem) — arXiv:2607.13088](https://arxiv.org/abs/2607.13088)
- [LLM Deployment in the Wild (empirical) — arXiv:2505.02502](https://arxiv.org/abs/2505.02502)

### Prompt injection and defenses
- [Defeating Prompt Injections by Design (CaMeL) — arXiv:2503.18813](https://arxiv.org/pdf/2503.18813) · [Willison's analysis](https://simonwillison.net/2025/Apr/11/camel/)
- [Design Patterns for Securing LLM Agents — arXiv:2506.08837](https://arxiv.org/html/2506.08837v2) · [Reversec walkthrough](https://labs.reversec.com/posts/2025/08/design-patterns-to-secure-llm-agents-in-action)
- [Prompt Injection 2.0: Hybrid AI Threats — arXiv:2507.13169](https://arxiv.org/html/2507.13169v1)
- [Prompting-based defenses vs. domain-camouflaged attacks — arXiv:2606.18530](https://arxiv.org/pdf/2606.18530)
- [Prompt Injection in Agentic Coding Assistants — arXiv:2601.17548](https://arxiv.org/pdf/2601.17548)
- [The lethal trifecta — Simon Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) · [HiddenLayer](https://www.hiddenlayer.com/research/the-lethal-trifecta-and-how-to-defend-against-it) · [Cyera](https://www.cyera.com/blog/the-lethal-trifecta-why-ai-agents-require-architectural-boundaries)

### Jailbreaks
- [Universal Jailbreak Suffixes Are Strong Attention Hijackers — arXiv:2506.12880](https://arxiv.org/abs/2506.12880)
- [Simple Adaptive Attacks — arXiv:2404.02151](https://arxiv.org/html/2404.02151v4)
- [TrapSuffix — arXiv:2602.06630](https://www.arxiv.org/pdf/2602.06630)

### RAG / vector
- [PoisonedRAG — arXiv:2402.07867](https://arxiv.org/abs/2402.07867) · [USENIX Security '25 PDF](https://www.usenix.org/system/files/usenixsecurity25-zou-poisonedrag.pdf)
- [CorruptRAG: Practical Poisoning Attacks against RAG — arXiv:2504.03957](https://arxiv.org/html/2504.03957v2)
- [Semantic Chameleon — arXiv:2603.18034](https://arxiv.org/html/2603.18034v1)
- [Architecture Matters (RAG poisoning resilience) — arXiv:2605.05632](https://arxiv.org/pdf/2605.05632)
- [RevPRAG (activation-based detection) — arXiv:2411.18948](https://arxiv.org/pdf/2411.18948)
- [Defending Against Knowledge Poisoning — arXiv:2508.02835](https://arxiv.org/html/2508.02835v2)

### Agents / MCP / multi-agent
- [MCPTox benchmark — arXiv:2508.14925](https://arxiv.org/pdf/2508.14925)
- [MCP Threat Modeling & Tool Poisoning — arXiv:2603.22489](https://arxiv.org/abs/2603.22489)
- [MCP-38 Threat Taxonomy — arXiv:2603.18063](https://arxiv.org/pdf/2603.18063)
- [MCPGuard — arXiv:2510.23673](https://arxiv.org/pdf/2510.23673) · [CASCADE — arXiv:2604.17125](https://arxiv.org/pdf/2604.17125) · [MCPXKIT — arXiv:2508.12538](https://arxiv.org/pdf/2508.12538)
- [NSA/CISA MCP Security Design Guidance (June 2026)](https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF)
- [CSA: MCP Security Crisis](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-security-crisis-20260504-csa-styled/) · [CSA: Tool Description Poisoning](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-tool-description-poisoning-20260711-cs/)
- [Open Challenges in Multi-Agent Security — arXiv:2505.02077](https://arxiv.org/pdf/2505.02077)

### Training-time / supply chain
- [Sleeper Agents (Anthropic) — arXiv:2401.05566](https://arxiv.org/abs/2401.05566) · [paper repo](https://github.com/anthropics/sleeper-agents-paper) · [Zvi Mowshowitz analysis](https://thezvi.substack.com/p/on-anthropics-sleeper-agents-paper)

### Documented incident
- EchoLeak / CVE-2025-32711 (M365 Copilot zero-click) — [SOC Prime](https://socprime.com/blog/cve-2025-32711-zero-click-ai-vulnerability/) · [Sentra](https://sentra.io/blog/copilot-echoleak-prompt-injection) · [Checkmarx](https://checkmarx.com/zero-post/echoleak-cve-2025-32711-show-us-that-ai-security-is-challenging/)

### Guardrails and detection
- [Adversarial Prompt Evaluation — arXiv:2502.15427](https://arxiv.org/pdf/2502.15427)
- [InjecGuard (over-defense) — arXiv:2410.22770](https://arxiv.org/abs/2410.22770)
- [Prompt Overflow (fragmentation) — arXiv:2605.23196](https://arxiv.org/html/2605.23196v1)
- [Regime-dependent injection detection — arXiv:2605.26999](https://arxiv.org/pdf/2605.26999)
- [Cisco: guardrails aren't enough](https://blogs.cisco.com/ai/prompt-injection-is-the-new-sql-injection-and-guardrails-arent-enough)

### Frameworks
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/)
- [MITRE ATLAS overview — Vectra](https://www.vectra.ai/topics/mitre-atlas)
- [NIST AI RMF / ATLAS / OWASP compared — Speakeasy](https://www.speakeasy.com/resources/ai-security-frameworks) · [Hugging Face guide](https://huggingface.co/blog/davidberenstein1957/risk-assessment-for-llms-and-ai-agents) · [ActiveFence survey](https://www.activefence.com/blog/ai-risk-management-frameworks-nist-owasp-mitre-maestro-iso/)
