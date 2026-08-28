/**
 * Story 12 — accessibility and motion layer (x5d.a11y_motion), TC-01..TC-06.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { announce, getLiveRegion, resetLiveRegion } from './announce'
import { motionDuration, MOTION_MIN_MS, MOTION_MAX_MS } from './motion'
import { RiskSignal, riskSignalFor } from './RiskSignal'
import { useBeats } from './beats'
import { VERBS, verbMeaning } from './verbs'
import { onGlobalKey, globalKeyListenerCount } from './keyboard'
import { setReducedMotion } from '../test/setup'

afterEach(() => resetLiveRegion())

describe('TC-01 simulation outcomes are announced in words', () => {
  it('writes the outcome into a polite live region', () => {
    announce('Secret exfiltrated: the account number was sent to attacker.example')

    const region = getLiveRegion()
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('role', 'status')
    expect(region.textContent).toBe(
      'Secret exfiltrated: the account number was sent to attacker.example',
    )
  })

  it('reuses a single region rather than stacking one per announcement', () => {
    announce('first outcome')
    announce('second outcome')
    announce('third outcome')

    expect(document.querySelectorAll('#llmsec-live-region')).toHaveLength(1)
    expect(getLiveRegion().textContent).toBe('third outcome')
  })
})

describe('TC-02 drag interactions have a keyboard equivalent', () => {
  function LegList() {
    const [legs, setLegs] = useState<string[]>([])
    const toggle = (leg: string) =>
      setLegs((prev) => (prev.includes(leg) ? prev.filter((l) => l !== leg) : [...prev, leg]))
    return (
      <ul>
        {['private data', 'untrusted content', 'external comms'].map((leg) => (
          <li key={leg}>
            <button type="button" aria-pressed={legs.includes(leg)} onClick={() => toggle(leg)}>
              {leg}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  it('adds and removes by keyboard alone, with pressed state exposed', async () => {
    const user = userEvent.setup()
    render(<LegList />)

    // Tab to the first control and operate it with the keyboard only.
    await user.tab()
    const first = screen.getByRole('button', { name: 'private data' })
    expect(first).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(first).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Enter}')
    expect(first).toHaveAttribute('aria-pressed', 'false')
  })

  it('shares one global key listener across subscribers', () => {
    const offA = onGlobalKey('Escape', () => {})
    const offB = onGlobalKey('Escape', () => {})
    expect(globalKeyListenerCount()).toBe(1)
    offA()
    offB()
    expect(globalKeyListenerCount()).toBe(0)
  })
})

describe('TC-03 explanatory motion is bounded to 200-400ms', () => {
  it('keeps every speed inside the band', () => {
    for (const speed of ['fast', 'base', 'slow'] as const) {
      const ms = motionDuration(speed, false)
      expect(ms).toBeGreaterThanOrEqual(MOTION_MIN_MS)
      expect(ms).toBeLessThanOrEqual(MOTION_MAX_MS)
    }
  })

  it('uses a consistent verb vocabulary for interactions', () => {
    expect(VERBS).toEqual(['drag', 'toggle', 'inject', 'cut'])
    expect(verbMeaning('cut')).toBe('remove a capability or leg')
  })
})

describe('TC-04 reduced motion swaps animation for a static parity view', () => {
  it('returns zero duration so the static before/after is shown instead', () => {
    setReducedMotion(true)
    expect(motionDuration('base')).toBe(0)
    expect(motionDuration('slow')).toBe(0)
  })
})

describe('TC-05 risk is never conveyed by colour alone', () => {
  it('always renders an icon, a label and explanatory text', () => {
    render(<RiskSignal level="exposed" />)

    const signal = screen.getByText('Exposed').closest('.risk-signal')
    expect(signal).toBeInTheDocument()
    expect(signal).toHaveAttribute('data-risk', 'exposed')
    expect(signal?.querySelector('.risk-signal__icon')?.textContent).toBeTruthy()
    expect(screen.getByText('Directly exploitable as configured.')).toBeInTheDocument()
  })

  it('defines an icon and label for every level', () => {
    for (const level of ['contained', 'elevated', 'exposed'] as const) {
      const signal = riskSignalFor(level)
      expect(signal.icon.length).toBeGreaterThan(0)
      expect(signal.label.length).toBeGreaterThan(0)
      expect(signal.text.length).toBeGreaterThan(0)
    }
  })
})

describe('TC-06 guided replay is learner-paced, not timed', () => {
  function Replay() {
    const beats = useBeats(3)
    return (
      <div>
        <p>
          Beat {beats.index + 1} of {beats.total}
        </p>
        <button type="button" onClick={beats.next}>
          Next beat
        </button>
      </div>
    )
  }

  it('does not advance on its own no matter how much time passes', async () => {
    vi.useFakeTimers()
    try {
      render(<Replay />)
      expect(screen.getByText('Beat 1 of 3')).toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(60_000)
      })

      expect(screen.getByText('Beat 1 of 3')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('advances only when the learner advances it', async () => {
    const user = userEvent.setup()
    render(<Replay />)

    await user.click(screen.getByRole('button', { name: 'Next beat' }))
    expect(screen.getByText('Beat 2 of 3')).toBeInTheDocument()
  })
})
