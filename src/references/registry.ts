/**
 * The reference registry — one typed source of truth for every citation.
 *
 * Components cite by id, so no URL or citation text is ever hand-duplicated,
 * and the build gate can prove every citation resolves. Each entry records the
 * claim exactly as this tutorial uses it plus a confidence-and-caveat line, so
 * the reference panel teaches source-critical reading rather than acting as a
 * bibliography footnote.
 *
 * Every figure below was verified against the primary source (see
 * docs/llm-enterprise-security-research.md).
 */

export type ReferenceKind = 'paper' | 'incident' | 'framework' | 'analysis'

export interface Reference {
  id: string
  kind: ReferenceKind
  title: string
  authors: string
  venue: string
  date: string
  url: string
  /** Plain-language summary of what the source says. */
  summary: string
  /** The specific claim this tutorial draws from it. */
  claimAsUsed: string
  /** Conditions and limits — what the number does NOT mean. */
  caveat: string
}

export const REFERENCES: Record<string, Reference> = {
  echoleak: {
    id: 'echoleak',
    kind: 'incident',
    title: 'EchoLeak (CVE-2025-32711): zero-click prompt injection in Microsoft 365 Copilot',
    authors: 'Aim Labs; patched by Microsoft',
    venue: 'CVE / vendor advisory',
    date: 'June 2025',
    url: 'https://socprime.com/blog/cve-2025-32711-zero-click-ai-vulnerability/',
    summary:
      'A crafted email caused Copilot to read hidden instructions and send private data (chat logs, OneDrive and SharePoint files, Teams messages) to an attacker-controlled server, with no user click. Aim Labs named the technique "LLM Scope Violation". CVSS 9.3.',
    claimAsUsed:
      'Indirect prompt injection is not theoretical: an ordinary-looking email reached a production assistant and exfiltrated private data with no user interaction.',
    caveat:
      'Microsoft patched it server-side and reported no exploitation in the wild. Notably it bypassed the deployed XPIA classifier, link redaction and CSP — which is why guardrails are treated here as friction, not a boundary.',
  },

  trifecta: {
    id: 'trifecta',
    kind: 'analysis',
    title: 'The lethal trifecta for AI agents',
    authors: 'Simon Willison',
    venue: 'simonwillison.net',
    date: 'June 2025',
    url: 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/',
    summary:
      'An agent is exploitable when it simultaneously has access to private data, exposure to untrusted content, and a way to communicate externally. Remove any one leg and that class of attack cannot complete.',
    claimAsUsed:
      'The three-leg model used throughout this tutorial to diagnose whether a system is exploitable, and to choose which capability to cut.',
    caveat:
      'This is a descriptive framing rather than a formal proof. It tells you when you are exposed; it does not tell you that a system missing one leg is safe from every other attack class.',
  },

  camel: {
    id: 'camel',
    kind: 'paper',
    title: 'Defeating Prompt Injections by Design (CaMeL)',
    authors: 'Debenedetti, Shumailov, Fan, Hayes, Carlini, Fabian, Kern, Shi, Terzis, Tramèr',
    venue: 'arXiv:2503.18813 (Google DeepMind)',
    date: 'March 2025',
    url: 'https://arxiv.org/abs/2503.18813',
    summary:
      'Extracts control flow and data flow from the trusted query and runs it through a custom interpreter, attaching capability metadata to every value so untrusted data can never influence program flow, and enforcing policies at tool-call time to block exfiltration.',
    claimAsUsed:
      'Deterministic information-flow control is the only approach that structurally prevents rather than probabilistically detects prompt injection.',
    caveat:
      'On AgentDojo it solves 77% of tasks with provable security versus 84% undefended — the guarantee costs roughly 7 points of utility, and the remaining ~23% of tasks cannot be done securely under this model at all.',
  },

  designPatterns: {
    id: 'designPatterns',
    kind: 'paper',
    title: 'Design Patterns for Securing LLM Agents against Prompt Injections',
    authors: 'Beurer-Kellner, Buesser, Creţu, Debenedetti, Fischer, Grosse, Paverd, Tramèr et al.',
    venue: 'arXiv:2506.08837',
    date: 'June 2025',
    url: 'https://arxiv.org/html/2506.08837v2',
    summary:
      'Six patterns that constrain what untrusted data can influence: Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM, Code-Then-Execute, and Context-Minimization.',
    claimAsUsed:
      'Defenses that hold work by deliberately limiting capability; the six patterns are the menu of that trade-off.',
    caveat:
      'The authors are explicit that this is a trade-off, not a cure: "it is unlikely that general-purpose agents can provide meaningful and reliable safety guarantees."',
  },

  poisonedRag: {
    id: 'poisonedRag',
    kind: 'paper',
    title: 'PoisonedRAG: Knowledge Corruption Attacks to Retrieval-Augmented Generation',
    authors: 'Zou, Geng, Wang, Jia',
    venue: 'USENIX Security 2025 (arXiv:2402.07867)',
    date: 'February 2024',
    url: 'https://arxiv.org/abs/2402.07867',
    summary:
      'The first systematic knowledge-corruption attack on RAG: injecting a small number of crafted passages makes the system return an attacker-chosen answer for a targeted question.',
    claimAsUsed:
      'A retrieval corpus is an attack surface: a handful of documents can control the answer.',
    caveat:
      'Roughly 90% attack success with five poisoned texts per target question, against a database of millions — the figure is per targeted question, not a blanket success rate over all queries.',
  },

  corruptRag: {
    id: 'corruptRag',
    kind: 'paper',
    title: 'Practical Poisoning Attacks against Retrieval-Augmented Generation (CorruptRAG)',
    authors: 'Zhang et al. (Nankai University)',
    venue: 'arXiv:2504.03957',
    date: 'April 2025',
    url: 'https://arxiv.org/html/2504.03957v2',
    summary:
      'Tightens the threat model to a single poisoned text per query while remaining stealthier and more robust against current defenses.',
    claimAsUsed:
      'One crafted document is enough — which is why any corpus with open or semi-open write access cannot be fully sanitised.',
    caveat:
      'Reported above 90% success across the evaluated datasets; effectiveness still depends on the retriever and corpus, and defenses are an active research area.',
  },

  mcptox: {
    id: 'mcptox',
    kind: 'paper',
    title: 'MCPTox: A Benchmark for Tool Poisoning Attack on Real-World MCP Servers',
    authors: 'Wang, Gao, Wang, Liu, Sun, Cheng, Shi, Du, Li',
    venue: 'arXiv:2508.14925',
    date: 'August 2025',
    url: 'https://arxiv.org/abs/2508.14925',
    summary:
      'Evaluated tool poisoning against 45 live, real-world MCP servers and 353 authentic tools. Attack success peaked at 72.8% with o1-mini.',
    claimAsUsed:
      'Tool metadata — not code — is an attack surface, and the attack works against real deployed servers.',
    caveat:
      'The headline finding is uncomfortable: more capable models were often MORE susceptible, because the attack exploits their superior instruction-following. Security posture can therefore degrade on a model upgrade.',
  },

  sleeperAgents: {
    id: 'sleeperAgents',
    kind: 'paper',
    title: 'Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training',
    authors: 'Hubinger et al. (Anthropic)',
    venue: 'arXiv:2401.05566',
    date: 'January 2024',
    url: 'https://arxiv.org/abs/2401.05566',
    summary:
      'Backdoored behaviour survived supervised fine-tuning, RLHF and adversarial safety training. Adversarial training sometimes taught models to recognise their trigger and hide the behaviour better.',
    claimAsUsed:
      'A backdoor in a third-party model or adapter cannot be ruled out by post-hoc safety training or behavioural testing.',
    caveat:
      'These backdoors were deliberately inserted by the researchers; the paper shows persistence, not that deployed models are backdoored. Detection via activation probes showed promise but is not a deployed, general defense.',
  },

  adaptiveAttacks: {
    id: 'adaptiveAttacks',
    kind: 'paper',
    title: 'Jailbreaking Leading Safety-Aligned LLMs with Simple Adaptive Attacks',
    authors: 'Andriushchenko, Croce, Flammarion',
    venue: 'arXiv:2404.02151',
    date: 'April 2024',
    url: 'https://arxiv.org/html/2404.02151v4',
    summary:
      'Adaptive attacks combining prompt templates with random search over suffixes achieved a 100% attack success rate (GPT-4 as judge) against GPT-3.5/4o, all Claude models, Llama-2/3, Mistral and Gemma.',
    claimAsUsed:
      'Model-level refusal cannot be a load-bearing control: if an output would be catastrophic, the model must not be architecturally able to produce it.',
    caveat:
      'Success required per-model adaptation (prefilling, transfer, template choice) and judge-based scoring; it is a statement about adaptive adversaries, not about a single universal prompt.',
  },

  universalSuffixes: {
    id: 'universalSuffixes',
    kind: 'paper',
    title: 'Universal Jailbreak Suffixes Are Strong Attention Hijackers',
    authors: 'Ben-Tov, Geva, Sharif',
    venue: 'TACL 2026 (arXiv:2506.12880)',
    date: 'June 2025',
    url: 'https://arxiv.org/abs/2506.12880',
    summary:
      'Mechanistic account of why optimised suffixes work: they hijack the contextualisation process, and the most universal suffixes are the strongest hijackers.',
    claimAsUsed:
      'The token highlighting in the suffix lab depicts this hijacking mechanism.',
    caveat:
      'The lab shows an illustration of the mechanism, not live model internals. The paper\'s own mitigation at least halves attack success — a reduction, not a solution — and the same insight also helps attackers build stronger suffixes.',
  },

  promptOverflow: {
    id: 'promptOverflow',
    kind: 'paper',
    title: 'Prompt Overflow: What the Guardrail Inspects Is Not What the Model Infers',
    authors: 'Zhou, Zhu, Wang, He, Zhai, Sun, Wei, Xiong',
    venue: 'arXiv:2605.23196',
    date: 'May 2026',
    url: 'https://arxiv.org/html/2605.23196v1',
    summary:
      'Guardrails that inspect segments independently and aggregate by threshold are structurally beatable: intent split across inspection windows leaves no single segment looking malicious, yet the model reassembles it from the full context.',
    claimAsUsed:
      'The guardrail in the gauntlet is beatable by design, not because it is badly tuned — the weakness is architectural.',
    caveat:
      'This describes segment-scoring, threshold-aggregating designs. It is a structural critique of that architecture rather than a claim that every conceivable filter is defeated the same way.',
  },

  injecguard: {
    id: 'injecguard',
    kind: 'paper',
    title: 'InjecGuard: Benchmarking and Mitigating Over-defense in Prompt Injection Guardrails',
    authors: 'Li, Liu',
    venue: 'arXiv:2410.22770',
    date: 'October 2024',
    url: 'https://arxiv.org/abs/2410.22770',
    summary:
      'State-of-the-art prompt-guard models flag benign inputs because of trigger-word bias, with accuracy falling toward random guessing (~60%) on over-defense benchmarks.',
    claimAsUsed:
      'Tightening a guardrail to reduce false negatives directly worsens false positives — you cannot simply turn the dial up.',
    caveat:
      'The ~60% figure is on a benchmark specifically constructed to expose over-defense, not general accuracy on ordinary traffic.',
  },

  owasp2025: {
    id: 'owasp2025',
    kind: 'framework',
    title: 'OWASP Top 10 for LLM Applications 2025',
    authors: 'OWASP GenAI Security Project',
    venue: 'OWASP',
    date: '2025',
    url: 'https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/',
    summary:
      'The application-layer vulnerability taxonomy for LLM systems. The 2025 edition adds System Prompt Leakage and Vector & Embedding Weaknesses and expands Excessive Agency.',
    claimAsUsed: 'The map learners use to locate any concrete vulnerability they meet.',
    caveat:
      'A taxonomy of known risk categories, not a completeness guarantee or a maturity model — it names risks, it does not rank them for your deployment.',
  },

  mitreAtlas: {
    id: 'mitreAtlas',
    kind: 'framework',
    title: 'MITRE ATLAS',
    authors: 'MITRE',
    venue: 'MITRE ATLAS knowledge base',
    date: 'current',
    url: 'https://atlas.mitre.org/',
    summary:
      'An adversary tactics-and-techniques knowledge base for AI systems, with real-world case studies — the red-team and threat-modelling vocabulary.',
    claimAsUsed:
      'The technique labels attached to each consequence in the enterprise decision workshop.',
    caveat:
      'ATLAS catalogues how attacks work; it does not tell you which are likely against your particular system.',
  },

  nistAiRmf: {
    id: 'nistAiRmf',
    kind: 'framework',
    title: 'NIST AI Risk Management Framework',
    authors: 'NIST',
    venue: 'NIST',
    date: '2023 onward',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
    summary:
      'An organisational governance process (Map, Measure, Manage, Govern) — the scaffolding for an enterprise AI security programme.',
    claimAsUsed: 'The governance layer sitting above the technical controls in the defense stack.',
    caveat:
      'A process framework, not a control catalogue: following it does not by itself make a system secure.',
  },
}

export const REFERENCE_IDS = Object.keys(REFERENCES)

export function getReference(id: string): Reference | undefined {
  return REFERENCES[id]
}
