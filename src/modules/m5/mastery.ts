/**
 * Module 5 mastery gate — the highest Bloom rung in the course.
 *
 * The learner critiques a vendor claim. Passing requires naming the STRUCTURAL
 * flaw (the guardrail is bypassable by design; an adaptive adversary with
 * unlimited attempts wins eventually) rather than an incidental one ("their
 * model is not good enough", "they need more training data").
 */
import { gradeOrRetry, type Rubric } from '../../assessment/engine'

export const VENDOR_CLAIM =
  'Our guardrail stops all prompt injection. It is 99.9% accurate against every known attack.'

/**
 * Concepts a structural critique engages with. Matching is on stems so that
 * "structural", "structurally" and "structure" all count.
 */
export const CRITIQUE_RUBRIC: Rubric = {
  keywords: ['structur', 'attempt', 'probabilis'],
  minScore: 2 / 3,
}

export interface M5Mastery {
  critique: string
}

export interface MasteryOutcome {
  passed: boolean
  reason: string
  namesStructuralFlaw: boolean
}

export function evaluateCritique({ critique }: M5Mastery): MasteryOutcome {
  const graded = gradeOrRetry(critique, CRITIQUE_RUBRIC)

  if (graded.status === 'retry') {
    return {
      passed: false,
      namesStructuralFlaw: false,
      reason: graded.guidance ?? 'Write a sentence critiquing the claim.',
    }
  }

  if (!graded.passed) {
    return {
      passed: false,
      namesStructuralFlaw: false,
      reason:
        'You have found a problem, but not the structural one. The issue is not that this guardrail is imperfect — it is that a probabilistic filter facing an adversary with unlimited attempts loses eventually, however accurate it is.',
    }
  }

  return {
    passed: true,
    namesStructuralFlaw: true,
    reason:
      'That is the structural critique: accuracy is the wrong frame. A filter that can be retried is a rate-limiter on attacker success, not a boundary.',
  }
}
