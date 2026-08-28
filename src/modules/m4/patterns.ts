/**
 * Module 4 — the defenses that hold.
 *
 * The six design patterns from arXiv:2506.08837, each modelled with the
 * trade-off it actually makes. The point of this module is that these are
 * *deliberate capability limits*, not cures: the paper is explicit that "it is
 * unlikely that general-purpose agents can provide meaningful and reliable
 * safety guarantees".
 */

export type PatternId =
  | 'action-selector'
  | 'plan-then-execute'
  | 'llm-map-reduce'
  | 'dual-llm'
  | 'code-then-execute'
  | 'context-minimization'

export interface DefensePattern {
  id: PatternId
  name: string
  summary: string
  /** How much of the original task the agent can still do, 0-100. */
  residualCapability: number
  /** How much exposure remains, 0-100. */
  residualRisk: number
  /**
   * Whether this pattern alone stops the exfiltration attack from Module 2.
   * Some patterns constrain control flow but still permit the tainted value to
   * reach a permitted sink — an honest distinction the learner needs.
   */
  stopsExfiltration: boolean
  /** Why it does or does not stop it. */
  rationale: string
}

export const PATTERNS: readonly DefensePattern[] = [
  {
    id: 'dual-llm',
    name: 'Dual LLM',
    summary:
      'A privileged coordinator never sees untrusted content; a quarantined model reads it but can take no privileged action.',
    residualCapability: 70,
    residualRisk: 15,
    stopsExfiltration: true,
    rationale:
      'The model that read the attacker text has no ability to call the sending tool, so the instruction cannot become an action.',
  },
  {
    id: 'action-selector',
    name: 'Action-Selector',
    summary: 'The agent may only pick from a fixed list of actions; tool output never feeds back in.',
    residualCapability: 30,
    residualRisk: 10,
    stopsExfiltration: true,
    rationale:
      'Untrusted output never re-enters the loop, so it cannot influence a later action. Very safe, and very limited.',
  },
  {
    id: 'code-then-execute',
    name: 'Code-Then-Execute',
    summary:
      'The agent writes a program up front that calls tools and spawns unprivileged sub-models.',
    residualCapability: 75,
    residualRisk: 20,
    stopsExfiltration: true,
    rationale:
      'Control flow is fixed before any untrusted data is read, and the untrusted parts run without privilege.',
  },
  {
    id: 'context-minimization',
    name: 'Context-Minimization',
    summary: 'Untrusted content is removed from the context once it has served its purpose.',
    residualCapability: 45,
    residualRisk: 25,
    stopsExfiltration: true,
    rationale:
      'The attacker text is no longer present when the tool call is made, so there is no instruction left to follow.',
  },
  {
    id: 'plan-then-execute',
    name: 'Plan-Then-Execute',
    summary: 'The agent fixes its plan before reading untrusted content, then carries it out.',
    residualCapability: 55,
    residualRisk: 35,
    stopsExfiltration: false,
    rationale:
      'The plan cannot be rewritten — but if the plan already includes a send step, tainted data can still ride it out. Control-flow integrity is not the same as no data leaking.',
  },
  {
    id: 'llm-map-reduce',
    name: 'LLM Map-Reduce',
    summary: 'Isolated sub-agents each process one piece of untrusted data; results are combined.',
    residualCapability: 50,
    residualRisk: 30,
    stopsExfiltration: false,
    rationale:
      'Isolation limits blast radius per document, but the reducer still sees attacker-influenced output and can act on it.',
  },
]

/** Shown first; the rest sit behind a disclosure so six choices do not land at once. */
export const RECOMMENDED_PATTERN: PatternId = 'dual-llm'

const BY_ID = new Map(PATTERNS.map((p) => [p.id, p]))

export function patternById(id: PatternId): DefensePattern {
  const pattern = BY_ID.get(id)
  if (!pattern) throw new Error(`Unknown pattern: ${id}`)
  return pattern
}

// ---------------------------------------------------------------------------
// Defense-in-depth layers
// ---------------------------------------------------------------------------

export type LayerId =
  | 'egress-allowlist'
  | 'provenance-tagging'
  | 'human-approval'
  | 'guardrail-classifier'
  | 'least-privilege-credentials'

export interface DefenseLayer {
  id: LayerId
  name: string
  /** Points removed from the risk score. */
  riskReduction: number
  /** True only for controls that structurally prevent rather than detect. */
  deterministic: boolean
  /** Which earlier attack this layer would have stopped. */
  stopsAttack: string
}

export const LAYERS: readonly DefenseLayer[] = [
  {
    id: 'egress-allowlist',
    name: 'Egress allowlist',
    riskReduction: 35,
    deterministic: true,
    stopsAttack: 'Module 2: the exfiltration link had nowhere to go.',
  },
  {
    id: 'provenance-tagging',
    name: 'Provenance tagging of context',
    riskReduction: 20,
    deterministic: true,
    stopsAttack: 'Module 3: retrieved passages are marked untrusted before they reach the answer.',
  },
  {
    id: 'least-privilege-credentials',
    name: 'Per-task least-privilege credentials',
    riskReduction: 15,
    deterministic: true,
    stopsAttack: 'Module 3: a poisoned tool could not reach data outside its task scope.',
  },
  {
    id: 'human-approval',
    name: 'Human approval for irreversible actions',
    riskReduction: 15,
    deterministic: false,
    stopsAttack: 'Module 2: the send would have paused for a person who could refuse it.',
  },
  {
    id: 'guardrail-classifier',
    name: 'Guardrail classifier',
    riskReduction: 10,
    deterministic: false,
    stopsAttack: 'Raises attacker cost only — Module 5 shows why this is not a boundary.',
  },
]

const LAYERS_BY_ID = new Map(LAYERS.map((l) => [l.id, l]))

export function layerById(id: LayerId): DefenseLayer {
  const layer = LAYERS_BY_ID.get(id)
  if (!layer) throw new Error(`Unknown layer: ${id}`)
  return layer
}

export const BASELINE_RISK = 100

/** Live risk score for a stack of layers, floored at a residual that is never zero. */
export function riskScore(layers: readonly LayerId[]): number {
  const reduction = layers.reduce((total, id) => total + layerById(id).riskReduction, 0)
  // Residual risk never reaches zero: some of this problem is unsolved.
  return Math.max(BASELINE_RISK - reduction, 10)
}
