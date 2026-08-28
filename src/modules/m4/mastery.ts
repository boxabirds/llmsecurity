/**
 * Module 4 mastery gate.
 *
 * Two halves, both required: the learner's re-secured configuration must
 * actually make the exfiltration fail, AND their one-sentence justification
 * must explain why the defense is *deterministic* rather than merely likely to
 * catch it. The justification is rubric-graded on reasoning.
 */
import { gradeOrRetry, type Rubric } from '../../assessment/engine'
import { replay, type DefenseConfig } from './replay'

export const DETERMINISM_RUBRIC: Rubric = {
  keywords: ['structur', 'cannot', 'flow'],
  minScore: 2 / 3,
}

export interface M4Mastery {
  config: DefenseConfig
  justification: string
}

export interface MasteryOutcome {
  passed: boolean
  reason: string
}

export function evaluateMastery({ config, justification }: M4Mastery): MasteryOutcome {
  const result = replay(config)

  if (!result.exploitBlocked) {
    return {
      passed: false,
      reason: `Your own exploit still succeeds against this configuration. ${result.reason}`,
    }
  }

  const graded = gradeOrRetry(justification, DETERMINISM_RUBRIC)

  if (graded.status === 'retry') {
    return { passed: false, reason: graded.guidance ?? 'Write a sentence explaining why.' }
  }

  if (!graded.passed) {
    return {
      passed: false,
      reason:
        'Say why the defense is deterministic: what the attacker structurally cannot do, and which flow is cut — not just that it is safer.',
    }
  }

  return {
    passed: true,
    reason: `Correct — and the exploit now fails. ${result.reason}`,
  }
}
