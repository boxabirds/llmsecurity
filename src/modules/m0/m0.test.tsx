/**
 * Module 0 — discovery flow (TC-04) and trifecta mastery (TC-05..TC-08).
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getLiveRegion, resetLiveRegion } from '../../a11y/announce'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import { useProgress, emptyProgress } from '../../state/progress'
import { DiscoveryFlow, CONTEXT_SEGMENTS } from './DiscoveryFlow'
import { TokenStreamViz } from './TokenStreamViz'
import { TrifectaBuilder, TrifectaMastery } from './TrifectaBuilder'
import { evaluateMastery, emptyAnswers, missingLegs, M0_SYSTEMS, type M0Answer } from './mastery'
import { trifectaComplete, type LegName } from '../../sim/kernel'

const LEG_PATTERNS: Record<LegName, RegExp> = {
  privateData: /access to private data/,
  untrustedContent: /exposure to untrusted content/,
  externalComms: /an external communication channel/,
}

beforeEach(() => {
  useProgress.setState({ ...emptyProgress() })
})

afterEach(() => resetLiveRegion())

// ---------------------------------------------------------------------------
// TC-04 — the two views of the context window
// ---------------------------------------------------------------------------

describe('TC-04 the token stream toggles between the wished-for and the actual view', () => {
  it('starts on the mental model and switches to the flat stream', async () => {
    const user = userEvent.setup()
    render(<TokenStreamViz segments={CONTEXT_SEGMENTS} />)

    const stream = screen.getByTestId('token-stream')
    expect(stream).toHaveAttribute('data-view', 'wished')
    expect(screen.getByText('What we wish the model saw')).toBeInTheDocument()
    // Grouped by origin: the email is visibly its own, untrusted block.
    expect(stream.querySelectorAll('[data-origin="retrieved"][data-trust="untrusted"]').length).toBe(
      1,
    )

    await user.click(screen.getByTestId('token-stream-toggle'))

    expect(screen.getByTestId('token-stream')).toHaveAttribute('data-view', 'actual')
    expect(screen.getByText('What it actually sees')).toBeInTheDocument()
    // Flat view: every token is rendered identically, with no origin at all.
    expect(screen.getByTestId('token-stream').querySelectorAll('[data-origin]').length).toBe(0)

    await user.click(screen.getByTestId('token-stream-toggle'))
    expect(screen.getByTestId('token-stream')).toHaveAttribute('data-view', 'wished')
  })
})

// ---------------------------------------------------------------------------
// The cold open is discovery-safe: any answer opens the same reveal
// ---------------------------------------------------------------------------

describe('the reflective beat never marks the learner right or wrong', () => {
  async function playColdOpen(answer: RegExp) {
    const user = userEvent.setup()
    render(
      <ReferenceProvider>
        <DiscoveryFlow />
      </ReferenceProvider>,
    )

    expect(screen.getByTestId('cold-open')).toBeInTheDocument()
    expect(screen.queryByTestId('mechanism-explanation')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ask the assistant to summarise' }))
    expect(screen.getByTestId('leak-outcome')).toBeInTheDocument()
    // Still no explanation: the learner has to form their own hypothesis first.
    expect(screen.queryByTestId('mechanism-explanation')).not.toBeInTheDocument()
    expect(screen.queryByTestId('token-stream')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wait — what just happened?' }))
    const beat = screen.getByTestId('reflective-beat')
    expect(within(beat).getAllByRole('button')).toHaveLength(3)

    await user.click(within(beat).getByRole('button', { name: answer }))
  }

  it('reveals the token stream when the answer is the email sender', async () => {
    await playColdOpen(/the email sender/)

    expect(screen.getByTestId('token-stream')).toBeInTheDocument()
    expect(screen.getByTestId('mechanism-explanation')).toBeInTheDocument()
  })

  it('reveals exactly the same thing for a wrong answer, with no verdict', async () => {
    await playColdOpen(/the developer/)

    expect(screen.getByTestId('token-stream')).toBeInTheDocument()
    expect(screen.getByTestId('mechanism-explanation')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TC-05 / TC-06 / TC-07 — the trifecta builder
// ---------------------------------------------------------------------------

describe('TC-05 two legs leave the danger indicator inactive', () => {
  it('stays inactive at one and at two legs', async () => {
    const user = userEvent.setup()
    render(<TrifectaBuilder />)

    const indicator = screen.getByTestId('danger-indicator')
    expect(indicator).toHaveAttribute('data-armed', 'false')

    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.privateData }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')

    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.untrustedContent }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-legs', '2')
    expect(screen.getByTestId('danger-explanation')).toHaveTextContent(
      /an external communication channel/,
    )
  })

  it('disarms again when a leg is taken away', async () => {
    const user = userEvent.setup()
    render(<TrifectaBuilder />)

    for (const leg of ['privateData', 'untrustedContent', 'externalComms'] as const) {
      await user.click(screen.getByRole('button', { name: LEG_PATTERNS[leg] }))
    }
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'true')

    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.externalComms }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')
  })
})

describe('TC-06 the third leg arms the indicator with an explanation', () => {
  it('arms only on the third, and says why in the same breath', async () => {
    const user = userEvent.setup()
    render(<TrifectaBuilder />)

    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.privateData }))
    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.untrustedContent }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')

    await user.click(screen.getByRole('button', { name: LEG_PATTERNS.externalComms }))

    const indicator = screen.getByTestId('danger-indicator')
    expect(indicator).toHaveAttribute('data-armed', 'true')
    expect(indicator).toHaveAttribute('data-legs', '3')
    expect(within(indicator).getByText('Exposed')).toBeInTheDocument()

    const explanation = screen.getByTestId('danger-explanation')
    expect(explanation).toHaveTextContent(/All three at once/)
    expect(explanation).toHaveTextContent(/instruction/)
    expect(explanation).toHaveTextContent(/carries it away/)
  })
})

describe('TC-07 the legs are operable by keyboard alone and arming is announced', () => {
  it('arms via Tab and Enter, and speaks the outcome', async () => {
    const user = userEvent.setup()
    render(<TrifectaBuilder />)

    for (let i = 0; i < 3; i += 1) {
      await user.tab()
      await user.keyboard('{Enter}')
    }

    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'true')
    expect(getLiveRegion().textContent).toMatch(/Danger armed: all three legs present/)
  })

  it('leaves the indicator inactive after two keyboard activations', async () => {
    const user = userEvent.setup()
    render(<TrifectaBuilder />)

    for (let i = 0; i < 2; i += 1) {
      await user.tab()
      await user.keyboard('{Enter}')
    }

    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')
    expect(getLiveRegion().textContent).toMatch(/2 of 3 legs present/)
  })
})

// ---------------------------------------------------------------------------
// TC-08 — the mastery gate
// ---------------------------------------------------------------------------

async function answerCorrectly(user: ReturnType<typeof userEvent.setup>) {
  for (const system of M0_SYSTEMS) {
    const card = within(screen.getByTestId(`system-${system.id}`))
    const armed = trifectaComplete(system.legs)

    await user.click(card.getByRole('button', { name: armed ? /All three legs/ : /A leg is missing/ }))

    if (!armed) {
      const absent = missingLegs(system)[0]
      await user.click(card.getByRole('button', { name: LEG_PATTERNS[absent] }))
    }
  }
}

describe('TC-08 the mastery gate blocks until every call holds and every leg is named', () => {
  it('blocks an empty submission', async () => {
    const user = userEvent.setup()
    render(<TrifectaMastery />)

    await user.click(screen.getByRole('button', { name: 'Check my answers' }))

    const result = screen.getByTestId('mastery-result')
    expect(result).toHaveAttribute('data-passed', 'false')
    expect(result).toHaveTextContent(/still to call/)
    expect(useProgress.getState().completedModules.m0).toBeUndefined()
  })

  it('blocks when the calls hold but a missing leg is never named', async () => {
    const user = userEvent.setup()
    render(<TrifectaMastery />)

    for (const system of M0_SYSTEMS) {
      const card = within(screen.getByTestId(`system-${system.id}`))
      const armed = trifectaComplete(system.legs)
      await user.click(
        card.getByRole('button', { name: armed ? /All three legs/ : /A leg is missing/ }),
      )
    }

    await user.click(screen.getByRole('button', { name: 'Check my answers' }))

    const result = screen.getByTestId('mastery-result')
    expect(result).toHaveAttribute('data-passed', 'false')
    expect(result).toHaveTextContent(/still unnamed/)
  })

  it('passes when all five hold and every absent leg is named, and records the module', async () => {
    const user = userEvent.setup()
    render(<TrifectaMastery />)

    await answerCorrectly(user)
    await user.click(screen.getByRole('button', { name: 'Check my answers' }))

    expect(screen.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'true')
    expect(useProgress.getState().completedModules.m0).toBe(true)
    expect(useProgress.getState().scores.m0).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// evaluateMastery, directly
// ---------------------------------------------------------------------------

function correctAnswers(): Record<string, M0Answer> {
  const answers = emptyAnswers()
  for (const system of M0_SYSTEMS) {
    const armed = trifectaComplete(system.legs)
    answers[system.id] = {
      complete: armed,
      missingLeg: armed ? null : missingLegs(system)[0],
    }
  }
  return answers
}

describe('evaluateMastery', () => {
  it('offers five systems, mixing complete and safe ones', () => {
    expect(M0_SYSTEMS).toHaveLength(5)
    const complete = M0_SYSTEMS.filter((s) => trifectaComplete(s.legs))
    expect(complete.length).toBeGreaterThan(0)
    expect(complete.length).toBeLessThan(M0_SYSTEMS.length)
  })

  it('gives every safe system exactly one absent leg, and covers all three', () => {
    const safe = M0_SYSTEMS.filter((s) => !trifectaComplete(s.legs))
    for (const system of safe) expect(missingLegs(system)).toHaveLength(1)
    expect(new Set(safe.map((s) => missingLegs(s)[0])).size).toBe(3)
  })

  it('passes only on a fully correct answer set', () => {
    const outcome = evaluateMastery(correctAnswers())
    expect(outcome.passed).toBe(true)
    expect(outcome.correctJudgements).toBe(M0_SYSTEMS.length)
    expect(outcome.legsNamed).toBe(outcome.legsRequired)
  })

  it('blocks on an unanswered set', () => {
    const outcome = evaluateMastery(emptyAnswers())
    expect(outcome.passed).toBe(false)
    expect(outcome.answered).toBe(0)
    expect(outcome.reason).toMatch(/still to call/)
  })

  it('blocks a single wrong judgement', () => {
    const answers = correctAnswers()
    const target = M0_SYSTEMS[0]
    answers[target.id] = { complete: !trifectaComplete(target.legs), missingLeg: null }

    const outcome = evaluateMastery(answers)
    expect(outcome.passed).toBe(false)
    expect(outcome.correctJudgements).toBe(M0_SYSTEMS.length - 1)
    expect(outcome.reason).toMatch(/do not hold/)
  })

  it('blocks when a safe system has no named leg', () => {
    const answers = correctAnswers()
    const safe = M0_SYSTEMS.find((s) => !trifectaComplete(s.legs))!
    answers[safe.id] = { complete: false, missingLeg: null }

    const outcome = evaluateMastery(answers)
    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/still unnamed/)
  })

  it('blocks when the named leg is one the system actually has', () => {
    const answers = correctAnswers()
    const safe = M0_SYSTEMS.find((s) => !trifectaComplete(s.legs))!
    const present = (['privateData', 'untrustedContent', 'externalComms'] as const).find(
      (leg) => safe.legs[leg],
    )!
    answers[safe.id] = { complete: false, missingLeg: present }

    const outcome = evaluateMastery(answers)
    expect(outcome.passed).toBe(false)
    expect(outcome.legsNamed).toBe(outcome.legsRequired - 1)
    expect(outcome.reason).toMatch(/present in that system/)
  })
})
