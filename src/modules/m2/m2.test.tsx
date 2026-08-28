/**
 * Story 3 — Module 2 injection engine (TC-01..TC-03) and mastery gate
 * (TC-07, TC-12).
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { processContent, cutLeg, ALL_LEGS, SEEDED_SECRET, WORKED_PAYLOAD } from './engine'
import { evaluateMastery } from './mastery'
import { InjectionPlayground } from './InjectionPlayground'

describe('TC-01 a firing payload with all legs exfiltrates the seeded secret', () => {
  it('renders a link carrying the secret and reports the hijack', () => {
    const result = processContent(WORKED_PAYLOAD, { legs: ALL_LEGS })

    expect(result.exfiltrated).toBe(true)
    expect(result.exfil?.rendered).toContain(encodeURIComponent(SEEDED_SECRET))
    expect(result.hijack).not.toBeNull()
    expect(result.announcement).toMatch(/Secret exfiltrated/)
  })
})

describe('TC-02 a non-firing payload yields a trace and no exfiltration', () => {
  it('explains why nothing happened instead of erroring', () => {
    const result = processContent('The review moved to Thursday, no action needed.', {
      legs: ALL_LEGS,
    })

    expect(result.exfiltrated).toBe(false)
    expect(result.exfil).toBeNull()
    expect(result.trace).toMatch(/did what you asked/i)
  })
})

describe('TC-03 cutting the outbound channel blocks exfiltration', () => {
  it('follows the instruction but cannot send', () => {
    const result = processContent(WORKED_PAYLOAD, {
      legs: cutLeg(ALL_LEGS, 'externalComms'),
    })

    expect(result.exfiltrated).toBe(false)
    expect(result.trace).toMatch(/no channel to the outside/i)
  })

  it('is likewise blocked when either other leg is cut', () => {
    expect(processContent(WORKED_PAYLOAD, { legs: cutLeg(ALL_LEGS, 'privateData') }).exfiltrated).toBe(
      false,
    )
    expect(
      processContent(WORKED_PAYLOAD, { legs: cutLeg(ALL_LEGS, 'untrustedContent') }).exfiltrated,
    ).toBe(false)
  })
})

describe('the playground surfaces the attack to the learner', () => {
  it('shows the rendered exfiltration link and an inspectable trace', async () => {
    const user = userEvent.setup()
    render(<InjectionPlayground surface="email" />)

    await user.type(screen.getByTestId('payload-input'), WORKED_PAYLOAD)
    await user.click(screen.getByRole('button', { name: 'Run the assistant' }))

    expect(screen.getByTestId('exfil-result')).toHaveAttribute('data-exfiltrated', 'true')
    expect(screen.getByTestId('exfil-link')).toHaveTextContent('attacker.example')
    expect(screen.getByTestId('reasoning-trace')).toBeInTheDocument()
  })

  it('gives a diagnostic trace rather than an error when nothing fires', async () => {
    const user = userEvent.setup()
    render(<InjectionPlayground surface="email" />)

    await user.type(screen.getByTestId('payload-input'), 'See you Thursday.')
    await user.click(screen.getByRole('button', { name: 'Run the assistant' }))

    expect(screen.getByTestId('no-exfil-result')).toHaveAttribute('data-exfiltrated', 'false')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('TC-07 mastery requires transfer AND a leg that genuinely stops the attack', () => {
  it('passes when both halves hold', () => {
    const outcome = evaluateMastery({
      transferExfiltrated: true,
      namedLeg: 'externalComms',
      payload: WORKED_PAYLOAD,
    })

    expect(outcome.passed).toBe(true)
    expect(outcome.reason).toMatch(/cannot complete/i)
  })

  it('accepts any leg the learner can demonstrate stops their own attack', () => {
    for (const leg of ['privateData', 'untrustedContent', 'externalComms'] as const) {
      expect(
        evaluateMastery({ transferExfiltrated: true, namedLeg: leg, payload: WORKED_PAYLOAD })
          .passed,
      ).toBe(true)
    }
  })
})

describe('TC-12 an incomplete answer is blocked', () => {
  it('blocks when the transfer surface was never achieved', () => {
    const outcome = evaluateMastery({
      transferExfiltrated: false,
      namedLeg: 'externalComms',
      payload: WORKED_PAYLOAD,
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/calendar invite/i)
  })

  it('blocks when no leg is named', () => {
    const outcome = evaluateMastery({
      transferExfiltrated: true,
      namedLeg: null,
      payload: WORKED_PAYLOAD,
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/name the leg/i)
  })
})
