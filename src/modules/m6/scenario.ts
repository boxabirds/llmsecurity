/**
 * Module 6 — the enterprise decision workshop.
 *
 * A branching case with no single right answer. Each decision narrows the risk
 * surface, and the consequences are narrated honestly: the configuration that
 * can do the most is usually the one that cannot be secured. That is the
 * course's thesis, arrived at by the learner's own choices rather than asserted.
 */

export type DecisionId = 'modelSource' | 'dataScope' | 'toolPerms' | 'egress' | 'guardrail'

export const DECISION_ORDER: readonly DecisionId[] = [
  'modelSource',
  'dataScope',
  'toolPerms',
  'egress',
  'guardrail',
] as const

export interface Option {
  id: string
  label: string
  detail: string
  /** Effect on the three legs. Undefined means this decision does not touch it. */
  privateData?: boolean
  untrustedContent?: boolean
  externalComms?: boolean
  /** The MITRE ATLAS technique this choice bears on, named rather than numbered. */
  atlasTechnique: string
  /** What follows from this choice, stated plainly. */
  consequence: string
  /** Roughly how much capability this configuration retains, 0-100. */
  capability: number
}

export interface Decision {
  id: DecisionId
  question: string
  options: readonly Option[]
}

export const DECISIONS: readonly Decision[] = [
  {
    id: 'modelSource',
    question: 'Where does the model come from?',
    options: [
      {
        id: 'vendor-api',
        label: 'A vendor API',
        detail: 'A hosted frontier model under contract.',
        atlasTechnique: 'ML Supply Chain Compromise',
        consequence:
          'You inherit the vendor’s supply chain and cannot inspect the weights, but you also inherit their patching. Backdoor risk is unverifiable either way.',
        capability: 90,
      },
      {
        id: 'open-weights',
        label: 'Open weights, self-hosted',
        detail: 'Downloaded from a public hub and fine-tuned in house.',
        atlasTechnique: 'ML Supply Chain Compromise',
        consequence:
          'Data stays on your infrastructure, but a weight-level backdoor cannot be ruled out by any behavioural test you can run.',
        capability: 80,
      },
    ],
  },
  {
    id: 'dataScope',
    question: 'What can the assistant read?',
    options: [
      {
        id: 'full-inbox',
        label: 'The whole mailbox and drive',
        detail: 'Everything the employee can see.',
        privateData: true,
        untrustedContent: true,
        atlasTechnique: 'LLM Data Leakage',
        consequence:
          'Maximum usefulness — and the assistant now holds private data while reading content strangers can write. Two legs, in one decision.',
        capability: 100,
      },
      {
        id: 'curated-corpus',
        label: 'A curated internal corpus only',
        detail: 'Approved documents, no inbound mail.',
        privateData: true,
        untrustedContent: false,
        atlasTechnique: 'LLM Data Leakage',
        consequence:
          'The assistant still holds private data, but nothing a stranger authored reaches its context. The untrusted-content leg is cut.',
        capability: 55,
      },
    ],
  },
  {
    id: 'toolPerms',
    question: 'What can it do on the employee’s behalf?',
    options: [
      {
        id: 'send-and-act',
        label: 'Send mail and call APIs',
        detail: 'Acts with the employee’s standing credentials.',
        externalComms: true,
        atlasTechnique: 'LLM Plugin Compromise',
        consequence:
          'A hijacked assistant can act with the user’s authority, and every action looks legitimate to your monitoring.',
        capability: 100,
      },
      {
        id: 'draft-only',
        label: 'Draft only, a human sends',
        detail: 'It proposes; a person approves.',
        externalComms: false,
        atlasTechnique: 'LLM Plugin Compromise',
        consequence:
          'Slower, and a person now stands between the model and the world. Irreversible actions get a check that cannot be prompt-injected.',
        capability: 65,
      },
    ],
  },
  {
    id: 'egress',
    question: 'Where may it send data?',
    options: [
      {
        id: 'open-egress',
        label: 'Anywhere it needs to',
        detail: 'No outbound restrictions.',
        externalComms: true,
        atlasTechnique: 'Exfiltration via LLM',
        consequence:
          'Rendered links, image URLs and permitted API calls are all exfiltration channels. There is no signature to detect.',
        capability: 100,
      },
      {
        id: 'allowlist',
        label: 'An allowlist of internal hosts',
        detail: 'Outbound requests are restricted by policy.',
        externalComms: false,
        atlasTechnique: 'Exfiltration via LLM',
        consequence:
          'The third leg is cut deterministically. A hijack can still occur, but the data has nowhere to go.',
        capability: 75,
      },
    ],
  },
  {
    id: 'guardrail',
    question: 'What screening do you run?',
    options: [
      {
        id: 'guardrail-only',
        label: 'A prompt-injection classifier',
        detail: 'Screen inputs and retrieved content.',
        atlasTechnique: 'LLM Prompt Injection',
        consequence:
          'Useful friction that raises attacker cost. It is not a boundary: an adaptive attacker with unlimited attempts gets through eventually.',
        capability: 95,
      },
      {
        id: 'guardrail-plus-logging',
        label: 'Classifier plus full audit logging',
        detail: 'Screening, with every prompt and tool call recorded.',
        atlasTechnique: 'LLM Prompt Injection',
        consequence:
          'Same probabilistic limits, but you can now reconstruct an incident afterwards — detection and response rather than prevention.',
        capability: 95,
      },
    ],
  },
]

