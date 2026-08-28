/**
 * The guardrail gauntlet.
 *
 * The learner attacks a probabilistic guardrail with unlimited attempts. The
 * cumulative-success curve is the argument: a filter facing an adaptive
 * adversary is a rate-limiter on attacker success, not a boundary.
 */
import { scoreGuardrail } from '../../sim/kernel'

/** A guardrail advertised as highly accurate — the kind vendors quote. */
export const GUARDRAIL_ACCURACY = 0.95

export interface GauntletState {
  prediction: number | null
  attempts: number
  successes: number
  /** Cumulative successes after each attempt, for the chart. */
  history: number[]
}

export function initialGauntlet(): GauntletState {
  return { prediction: null, attempts: 0, successes: 0, history: [] }
}

export function withPrediction(state: GauntletState, prediction: number): GauntletState {
  return { ...state, prediction }
}

export interface AttemptOutcome {
  state: GauntletState
  blocked: boolean
  reason: string
}

/**
 * Runs one attempt. A plain payload is usually caught; a payload fragmented
 * across inspection windows is not caught at all, because no single window
 * carries enough signal for threshold aggregation to amplify.
 */
export function attempt(
  state: GauntletState,
  payload: string,
  roll: () => number = Math.random,
): AttemptOutcome {
  const verdict = scoreGuardrail(payload, { accuracy: GUARDRAIL_ACCURACY, windowWords: 6 }, roll)
  const successes = state.successes + (verdict.blocked ? 0 : 1)

  return {
    state: {
      ...state,
      attempts: state.attempts + 1,
      successes,
      history: [...state.history, successes],
    },
    blocked: verdict.blocked,
    reason: verdict.reason,
  }
}

/** Cumulative attacker success as a percentage of attempts. */
export function successRate(state: GauntletState): number {
  if (state.attempts === 0) return 0
  return Math.round((state.successes / state.attempts) * 100)
}

/**
 * Probability that at least one of n attempts gets through a filter of this
 * accuracy — the number learners consistently underestimate.
 */
export function chanceOfAnySuccess(attempts: number, accuracy = GUARDRAIL_ACCURACY): number {
  return Math.round((1 - accuracy ** attempts) * 100)
}
