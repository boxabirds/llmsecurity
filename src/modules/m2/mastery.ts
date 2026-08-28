/**
 * Module 2 mastery gate.
 *
 * Passing requires both halves: the learner must reproduce the exfiltration on
 * the transfer surface (proving understanding rather than mimicry) AND name a
 * leg that genuinely stops this attack. The named leg is not checked against a
 * hardcoded answer — it is re-run through the simulation, so the learner's
 * claim has to actually hold.
 */
import { processContent, cutLeg, ALL_LEGS, WORKED_PAYLOAD } from './engine'
import type { LegName } from './engine'

export interface M2Mastery {
  transferExfiltrated: boolean
  namedLeg: LegName | null
  /** The payload the learner used, so the claim is checked against their own attack. */
  payload?: string
}

export interface MasteryOutcome {
  passed: boolean
  reason: string
}

export function evaluateMastery(mastery: M2Mastery): MasteryOutcome {
  if (!mastery.transferExfiltrated) {
    return {
      passed: false,
      reason:
        'Reproduce the exfiltration on the calendar invite first — transferring the attack to a new surface is what proves you understand it.',
    }
  }

  if (!mastery.namedLeg) {
    return { passed: false, reason: 'Name the leg you would cut to stop this exact attack.' }
  }

  // Verify the learner's claim by re-running their own attack with that leg cut.
  const result = processContent(mastery.payload ?? WORKED_PAYLOAD, {
    legs: cutLeg(ALL_LEGS, mastery.namedLeg),
  })

  if (result.exfiltrated) {
    return {
      passed: false,
      reason: 'Cutting that leg does not stop the attack — try it in the simulation and see.',
    }
  }

  return {
    passed: true,
    reason: `Correct: with that capability removed the attack cannot complete. ${result.trace}`,
  }
}
