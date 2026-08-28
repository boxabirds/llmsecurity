/**
 * Module 3 mastery gate.
 *
 * The check is transfer, not recall: the learner is given a FOURTH scenario
 * they have not run and has to name both the mechanism it uses and the layer it
 * acts at. Naming the layer alone would let a lucky guess through, and naming
 * the mechanism alone would not show they had internalised the ledger — so both
 * halves must hold.
 */
import { gradeOrRetry, type Rubric } from '../../assessment/engine'
import { LAYER_LABELS, type LabId, type Layer } from './labs'

/** The mechanism vocabulary is the three labs; the scenario is not. */
export type Mechanism = LabId

export interface NovelScenario {
  id: string
  title: string
  brief: string
  mechanism: Mechanism
  layer: Layer
}

/**
 * Novel by construction: an internal wiki and a customer-facing agent, neither
 * of which appears in any of the three labs. The tells are all in the brief —
 * nothing was deployed, nothing was reconfigured, only content changed.
 */
export const NOVEL_SCENARIO: NovelScenario = {
  id: 'wiki-refunds',
  title: 'The support agent that started promising refunds',
  brief:
    'Your support agent answers customer questions from the company wiki. Someone with ordinary edit rights adds a page titled “Refund policy — 2026 update”. From that afternoon the agent tells customers that any purchase can be refunded at any time. The model is the same version as yesterday, the system prompt is unchanged, no tool was added or altered, and nobody sent the agent a message.',
  mechanism: 'rag',
  layer: 'retrieval-corpus',
}

export const MECHANISM_LABELS: Record<Mechanism, string> = {
  suffix: 'An adversarial suffix appended to the prompt',
  rag: 'A poisoned passage that the agent retrieved',
  mcp: 'An instruction written into a tool description',
}

/**
 * Picking from three mechanisms and three layers is recognition with a narrow
 * set — a lucky pair would pass. Because this is a load-bearing check, the
 * learner must also say IN THEIR OWN WORDS what changed, which is what makes it
 * genuine generation rather than a nine-way guess.
 */
export const EXPLANATION_RUBRIC: Rubric = {
  keywords: ['retriev', 'content', 'model', 'tool'],
  minScore: 0.5,
}

export interface M3Mastery {
  mechanism: Mechanism | null
  layer: Layer | null
  /** Why: what actually changed in this system. */
  explanation?: string
}

export interface MasteryOutcome {
  passed: boolean
  mechanismCorrect: boolean
  layerCorrect: boolean
  reason: string
}

export function evaluateMastery(mastery: M3Mastery): MasteryOutcome {
  const mechanismCorrect = mastery.mechanism === NOVEL_SCENARIO.mechanism
  const layerCorrect = mastery.layer === NOVEL_SCENARIO.layer

  if (!mastery.mechanism || !mastery.layer) {
    return {
      passed: false,
      mechanismCorrect,
      layerCorrect,
      reason: 'Name both the mechanism and the layer it acted at — the pair is the answer.',
    }
  }

  if (mechanismCorrect && layerCorrect) {
    // Both choices right — now the learner has to show it was not a guess.
    const graded = gradeOrRetry(mastery.explanation ?? '', EXPLANATION_RUBRIC)

    if (graded.status === 'retry') {
      return {
        passed: false,
        mechanismCorrect,
        layerCorrect,
        reason:
          'Your pair is right. Now say in your own words what actually changed in this system — a correct guess and understanding look identical until you explain it.',
      }
    }

    if (!graded.passed) {
      return {
        passed: false,
        mechanismCorrect,
        layerCorrect,
        reason:
          'Say what changed and what did not: the agent retrieved different content, while the model and the tools stayed exactly as they were.',
      }
    }

    return {
      passed: true,
      mechanismCorrect,
      layerCorrect,
      reason:
        'Correct on both counts, and your explanation holds. Nothing about the model or the tools changed; a page that the agent retrieves changed, so the attack acted at the retrieval corpus — the same root cause as the other two labs, one layer along.',
    }
  }

  if (!mechanismCorrect && !layerCorrect) {
    return {
      passed: false,
      mechanismCorrect,
      layerCorrect,
      reason:
        'Both halves are wrong. Re-read the tells: same model, same system prompt, same tools, no message sent to the agent. The only thing that changed was content the agent reads.',
    }
  }

  if (!mechanismCorrect) {
    return {
      passed: false,
      mechanismCorrect,
      layerCorrect,
      reason:
        'The layer is right but the mechanism is not. Nobody appended anything to the prompt and no tool definition changed — the agent pulled the new page in by itself.',
    }
  }

  return {
    passed: false,
    mechanismCorrect,
    layerCorrect,
    reason: `The mechanism is right but the layer is not. A retrieved passage does not act on ${LAYER_LABELS[
      mastery.layer
    ]}; it acts on what the agent reads before it answers.`,
  }
}