const DECISION_BY_ID = new Map(DECISIONS.map((d) => [d.id, d]))

export function decisionById(id: DecisionId): Decision {
  const decision = DECISION_BY_ID.get(id)
  if (!decision) throw new Error(`Unknown decision: ${id}`)
  return decision
}

export type Selections = Partial<Record<DecisionId, string>>

export function optionFor(id: DecisionId, optionId: string | undefined): Option | undefined {
  if (!optionId) return undefined
  return decisionById(id).options.find((o) => o.id === optionId)
}

export interface Assessment {
  /** True when all three legs are present at once. */
  trifectaComplete: boolean
  /** True when the chosen configuration runs the EchoLeak-shaped incident. */
  incident: boolean
  legs: { privateData: boolean; untrustedContent: boolean; externalComms: boolean }
  /** Roughly how capable the resulting assistant is, 0-100. */
  capability: number
  /** The single highest-leverage change available from here. */
  topMitigation: string
  atlasTechniques: string[]
}

export function assess(selections: Selections): Assessment {
  const chosen = DECISION_ORDER.map((id) => optionFor(id, selections[id])).filter(
    (o): o is Option => Boolean(o),
  )

  const legs = {
    privateData: chosen.some((o) => o.privateData === true),
    untrustedContent: chosen.some((o) => o.untrustedContent === true),
    // Any single choice that opens an outbound path is enough.
    externalComms: chosen.some((o) => o.externalComms === true),
  }

  const trifectaComplete = legs.privateData && legs.untrustedContent && legs.externalComms
  const capability =
    chosen.length === 0
      ? 0
      : Math.round(chosen.reduce((total, o) => total + o.capability, 0) / chosen.length)

  const topMitigation = trifectaComplete
    ? 'Cut a leg deterministically. Note that the outbound leg has more than one door: restricting network egress does nothing while the assistant can still send mail on the user’s behalf. Close every outbound path, or cut a different leg instead.'
    : legs.privateData && legs.untrustedContent
      ? 'Keep every outbound path closed: that is the only reason this configuration is not exploitable.'
      : 'Keep untrusted content out of the context window; that is what is protecting you here.'

  return {
    trifectaComplete,
    incident: trifectaComplete,
    legs,
    capability,
    topMitigation,
    atlasTechniques: [...new Set(chosen.map((o) => o.atlasTechnique))],
  }
}

/** Recompute with exactly one decision changed — the "what if" replay. */
export function replaceChoice(
  selections: Selections,
  id: DecisionId,
  optionId: string,
): Selections {
  return { ...selections, [id]: optionId }
}
