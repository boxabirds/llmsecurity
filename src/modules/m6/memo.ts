/**
 * The risk memo — the artifact the learner takes away.
 *
 * It is the course's social payload: something you could put in front of a
 * security lead. The gate requires it to name the trifecta status, the single
 * highest-leverage mitigation, AND a residual risk that cannot be eliminated —
 * that last field is how the anti-overclaiming lesson is forced into the
 * capstone rather than merely hoped for.
 */
import { assess, optionFor, DECISION_ORDER, type Selections } from './scenario'

export interface RiskMemo {
  trifectaComplete: boolean
  topMitigation: string
  residualRisk: string
  /** Rendered decision list, for the exported document. */
  decisions: Array<{ question: string; answer: string; consequence: string }>
  capability: number
  atlasTechniques: string[]
}

export function generateMemo(selections: Selections, residualRisk = ''): RiskMemo {
  const assessment = assess(selections)

  const decisions = DECISION_ORDER.flatMap((id) => {
    const option = optionFor(id, selections[id])
    if (!option) return []
    return [
      {
        question: id,
        answer: option.label,
        consequence: option.consequence,
      },
    ]
  })

  return {
    trifectaComplete: assessment.trifectaComplete,
    topMitigation: assessment.topMitigation,
    residualRisk,
    decisions,
    capability: assessment.capability,
    atlasTechniques: assessment.atlasTechniques,
  }
}

export interface MemoOutcome {
  passed: boolean
  reason: string
  missing: string[]
}

const MIN_RESIDUAL_CHARS = 12

/**
 * A memo is only complete when it states what is still exposed. A memo that
 * claims a clean bill of health is the failure mode this whole course exists to
 * prevent.
 */
export function evaluateMemo(memo: RiskMemo): MemoOutcome {
  const missing: string[] = []

  if (memo.decisions.length < DECISION_ORDER.length) {
    missing.push('every decision answered')
  }
  if (!memo.topMitigation.trim()) {
    missing.push('the highest-leverage mitigation')
  }
  if (memo.residualRisk.trim().length < MIN_RESIDUAL_CHARS) {
    missing.push('a residual risk that cannot be eliminated')
  }

  if (missing.length > 0) {
    return {
      passed: false,
      missing,
      reason: `Your memo is not finished: it needs ${missing.join(', and ')}. A memo with no residual risk is the overclaiming this course is about.`,
    }
  }

  return {
    passed: true,
    missing: [],
    reason: memo.trifectaComplete
      ? 'Complete — and you named the trifecta honestly rather than reporting the configuration as safe.'
      : 'Complete, with a defensible configuration and an honest statement of what is still exposed.',
  }
}

/** Plain-text export the learner can paste into a ticket or a doc. */
export function memoToText(memo: RiskMemo): string {
  const lines = [
    'RISK MEMO — AI assistant over the company inbox',
    '',
    `Trifecta status: ${memo.trifectaComplete ? 'COMPLETE — exploitable as configured' : 'incomplete — at least one leg is cut'}`,
    `Retained capability: ~${memo.capability}%`,
    '',
    'Decisions:',
    ...memo.decisions.map((d) => `  - ${d.answer}: ${d.consequence}`),
    '',
    `Highest-leverage mitigation: ${memo.topMitigation}`,
    `Residual risk (cannot be eliminated): ${memo.residualRisk}`,
    '',
    `Relevant MITRE ATLAS techniques: ${memo.atlasTechniques.join(', ')}`,
  ]
  return lines.join('\n')
}
