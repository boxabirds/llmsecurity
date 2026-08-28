/**
 * Story 10 — scaffold and load engine (x3d.scaffold_engine), TC-05..TC-08.
 */
import { describe, expect, it } from 'vitest'
import {
  initialScaffold,
  advance,
  canRevealAdvanced,
  admitConcept,
  isValidVarySurface,
  isLastRung,
  LADDER,
  MAX_NEW_CONCEPTS_PER_INTERACTION,
} from './scaffold'

describe('TC-05 first contact with a lab is the worked example', () => {
  it('starts on the watch rung before the learner takes the controls', () => {
    const state = initialScaffold()
    expect(state.step).toBe('watch')
    expect(state.baseConceptShown).toBe(false)
  })

  it('hands over the controls only after the worked example', () => {
    const afterWatch = advance(initialScaffold())
    expect(afterWatch.step).toBe('complete')
    expect(afterWatch.baseConceptShown).toBe(true)
  })
})

describe('TC-06 advanced controls stay collapsed until the base concept is shown', () => {
  it('hides advanced controls on first contact', () => {
    expect(canRevealAdvanced(initialScaffold())).toBe(false)
  })

  it('reveals them once the worked example has run', () => {
    expect(canRevealAdvanced(advance(initialScaffold()))).toBe(true)
  })
})

describe('TC-07 only one new concept is admitted per interaction', () => {
  it('admits the first and refuses the second', () => {
    const first = admitConcept(initialScaffold())
    expect(first.admitted).toBe(true)
    expect(first.state.newConcepts).toBe(MAX_NEW_CONCEPTS_PER_INTERACTION)

    const second = admitConcept(first.state)
    expect(second.admitted).toBe(false)
    expect(second.reason).toMatch(/one new concept/i)
    expect(second.state.newConcepts).toBe(MAX_NEW_CONCEPTS_PER_INTERACTION)
  })

  it('resets the budget when the ladder advances to the next beat', () => {
    const used = admitConcept(initialScaffold()).state
    expect(advance(used).newConcepts).toBe(0)
  })
})

describe('TC-08 the ladder runs Watch, Complete, Do, Vary', () => {
  it('progresses in order and stops at the last rung', () => {
    let state = initialScaffold()
    const seen = [state.step]
    for (let i = 0; i < 5; i += 1) {
      state = advance(state)
      seen.push(state.step)
    }

    expect(LADDER).toEqual(['watch', 'complete', 'do', 'vary'])
    expect(seen.slice(0, 4)).toEqual(['watch', 'complete', 'do', 'vary'])
    expect(isLastRung(state)).toBe(true)
  })

  it('requires the Vary rung to use a different surface from the practised one', () => {
    expect(isValidVarySurface('email', 'calendar')).toBe(true)
    expect(isValidVarySurface('email', 'email')).toBe(false)
    expect(isValidVarySurface('Email', ' email ')).toBe(false)
  })
})
