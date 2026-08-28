/**
 * The OWASP Top 10 for LLM Applications 2025 — the map the learner gets before
 * the territory.
 *
 * This is Module 1's whole substance, so it is data rather than markup: the
 * living map, the tagging assessment and every later module's "where does this
 * sit?" callback all read the same ten entries.
 *
 * Two rules govern the `incident` field. It must describe something documented,
 * and where the tutorial cannot point at a verified primary source it describes
 * the CLASS of incident generically rather than naming an event. Every specific
 * figure here traces to an entry in the reference registry.
 */

/** The stable external key: OWASP's own numbering. Progress and test hooks use it. */
export type RiskCode =
  | 'LLM01'
  | 'LLM02'
  | 'LLM03'
  | 'LLM04'
  | 'LLM05'
  | 'LLM06'
  | 'LLM07'
  | 'LLM08'
  | 'LLM09'
  | 'LLM10'

/** Coarse family, used to interleave the assessment so adjacent items differ. */
export type RiskCategory =
  | 'injection'
  | 'disclosure'
  | 'supply-chain'
  | 'integrity'
  | 'output'
  | 'agency'
  | 'retrieval'
  | 'availability'

/** Governance/taxonomy the card's chip opens. All three are registry ids. */
export type FrameworkRef = 'owasp2025' | 'mitreAtlas' | 'nistAiRmf'

export interface Risk {
  /** Slug, used for DOM ids and React keys. */
  id: string
  code: RiskCode
  title: string
  /** One plain-language line. Raised on focus or hover. */
  gloss: string
  /**
   * A documented example, or a described class where no single verified source
   * exists. Optional: a card whose incident is missing degrades to a
   * placeholder rather than failing.
   */
  incident?: string
  frameworkRef: FrameworkRef
  /** Optional deeper source, on top of the framework chip. */
  referenceId?: string
  isNew2025: boolean
  category: RiskCategory
}

