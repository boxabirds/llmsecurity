/**
 * Story 13 — assessment engine (TC-01..TC-05) and calibration mirror (TC-06..TC-07).
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  retrievalOpportunityFor,
  selectInterleavedItem,
  isInterleavedOrder,
  requiresGeneration,
  satisfiesGenerationRule,
  grade,
  gradeOrRetry,
  calibrationView,
  calibrationGap,
  type AssessmentItem,
  type Rubric,
} from './engine'
import { CalibrationMirror } from './CalibrationMirror'

const bank: AssessmentItem[] = [
  { id: 'm0-trifecta', moduleId: 'm0', kind: 'classify', prompt: 'Is this system trifecta-complete?' },
  { id: 'm1-tag', moduleId: 'm1', kind: 'tag', prompt: 'Tag this incident with an OWASP id.' },
  {
    id: 'm2-exploit',
    moduleId: 'm2',
    kind: 'achieve',
    prompt: 'Achieve exfiltration and name the leg to cut.',
    loadBearing: true,
  },
]

const rubric: Rubric = {
  keywords: ['structural', 'adaptive', 'fragmentation'],
  minScore: 2 / 3,
}

describe('TC-01 every interaction offers a low-stakes retrieval opportunity', () => {
  it('turns any item into a low-stakes retrieval prompt', () => {
    const opportunity = retrievalOpportunityFor(bank[0])
    expect(opportunity.lowStakes).toBe(true)
    expect(opportunity.prompt).toBe('Is this system trifecta-complete?')
  })
})

describe('TC-02 later modules draw on earlier concepts', () => {
  it('selects an item from an earlier module, preferring the longest spacing', () => {
    const item = selectInterleavedItem(bank, 'm4')
    expect(item?.moduleId).toBe('m0')
  })

  it('returns null for the first module, which has nothing earlier to interleave', () => {
    expect(selectInterleavedItem(bank, 'm0')).toBeNull()
  })

  it('detects when consecutive items share a category', () => {
    expect(isInterleavedOrder([{ category: 'a' }, { category: 'b' }, { category: 'a' }])).toBe(true)
    expect(isInterleavedOrder([{ category: 'a' }, { category: 'a' }])).toBe(false)
  })
})

describe('TC-03 load-bearing concepts are assessed by generation', () => {
  it('flags a load-bearing item as requiring generation', () => {
    expect(requiresGeneration(bank[2])).toBe(true)
    expect(satisfiesGenerationRule(bank[2])).toBe(true)
  })

  it('rejects a load-bearing item that offers only recognition', () => {
    const recognitionOnly: AssessmentItem = {
      id: 'bad',
      moduleId: 'm5',
      kind: 'classify',
      prompt: 'Pick the right answer',
      loadBearing: true,
    }
    expect(satisfiesGenerationRule(recognitionOnly)).toBe(false)
  })

  it('allows recognition for items that are not load-bearing', () => {
    expect(satisfiesGenerationRule(bank[1])).toBe(true)
  })
})

describe('TC-04 why-prompts are graded on reasoning against a rubric', () => {
  it('scores the fraction of rubric concepts the answer engages with', () => {
    expect(grade('The flaw is structural, not incidental', rubric)).toBeCloseTo(1 / 3)
    expect(
      grade('A structural weakness that adaptive attackers beat by fragmentation', rubric),
    ).toBe(1)
  })

  it('passes only when the answer clears the rubric threshold', () => {
    const weak = gradeOrRetry('It is bad', rubric)
    expect(weak.status).toBe('graded')
    expect(weak.passed).toBe(false)
    expect(weak.guidance).toMatch(/did not engage with/)

    const strong = gradeOrRetry(
      'The weakness is structural: an adaptive attacker defeats it with fragmentation.',
      rubric,
    )
    expect(strong.passed).toBe(true)
    expect(strong.matched).toEqual(['structural', 'adaptive', 'fragmentation'])
  })
})

describe('TC-05 an empty or unparseable answer is never silently passed', () => {
  it('returns a retry with specific guidance rather than a grade', () => {
    for (const answer of ['', '   ', '.']) {
      const outcome = gradeOrRetry(answer, rubric)
      expect(outcome.status).toBe('retry')
      expect(outcome.passed).toBeUndefined()
      expect(outcome.guidance).toMatch(/at least a sentence/i)
    }
  })
})

describe('TC-06 the calibration mirror shows predicted against actual', () => {
  it('renders both figures and the signed gap', () => {
    render(<CalibrationMirror calibration={{ predicted: 90, actual: 55 }} />)

    expect(screen.getByTestId('calibration-readout')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByTestId('calibration-gap')).toHaveTextContent('+35')
    expect(screen.getByText(/more confident than your result/i)).toBeInTheDocument()
  })

  it('computes the gap as predicted minus actual', () => {
    expect(calibrationGap({ predicted: 40, actual: 70 })).toBe(-30)
  })
})

describe('TC-07 with no data the mirror says so rather than showing a zero', () => {
  it('renders an explanatory no-data note', () => {
    render(<CalibrationMirror calibration={null} />)

    expect(calibrationView(null)).toBe('no-data')
    expect(screen.getByTestId('calibration-no-data')).toHaveTextContent('No data yet')
    expect(screen.queryByTestId('calibration-readout')).not.toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })
})
