/**
 * The replay engine.
 *
 * Re-runs the learner's OWN Module 2 exploit against the defense configuration
 * they have just chosen. A sufficient configuration blocks it; a configuration
 * that is too weak lets the attack through in simulation — deliberately not an
 * error, because seeing the breach is the lesson.
 */
import { processContent, cutLeg, ALL_LEGS, WORKED_PAYLOAD } from '../m2/engine'
import { patternById, type LayerId, type PatternId } from './patterns'

export interface DefenseConfig {
  pattern: PatternId | null
  layers: readonly LayerId[]
}

export interface ReplayResult {
  exploitBlocked: boolean
  /** Honest explanation of why it held or did not. */
  reason: string
  /** The simulation trace from the underlying attack run. */
  trace: string
}

export function replay(config: DefenseConfig, payload = WORKED_PAYLOAD): ReplayResult {
  const patternStops = config.pattern ? patternById(config.pattern).stopsExfiltration : false
  const egressCut = config.layers.includes('egress-allowlist')

  // An egress allowlist removes the outbound leg outright; a sufficient pattern
  // means the untrusted content never reaches a privileged action.
  const legs = egressCut
    ? cutLeg(ALL_LEGS, 'externalComms')
    : patternStops
      ? cutLeg(ALL_LEGS, 'untrustedContent')
      : ALL_LEGS

  const result = processContent(payload, { legs })

  if (!result.exfiltrated) {
    return {
      exploitBlocked: true,
      reason: egressCut
        ? 'The egress allowlist removed the outbound channel, so the data had nowhere to go.'
        : `${patternById(config.pattern!).name} kept the attacker text away from any privileged action.`,
      trace: result.trace,
    }
  }

  return {
    exploitBlocked: false,
    reason: config.pattern
      ? `${patternById(config.pattern).name} constrains the agent, but not enough for this attack: ${patternById(config.pattern).rationale}`
      : 'With no pattern and no egress control, the assistant is exactly as exploitable as it was in Module 2.',
    trace: result.trace,
  }
}