export const OWASP_RISKS: readonly Risk[] = [
  {
    id: 'prompt-injection',
    code: 'LLM01',
    title: 'Prompt Injection',
    gloss: 'Text the model reads becomes instructions it follows.',
    incident:
      'EchoLeak (CVE-2025-32711, June 2025): a crafted email made Microsoft 365 Copilot act on hidden instructions and send private data to an attacker-controlled server, with no click from the victim. Microsoft patched it server-side; it had already passed the deployed classifier, link redaction and CSP.',
    frameworkRef: 'owasp2025',
    referenceId: 'echoleak',
    isNew2025: false,
    category: 'injection',
  },
  {
    id: 'sensitive-information-disclosure',
    code: 'LLM02',
    title: 'Sensitive Information Disclosure',
    gloss: 'Private data that reached the context window leaves in an answer.',
    incident:
      'The end of the EchoLeak chain was a disclosure: chat history, OneDrive and SharePoint files and Teams messages left the tenant. Disclosure is usually the consequence of some other failure rather than a bug of its own, which is exactly why it is the most mis-tagged entry on this map.',
    frameworkRef: 'owasp2025',
    referenceId: 'echoleak',
    isNew2025: false,
    category: 'disclosure',
  },
  {
    id: 'supply-chain',
    code: 'LLM03',
    title: 'Supply Chain',
    gloss: 'Something you did not write ships inside your system.',
    incident:
      'MCPTox (August 2025) evaluated tool poisoning against 45 live MCP servers and 353 real tools: the hostile instructions arrive in tool metadata, not code, so nothing in a dependency scan changes. Attack success peaked at 72.8%, and more capable models were often more susceptible.',
    frameworkRef: 'owasp2025',
    referenceId: 'mcptox',
    isNew2025: false,
    category: 'supply-chain',
  },
  {
    id: 'data-and-model-poisoning',
    code: 'LLM04',
    title: 'Data and Model Poisoning',
    gloss: 'Corrupted training or reference data bends what the model will say.',
    incident:
      'Corpus poisoning against RAG: PoisonedRAG (USENIX Security 2025) showed five crafted passages per targeted question were enough to control the answer returned from a corpus of millions, and CorruptRAG (2025) tightened that to a single document. Any corpus with open or semi-open write access is therefore an input to your model, not just a library.',
    frameworkRef: 'owasp2025',
    referenceId: 'poisonedRag',
    isNew2025: false,
    category: 'integrity',
  },
  {
    id: 'improper-output-handling',
    code: 'LLM05',
    title: 'Improper Output Handling',
    gloss: 'Whatever consumes the model output trusts it.',
    incident:
      'The recurring class: generated text is passed unescaped into a browser, a shell, a SQL string or a downstream API, so ordinary web vulnerabilities — XSS, SSRF, command and SQL injection — reappear with the model as the injection point.',
    frameworkRef: 'owasp2025',
    isNew2025: false,
    category: 'output',
  },
  {
    id: 'excessive-agency',
    code: 'LLM06',
    title: 'Excessive Agency',
    gloss: 'The agent can do more than the task ever needed.',
    incident:
      'Tool poisoning is also an agency failure: the poisoned description drives a call the agent was already permitted to make (MCPTox, 2025). Nothing was breached and no permission was escalated — the agent used its own legitimate authority on someone else’s instruction.',
    frameworkRef: 'mitreAtlas',
    referenceId: 'mcptox',
    isNew2025: false,
    category: 'agency',
  },
  {
    id: 'system-prompt-leakage',
    code: 'LLM07',
    title: 'System Prompt Leakage',
    gloss: 'The instructions you assumed were private are readable.',
    incident:
      'Extracted system prompts for public assistants have been published repeatedly since 2023. The leak is rarely the damage in itself; the damage is what it reveals — tool names, internal thresholds and the exact wording of the rules the next attack is aimed at. Treating the system prompt as a secret is the underlying mistake.',
    frameworkRef: 'owasp2025',
    isNew2025: true,
    category: 'disclosure',
  },
  {
    id: 'vector-and-embedding-weaknesses',
    code: 'LLM08',
    title: 'Vector and Embedding Weaknesses',
    gloss: 'The retrieval layer — corpus, embeddings, index — is an attack surface.',
    incident:
      'Two recurring classes. A retrieval corpus with open or semi-open write access, where one crafted document is enough to steer answers (CorruptRAG, 2025); and a shared vector store without per-tenant filtering, where one tenant’s chunks are retrieved into another tenant’s answer.',
    frameworkRef: 'owasp2025',
    referenceId: 'corruptRag',
    isNew2025: true,
    category: 'retrieval',
  },
  {
    id: 'misinformation',
    code: 'LLM09',
    title: 'Misinformation',
    gloss: 'Confident output that is simply wrong, and acted on as if true.',
    incident:
      'Documented repeatedly in court filings: lawyers in several jurisdictions have been sanctioned for submitting briefs containing case citations a chatbot fabricated. The failure was not that the model was confident — it was that the output was load-bearing and nobody checked it before acting.',
    frameworkRef: 'nistAiRmf',
    isNew2025: false,
    category: 'integrity',
  },
  {
    id: 'unbounded-consumption',
    code: 'LLM10',
    title: 'Unbounded Consumption',
    gloss: 'Nothing bounds how much work one request can cost you.',
    incident:
      'The generic class: an endpoint with no per-caller ceiling absorbs arbitrarily expensive generation (“denial of wallet”), or sustained high-volume querying is used to extract a model’s behaviour. The cost lands on your invoice and the queueing lands on your other users.',
    frameworkRef: 'nistAiRmf',
    isNew2025: false,
    category: 'availability',
  },
] as const

/** Map lookup — the map is read on every card render and every tag. */
const BY_CODE = new Map<RiskCode, Risk>(OWASP_RISKS.map((risk) => [risk.code, risk]))

export function riskByCode(code: RiskCode): Risk | undefined {
  return BY_CODE.get(code)
}

export const RISK_CODES: readonly RiskCode[] = OWASP_RISKS.map((risk) => risk.code)

/** Short label for chips and options: "LLM01 Prompt Injection". */
export function riskLabel(risk: Risk): string {
  return `${risk.code} ${risk.title}`
}
