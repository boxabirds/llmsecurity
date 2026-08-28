/**
 * The seven interactive states every interactive must define.
 *
 * Defining all seven up front is what prevents the "what do I do now?" dead-air
 * that breaks flow. The table is a pure function so it is trivially testable and
 * shared by every lab.
 */

export type UIState =
  | 'idle'
  | 'guided_replay'
  | 'learner_active'
  | 'consequence_playing'
  | 'explained'
  | 'mastered'
  | 'reset'

export const UI_STATES: readonly UIState[] = [
  'idle',
  'guided_replay',
  'learner_active',
  'consequence_playing',
  'explained',
  'mastered',
  'reset',
] as const

export type UIEvent =
  | 'open'
  | 'replay_finished'
  | 'act'
  | 'consequence_shown'
  | 'explained'
  | 'master'
  | 'reset'
  | 'cleared'

/** Safe landing state for any transition the table does not define. */
export const FALLBACK_STATE: UIState = 'idle'

const TABLE: Partial<Record<UIState, Partial<Record<UIEvent, UIState>>>> = {
  idle: { open: 'guided_replay', act: 'learner_active' },
  guided_replay: { replay_finished: 'learner_active', reset: 'reset' },
  learner_active: { act: 'consequence_playing', reset: 'reset' },
  consequence_playing: { consequence_shown: 'explained', reset: 'reset' },
  explained: { master: 'mastered', act: 'consequence_playing', reset: 'reset' },
  mastered: { reset: 'reset' },
  reset: { cleared: 'idle', open: 'guided_replay' },
}

/**
 * Advance the machine. An undefined (state, event) pair never yields a broken
 * state: it lands on the documented fallback instead.
 */
export function transition(from: UIState, event: string): UIState {
  const next = TABLE[from]?.[event as UIEvent]
  return next ?? FALLBACK_STATE
}

/** True when the pair is explicitly modelled (used by tests and diagnostics). */
export function isDefinedTransition(from: UIState, event: string): boolean {
  return TABLE[from]?.[event as UIEvent] !== undefined
}
