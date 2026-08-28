/**
 * Story 6 — Module 6 risk memo and content gate (TC-04..TC-06). The branching
 * simulator journey is covered end to end in e2e/m6-capstone.spec.ts.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Module6 from './index'
import { generateMemo, evaluateMemo, memoToText } from './memo'
import { assess, replaceChoice, DECISIONS, DECISION_ORDER, type Selections } from './scenario'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import { useProgress, emptyProgress } from '../../state/progress'

beforeEach(() => useProgress.setState({ ...emptyProgress() }))

/** The most capable configuration: all three legs present. */
const TRIFECTA: Selections = {
  modelSource: 'vendor-api',
  dataScope: 'full-inbox',
  toolPerms: 'send-and-act',
  egress: 'open-egress',
  guardrail: 'guardrail-only',
}

/** The same case with the outbound channel cut. */
const CONTAINED: Selections = { ...TRIFECTA, egress: 'allowlist', toolPerms: 'draft-only' }

describe('the scenario assessment is honest about the trade-off', () => {
  it('flags the most capable configuration as trifecta-complete', () => {
    const assessment = assess(TRIFECTA)

    expect(assessment.trifectaComplete).toBe(true)
    expect(assessment.incident).toBe(true)
    expect(assessment.legs).toEqual({
      privateData: true,
      untrustedContent: true,
      externalComms: true,
    })
  })

  it('shows the most capable configuration is the least securable', () => {
    // The course thesis, as an assertion rather than a slogan.
    expect(assess(TRIFECTA).capability).toBeGreaterThan(assess(CONTAINED).capability)
    expect(assess(TRIFECTA).trifectaComplete).toBe(true)
    expect(assess(CONTAINED).trifectaComplete).toBe(false)
  })

  it('recomputes when exactly one decision is changed', () => {
    // The outbound leg has more than one door. Restricting network egress while
    // the assistant can still send mail leaves the leg intact — which is the
    // point: a partial cut is not a cut.
    const egressOnly = replaceChoice(TRIFECTA, 'egress', 'allowlist')
    expect(assess(egressOnly).legs.externalComms).toBe(true)
    expect(assess(egressOnly).trifectaComplete).toBe(true)

    // Closing the remaining door does cut it.
    const bothDoors = replaceChoice(egressOnly, 'toolPerms', 'draft-only')
    expect(assess(bothDoors).legs.externalComms).toBe(false)
    expect(assess(bothDoors).trifectaComplete).toBe(false)
    expect(assess(bothDoors).legs.privateData).toBe(true)
    expect(assess(bothDoors).topMitigation).toMatch(/every outbound path closed/i)
  })

  it('warns that restricting egress alone is not a cut', () => {
    expect(assess(TRIFECTA).topMitigation).toMatch(/more than one door/i)
  })

  it('names a MITRE ATLAS technique for every decision taken', () => {
    expect(assess(TRIFECTA).atlasTechniques.length).toBeGreaterThan(0)
    for (const decision of DECISIONS) {
      for (const option of decision.options) {
        expect(option.atlasTechnique.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('TC-04 the memo is generated from the learner choices', () => {
  it('carries every decision, the trifecta status and the top mitigation', () => {
    const memo = generateMemo(TRIFECTA, 'Weight-level backdoors cannot be ruled out.')

    expect(memo.decisions).toHaveLength(DECISION_ORDER.length)
    expect(memo.trifectaComplete).toBe(true)
    expect(memo.topMitigation).toMatch(/cut a leg/i)
  })

  it('exports as text a person could paste into a ticket', () => {
    const text = memoToText(generateMemo(TRIFECTA, 'Supply-chain backdoors remain unverifiable.'))

    expect(text).toContain('RISK MEMO')
    expect(text).toContain('Trifecta status: COMPLETE')
    expect(text).toContain('Residual risk')
    expect(text).toContain('Supply-chain backdoors remain unverifiable.')
  })
})

describe('TC-05 a complete memo passes', () => {
  it('accepts a memo that states an honest residual risk', () => {
    const outcome = evaluateMemo(
      generateMemo(CONTAINED, 'A backdoored model in the supply chain cannot be ruled out.'),
    )

    expect(outcome.passed).toBe(true)
    expect(outcome.missing).toEqual([])
  })

  it('says plainly when the trifecta was reported honestly', () => {
    const outcome = evaluateMemo(
      generateMemo(TRIFECTA, 'Guardrails will eventually be bypassed by a determined attacker.'),
    )

    expect(outcome.passed).toBe(true)
    expect(outcome.reason).toMatch(/named the trifecta honestly/i)
  })
})

describe('TC-06 a memo with no residual risk is refused', () => {
  it('names the missing residual risk and calls it overclaiming', () => {
    const outcome = evaluateMemo(generateMemo(CONTAINED, ''))

    expect(outcome.passed).toBe(false)
    expect(outcome.missing).toContain('a residual risk that cannot be eliminated')
    expect(outcome.reason).toMatch(/overclaiming/i)
  })

  it('refuses a token non-answer as well as an empty one', () => {
    expect(evaluateMemo(generateMemo(CONTAINED, 'none')).passed).toBe(false)
    expect(evaluateMemo(generateMemo(CONTAINED, '  n/a  ')).passed).toBe(false)
  })

  it('refuses a memo where decisions are still outstanding', () => {
    const outcome = evaluateMemo(
      generateMemo({ modelSource: 'vendor-api' }, 'Some risk remains here.'),
    )

    expect(outcome.passed).toBe(false)
    expect(outcome.missing).toContain('every decision answered')
  })
})

describe('the module surface', () => {
  it('walks the decisions and gates the memo on a residual risk', async () => {
    const user = userEvent.setup()
    render(
      <ReferenceProvider>
        <Module6 />
      </ReferenceProvider>,
    )

    // Work through all five decisions, choosing the most capable option each time.
    const picks = ['vendor-api', 'full-inbox', 'send-and-act', 'open-egress', 'guardrail-only']
    for (let i = 0; i < picks.length; i += 1) {
      await user.click(screen.getByTestId(`option-${picks[i]}`))
      await user.click(
        screen.getByRole('button', {
          name: i === picks.length - 1 ? 'See the outcome' : 'Next decision',
        }),
      )
    }

    // The full-circle incident from Module 0 runs for the trifecta-complete design.
    expect(screen.getByTestId('full-circle-incident')).toBeInTheDocument()

    // The memo will not complete without a residual risk.
    await user.click(screen.getByRole('button', { name: 'Finish my memo' }))
    expect(screen.getByTestId('memo-result')).toHaveAttribute('data-passed', 'false')
    expect(useProgress.getState().completedModules.m6).toBeUndefined()

    await user.type(
      screen.getByTestId('residual-risk-input'),
      'A backdoored model cannot be ruled out by any test we can run.',
    )
    await user.click(screen.getByRole('button', { name: 'Finish my memo' }))

    expect(screen.getByTestId('memo-result')).toHaveAttribute('data-passed', 'true')
    expect(screen.getByTestId('memo-export')).toHaveTextContent('RISK MEMO')
    expect(useProgress.getState().completedModules.m6).toBe(true)
  })
})
