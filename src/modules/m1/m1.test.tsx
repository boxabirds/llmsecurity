/**
 * Story 2 — Module 1 risk map (TC-01..TC-04, TC-09) and the tagging logic
 * behind the assessment.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import { useProgress, emptyProgress } from '../../state/progress'
import { setReducedMotion } from '../../test/setup'
import { RiskMatrix } from './RiskMatrix'
import { TaggingAssessment } from './TaggingAssessment'
import { OWASP_RISKS, riskByCode, type Risk } from './risks'
import { VIGNETTES, tag, feedbackFor, scoreAnswers, isComplete, adjacentTo } from './tagging'

function renderMatrix(risks?: readonly Risk[]) {
  return render(
    <ReferenceProvider>
      <RiskMatrix risks={risks} />
    </ReferenceProvider>,
  )
}

beforeEach(() => {
  useProgress.setState({ ...emptyProgress() })
})

describe('TC-01 focusing a card raises its one-line gloss', () => {
  it('is unraised until focus reaches it, then carries the gloss', async () => {
    const user = userEvent.setup()
    renderMatrix()

    const card = screen.getByTestId('risk-card-LLM01')
    expect(card).not.toHaveAttribute('data-raised')

    await user.tab()

    expect(within(card).getByRole('button')).toHaveFocus()
    expect(card).toHaveAttribute('data-raised', 'true')
    expect(card).toHaveTextContent('Text the model reads becomes instructions it follows.')
  })

  it('describes the card by its gloss for assistive technology', () => {
    renderMatrix()
    const button = within(screen.getByTestId('risk-card-LLM02')).getByRole('button')
    const glossId = button.getAttribute('aria-describedby')
    expect(glossId).toBeTruthy()
    expect(document.getElementById(glossId as string)).toHaveTextContent(
      'Private data that reached the context window leaves in an answer.',
    )
  })
})

describe('TC-02 activating a card expands the incident and its framework chip', () => {
  it('shows the documented case and a citation that opens the reference panel', async () => {
    const user = userEvent.setup()
    renderMatrix()

    const card = screen.getByTestId('risk-card-LLM01')
    const button = within(card).getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)

    const incident = screen.getByTestId('risk-incident')
    expect(incident).toHaveTextContent('CVE-2025-32711')
    expect(button).toHaveAttribute('aria-expanded', 'true')

    const chips = within(incident).getAllByRole('button', { name: /opens reference panel/ })
    expect(chips.length).toBeGreaterThan(0)

    await user.click(chips[0])
    expect(screen.getByRole('dialog', { name: 'Reference' })).toBeInTheDocument()
  })

  it('collapses again when the same card is activated twice', async () => {
    const user = userEvent.setup()
    renderMatrix()

    const button = within(screen.getByTestId('risk-card-LLM06')).getByRole('button')
    await user.click(button)
    expect(screen.getByTestId('risk-incident')).toBeInTheDocument()

    await user.click(button)
    expect(screen.queryByTestId('risk-incident')).not.toBeInTheDocument()
  })
})

describe('TC-03 the two 2025 additions are marked as new on first view', () => {
  it('marks exactly LLM07 and LLM08, and pulses them once', () => {
    renderMatrix()

    for (const risk of OWASP_RISKS) {
      const card = screen.getByTestId(`risk-card-${risk.code}`)
      if (risk.code === 'LLM07' || risk.code === 'LLM08') {
        expect(card).toHaveAttribute('data-new2025', 'true')
        expect(card).toHaveAttribute('data-pulse', 'true')
        expect(card).toHaveTextContent('New in 2025')
      } else {
        expect(card).not.toHaveAttribute('data-new2025')
        expect(card).not.toHaveAttribute('data-pulse')
      }
    }
  })

  it('does not pulse at all when reduced motion is requested', () => {
    setReducedMotion(true)
    renderMatrix()

    const card = screen.getByTestId('risk-card-LLM07')
    expect(card).toHaveAttribute('data-new2025', 'true')
    expect(card).not.toHaveAttribute('data-pulse')
    // The meaning survives without the motion.
    expect(card).toHaveTextContent('New in 2025')
  })
})

describe('TC-04 a risk reached from a later lab shows the visited state', () => {
  it('reads the visited set from shared progress', () => {
    useProgress.setState({ ...emptyProgress(), visitedRisks: { LLM04: true } })
    renderMatrix()

    const visited = screen.getByTestId('risk-card-LLM04')
    expect(visited).toHaveAttribute('data-visited', 'true')
    expect(visited).toHaveTextContent('Seen in a lab')
    expect(screen.getByTestId('risk-card-LLM05')).not.toHaveAttribute('data-visited')
  })
})

describe('TC-09 a card with no recorded incident degrades gracefully', () => {
  it('renders a placeholder and the framework chip instead of crashing', async () => {
    const user = userEvent.setup()
    const incomplete: Risk[] = [{ ...(riskByCode('LLM09') as Risk), incident: undefined }]
    renderMatrix(incomplete)

    await user.click(within(screen.getByTestId('risk-card-LLM09')).getByRole('button'))

    const placeholder = screen.getByTestId('risk-placeholder')
    expect(placeholder).toHaveTextContent('No verified public case is recorded here yet')
    expect(screen.queryByTestId('risk-incident')).not.toBeInTheDocument()
    expect(
      within(placeholder).getByRole('button', { name: /opens reference panel/ }),
    ).toBeInTheDocument()
  })
})

describe('the map data itself', () => {
  it('carries all ten 2025 entries, with exactly two new ones', () => {
    expect(OWASP_RISKS).toHaveLength(10)
    expect(OWASP_RISKS.filter((r) => r.isNew2025).map((r) => r.code)).toEqual(['LLM07', 'LLM08'])
  })

  it('resolves every framework chip to a registered reference id', () => {
    for (const risk of OWASP_RISKS) {
      expect(['owasp2025', 'mitreAtlas', 'nistAiRmf']).toContain(risk.frameworkRef)
    }
  })
})

describe('tag() places an answer as exact, adjacent or distant', () => {
  const injection = VIGNETTES[0]
  const supplyChain = VIGNETTES[1]

  it('is exact for the intended category', () => {
    expect(tag(injection, 'LLM01')).toBe('exact')
    expect(tag(supplyChain, 'LLM03')).toBe('exact')
  })

  it('is adjacent for a deliberately confusable neighbour', () => {
    expect(tag(injection, 'LLM02')).toBe('adjacent')
    expect(tag(injection, 'LLM06')).toBe('adjacent')
    expect(tag(supplyChain, 'LLM04')).toBe('adjacent')
  })

  it('is distant for an unrelated category', () => {
    expect(tag(injection, 'LLM10')).toBe('distant')
    expect(tag(supplyChain, 'LLM10')).toBe('distant')
  })

  it('keeps adjacency symmetric', () => {
    for (const code of adjacentTo('LLM01')) {
      expect(adjacentTo(code)).toContain('LLM01')
    }
  })
})

describe('feedback names the specific confusion on a near miss', () => {
  it('says what the distinction is, not just that it is wrong', () => {
    const feedback = feedbackFor(VIGNETTES[0], 'LLM02')
    expect(feedback.result).toBe('adjacent')
    expect(feedback.message).toMatch(/Near miss/)
    expect(feedback.message).toMatch(/mechanism/)
    expect(feedback.message).toMatch(/LLM01 Prompt Injection/)
    expect(feedback.message).toMatch(/LLM02 Sensitive Information Disclosure/)
  })

  it('confirms the reasoning on an exact answer', () => {
    expect(feedbackFor(VIGNETTES[0], 'LLM01').message).toMatch(/prompt injection/i)
  })

  it('is plainly wrong on a distant answer, and says what the case turns on', () => {
    const feedback = feedbackFor(VIGNETTES[4], 'LLM03')
    expect(feedback.result).toBe('distant')
    expect(feedback.message).toMatch(/Not this one/)
    expect(feedback.message).toMatch(/cost and availability/)
  })
})

describe('the six vignettes are interleaved, not blocked', () => {
  it('has six of them, each with a resolvable answer', () => {
    expect(VIGNETTES).toHaveLength(6)
    for (const vignette of VIGNETTES) {
      expect(riskByCode(vignette.answer)).toBeDefined()
      expect(riskByCode(vignette.answer)?.category).toBe(vignette.category)
    }
  })

  it('never places two consecutive vignettes in the same category', () => {
    for (let i = 1; i < VIGNETTES.length; i += 1) {
      expect(VIGNETTES[i].category).not.toBe(VIGNETTES[i - 1].category)
    }
  })
})

describe('the assessment surface honours the same gate (browser path is e2e)', () => {
  it('blocks completion until all six are answered, then records the module', async () => {
    const user = userEvent.setup()
    render(
      <ReferenceProvider>
        <TaggingAssessment />
      </ReferenceProvider>,
    )

    const finish = screen.getByRole('button', { name: 'Finish the map' })
    expect(finish).toBeDisabled()
    expect(screen.getByTestId('assessment-blocked')).toHaveTextContent('6 of 6 still unanswered')

    for (const [index, vignette] of VIGNETTES.entries()) {
      const panel = screen.getByTestId(`vignette-${vignette.n}`)
      await user.click(within(panel).getByRole('button', { name: new RegExp(vignette.answer) }))
      expect(within(panel).getByTestId('tag-feedback')).toHaveAttribute('data-result', 'exact')
      if (index < VIGNETTES.length - 1) {
        await user.click(screen.getByRole('button', { name: 'Next' }))
      }
    }

    expect(screen.queryByTestId('assessment-blocked')).not.toBeInTheDocument()
    await user.click(finish)

    expect(screen.getByTestId('assessment-complete')).toHaveAttribute('data-score', '100')
    expect(useProgress.getState().completedModules.m1).toBe(true)
    expect(useProgress.getState().scores.m1).toBe(100)
  })

  it('commits an answer once, so a near miss cannot be quietly retried', async () => {
    const user = userEvent.setup()
    render(
      <ReferenceProvider>
        <TaggingAssessment />
      </ReferenceProvider>,
    )

    const panel = screen.getByTestId('vignette-1')
    await user.click(within(panel).getByRole('button', { name: /LLM02/ }))

    expect(within(panel).getByTestId('tag-feedback')).toHaveAttribute('data-result', 'adjacent')
    expect(within(panel).getByRole('button', { name: /LLM01/ })).toBeDisabled()
  })
})

describe('completion is gated on every vignette being answered', () => {
  it('is incomplete while one is missing, and scores with half credit for near misses', () => {
    const partial = Object.fromEntries(
      VIGNETTES.slice(0, VIGNETTES.length - 1).map((v) => [v.id, v.answer]),
    )
    expect(isComplete(partial)).toBe(false)

    const allExact = Object.fromEntries(VIGNETTES.map((v) => [v.id, v.answer]))
    expect(isComplete(allExact)).toBe(true)
    expect(scoreAnswers(allExact)).toBe(100)

    const oneNearMiss = { ...allExact, [VIGNETTES[0].id]: 'LLM02' as const }
    expect(scoreAnswers(oneNearMiss)).toBe(92)
  })
})
