/**
 * Story 12 — seven-state interactive machine (x5d.state_machine), TC-07..TC-08.
 */
import { describe, expect, it } from 'vitest'
import {
  transition,
  isDefinedTransition,
  UI_STATES,
  FALLBACK_STATE,
  type UIState,
} from './stateMachine'

describe('TC-07 defined transitions move to the correct next state', () => {
  const cases: Array<[UIState, string, UIState]> = [
    ['idle', 'open', 'guided_replay'],
    ['guided_replay', 'replay_finished', 'learner_active'],
    ['learner_active', 'act', 'consequence_playing'],
    ['consequence_playing', 'consequence_shown', 'explained'],
    ['explained', 'master', 'mastered'],
    ['learner_active', 'reset', 'reset'],
    ['reset', 'cleared', 'idle'],
  ]

  it.each(cases)('%s + %s -> %s', (from, event, expected) => {
    expect(isDefinedTransition(from, event)).toBe(true)
    expect(transition(from, event)).toBe(expected)
  })

  it('models all seven states', () => {
    expect(UI_STATES).toHaveLength(7)
    expect(UI_STATES).toEqual([
      'idle',
      'guided_replay',
      'learner_active',
      'consequence_playing',
      'explained',
      'mastered',
      'reset',
    ])
  })
})

describe('TC-08 undefined transitions fall back safely', () => {
  it('never yields a broken state for an unknown event', () => {
    for (const state of UI_STATES) {
      const next = transition(state, 'no_such_event')
      expect(UI_STATES).toContain(next)
      expect(next).toBe(FALLBACK_STATE)
    }
  })

  it('reports the pair as undefined rather than silently modelling it', () => {
    expect(isDefinedTransition('mastered', 'act')).toBe(false)
    expect(transition('mastered', 'act')).toBe('idle')
  })
})
