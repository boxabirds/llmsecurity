/**
 * Module 5 — the indefensible frontier.
 *
 * The eight areas where, as of this writing, no known control is deterministic.
 * Every one traces to a single root cause, amplified by two force multipliers.
 * Collapsing eight frightening problems into one root is the schema the learner
 * takes away.
 */

export const ROOT_CAUSE =
  'A transformer has no privileged channel that marks some tokens as instructions and others as inert data.'

export type Multiplier = 'agents-with-tools' | 'adaptive-adversaries'

export const MULTIPLIERS: Record<Multiplier, string> = {
  'agents-with-tools': 'Agents with tools turn a bad output into a real-world action.',
  'adaptive-adversaries':
    'Adaptive adversaries with unlimited attempts defeat any probabilistic filter eventually.',
}

export interface IndefensibleArea {
  id: string
  title: string
  summary: string
  multiplier: Multiplier
  referenceId?: string
}

export const AREAS: readonly IndefensibleArea[] = [
  {
    id: 'general-purpose-injection',
    title: 'Prompt injection in full-capability systems',
    summary:
      'A general-purpose agent with unconstrained tool use over untrusted content cannot currently be secured. You can have full capability or a guarantee, not both.',
    multiplier: 'agents-with-tools',
    referenceId: 'designPatterns',
  },
  {
    id: 'assembled-trifecta',
    title: 'The assembled lethal trifecta',
    summary:
      'Hold private data, untrusted content and external communication at once and you are exploitable. The only defense is not assembling all three.',
    multiplier: 'agents-with-tools',
    referenceId: 'trifecta',
  },
  {
    id: 'adaptive-jailbreaks',
    title: 'Adaptive jailbreaks against the model itself',
    summary:
      'Safety alignment is defeated by adaptive attacks against every leading model tested, so model-level refusal cannot be a load-bearing control.',
    multiplier: 'adaptive-adversaries',
    referenceId: 'adaptiveAttacks',
  },
  {
    id: 'guardrails-as-boundary',
    title: 'Detection layers used as a security boundary',
    summary:
      'Segment-scoring, threshold-aggregating guardrails are structurally bypassable, and pushing false negatives down drives over-defense that breaks legitimate use.',
    multiplier: 'adaptive-adversaries',
    referenceId: 'promptOverflow',
  },
  {
    id: 'supply-chain-backdoors',
    title: 'Backdoored models in the supply chain',
    summary:
      'Backdoors survive standard safety training, and adversarial training can make them stealthier. No deployed method certifies a third-party model backdoor-free.',
    multiplier: 'agents-with-tools',
    referenceId: 'sleeperAgents',
  },
  {
    id: 'corpus-poisoning',
    title: 'Poisoning of open-contribution knowledge bases',
    summary:
      'A single crafted document can dominate answers for targeted queries, and poisoned passages are fluent text rather than detectable malware.',
    multiplier: 'adaptive-adversaries',
    referenceId: 'corruptRag',
  },
  {
    id: 'agent-ecosystem-trust',
    title: 'Agent-to-agent and ecosystem trust',
    summary:
      'Tool protocols have no native mechanism to verify server trustworthiness continuously, and multi-agent systems add emergent failure modes that are open research problems.',
    multiplier: 'agents-with-tools',
    referenceId: 'mcptox',
  },
  {
    id: 'covert-exfiltration',
    title: 'Covert exfiltration from within authorised flows',
    summary:
      'When exfiltration rides the agent’s own permitted tools there is no signature to detect; blocking known channels is whack-a-mole.',
    multiplier: 'agents-with-tools',
    referenceId: 'echoleak',
  },
]

export const AREAS_BY_ID = new Map(AREAS.map((a) => [a.id, a]))
