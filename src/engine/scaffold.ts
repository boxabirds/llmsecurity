/**
 * Scaffold and cognitive-load engine.
 *
 * Support fades as competence grows: Watch (worked example) -> Complete (fill
 * the gap) -> Do (unaided) -> Vary (transfer to a new surface). The Vary rung
 * is where understanding is actually proven, so it must use a *different*
 * surface from the one the learner practised on.
 */

export type LadderStep = 'watch' | 'complete' | 'do' | 'vary'

export const LADDER: readonly LadderStep[] = ['watch', 'complete', 'do', 'vary'] as const

export const LADDER_LABELS: Record<LadderStep, string> = {
  watch: 'Watch',
  complete: 'Complete',
  do: 'Do',
  vary: 'Vary',
}

export interface ScaffoldState {
  step: LadderStep
  /** True once the base concept has been demonstrated for this interaction. */
  baseConceptShown: boolean
  /** New concepts introduced in the current interaction (budget: 1). */
  newConcepts: number
}

export const MAX_NEW_CONCEPTS_PER_INTERACTION = 1

export function initialScaffold(): ScaffoldState {
  // First contact with any lab is always the guided worked example.
  return { step: 'watch', baseConceptShown: false, newConcepts: 0 }
}

export function advance(state: ScaffoldState): ScaffoldState {
  const index = LADDER.indexOf(state.step)
  const next = LADDER[Math.min(index + 1, LADDER.length - 1)]
  return {
    ...state,
    step: next,
    // Leaving the worked example means the base concept has been shown.
    baseConceptShown: state.baseConceptShown || state.step === 'watch',
    newConcepts: 0,
  }
}

export function isLastRung(state: ScaffoldState): boolean {
  return state.step === LADDER[LADDER.length - 1]
}

/** Advanced controls stay collapsed until the base concept has been shown. */
export function canRevealAdvanced(state: ScaffoldState): boolean {
  return state.baseConceptShown
}

export interface ConceptAdmission {
  state: ScaffoldState
  admitted: boolean
  reason?: string
}

/**
 * Admits at most one new concept per interaction; a second request is refused
 * so the learner is never asked to hold two new ideas at once.
 */
export function admitConcept(state: ScaffoldState): ConceptAdmission {
  if (state.newConcepts >= MAX_NEW_CONCEPTS_PER_INTERACTION) {
    return {
      state,
      admitted: false,
      reason: 'One new concept per interaction: split this into a second beat.',
    }
  }
  return { state: { ...state, newConcepts: state.newConcepts + 1 }, admitted: true }
}

/**
 * The transfer rung must present a surface the learner has not practised on;
 * repeating the same surface tests mimicry rather than understanding.
 */
export function isValidVarySurface(practisedSurface: string, varySurface: string): boolean {
  return practisedSurface.trim().toLowerCase() !== varySurface.trim().toLowerCase()
}
