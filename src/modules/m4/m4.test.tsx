/**
 * Story 7 — Module 4 defense interactives (TC-01..TC-03) and mastery gate
 * (TC-06, TC-07). Replay is covered end to end in e2e/m4-replay.spec.ts.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { useState } from 'react'
import { setViewportWidth } from '../../test/setup'
import { CaMeLFlow, DefensePatternPicker, ArchitectureBuilder } from './DefenseSims'
import { replay } from './replay'
import { evaluateMastery } from './mastery'
import { riskScore, PATTERNS, type LayerId, type PatternId } from './patterns'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import { useProgress, emptyProgress } from '../../state/progress'

beforeEach(() => useProgress.setState({ ...emptyProgress() }))

function withRefs(ui: React.ReactNode) {
  return render(<ReferenceProvider>{ui}</ReferenceProvider>)
}

describe('TC-01 routing a tainted value is structurally blocked', () => {
  it('blocks the flow once the value is tagged untrusted', async () => {
    const user = userEvent.setup()
    withRefs(<CaMeLFlow />)

    await user.click(screen.getByRole('button', { name: /tagged trusted/ }))
    await user.click(screen.getByRole('button', { name: 'Route the value' }))

    const outcome = screen.getByTestId('camel-outcome')
    expect(outcome).toHaveAttribute('data-blocked', 'true')
    expect(outcome).toHaveTextContent(/structurally impossible/i)
  })

  it('allows the same tool call for a trusted value, so the rule constrains flow not tools', async () => {
    const user = userEvent.setup()
    withRefs(<CaMeLFlow />)

    await user.click(screen.getByRole('button', { name: 'Route the value' }))
    expect(screen.getByTestId('camel-outcome')).toHaveAttribute('data-blocked', 'false')
  })
})

describe('TC-02 choosing a pattern updates the two-axis trade-off readout', () => {
  function Picker() {
    const [selected, setSelected] = useState<PatternId | null>(null)
    return <DefensePatternPicker selected={selected} onSelect={setSelected} />
  }

  it('shows the recommended pattern first and the rest behind a disclosure', () => {
    withRefs(<Picker />)

    expect(screen.getByRole('button', { name: /Dual LLM \(recommended\)/ })).toBeInTheDocument()
    // The other five are not presented all at once.
    expect(screen.getByTestId('more-patterns')).toBeInTheDocument()
    expect(screen.queryByTestId('tradeoff-readout')).not.toBeInTheDocument()
  })

  it('renders residual capability and residual risk for the chosen pattern', async () => {
    const user = userEvent.setup()
    withRefs(<Picker />)

    await user.click(screen.getByRole('button', { name: /Dual LLM \(recommended\)/ }))

    expect(screen.getByTestId('tradeoff-readout')).toBeInTheDocument()
    expect(screen.getByTestId('residual-capability')).toHaveValue(70)
    expect(screen.getByTestId('residual-risk')).toHaveValue(15)
  })

  it('models every one of the six patterns', () => {
    expect(PATTERNS).toHaveLength(6)
    expect(PATTERNS.map((p) => p.id).sort()).toEqual(
      [
        'action-selector',
        'code-then-execute',
        'context-minimization',
        'dual-llm',
        'llm-map-reduce',
        'plan-then-execute',
      ].sort(),
    )
  })
})

describe('TC-03 adding a layer updates the live risk score and names what it stops', () => {
  function Builder() {
    const [layers, setLayers] = useState<LayerId[]>([])
    return (
      <ArchitectureBuilder
        layers={layers}
        onToggleLayer={(id) =>
          setLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
        }
      />
    )
  }

  it('lowers the score and attributes the layer to an earlier attack', async () => {
    const user = userEvent.setup()
    withRefs(<Builder />)

    expect(screen.getByTestId('risk-score')).toHaveAttribute('data-score', '100')

    await user.click(screen.getByRole('button', { name: /Egress allowlist/ }))

    expect(screen.getByTestId('risk-score')).toHaveAttribute('data-score', '65')
    expect(screen.getByTestId('layer-attribution')).toHaveTextContent('Module 2')
  })

  it('never lets residual risk reach zero, because some of the problem is unsolved', () => {
    const everyLayer: LayerId[] = [
      'egress-allowlist',
      'provenance-tagging',
      'least-privilege-credentials',
      'human-approval',
      'guardrail-classifier',
    ]
    expect(riskScore(everyLayer)).toBeGreaterThan(0)
    expect(riskScore(everyLayer)).toBe(10)
  })
})

describe('the replay engine holds or breaches honestly', () => {
  it('blocks the exploit when the egress channel is cut', () => {
    const result = replay({ pattern: null, layers: ['egress-allowlist'] })
    expect(result.exploitBlocked).toBe(true)
    expect(result.reason).toMatch(/nowhere to go/i)
  })

  it('blocks it when the chosen pattern keeps untrusted text away from privileged actions', () => {
    expect(replay({ pattern: 'dual-llm', layers: [] }).exploitBlocked).toBe(true)
  })

  it('lets it through when the pattern constrains control flow but not the data sink', () => {
    const result = replay({ pattern: 'plan-then-execute', layers: [] })
    expect(result.exploitBlocked).toBe(false)
    expect(result.reason).toMatch(/not enough for this attack/i)
  })

  it('is fully exposed with no pattern and no egress control', () => {
    const result = replay({ pattern: null, layers: ['guardrail-classifier'] })
    expect(result.exploitBlocked).toBe(false)
    expect(result.reason).toMatch(/exactly as exploitable/i)
  })
})

describe('on a mobile viewport the defense interactives stay usable', () => {
  function Picker() {
    const [selected, setSelected] = useState<PatternId | null>(null)
    return <DefensePatternPicker selected={selected} onSelect={setSelected} />
  }

  it('shows one recommended choice rather than six at once (Hick)', () => {
    setViewportWidth(390)
    withRefs(<Picker />)

    // Only the recommended pattern is presented up front; the other five sit
    // behind a closed disclosure, so they are in the document but not shown.
    expect(screen.getByRole('button', { name: /Dual LLM \(recommended\)/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Plan-Then-Execute/ })).not.toBeVisible()
  })

  it('reveals the remaining patterns as tap chips when asked', async () => {
    setViewportWidth(390)
    const user = userEvent.setup()
    withRefs(<Picker />)

    await user.click(screen.getByTestId('more-patterns'))

    const other = screen.getByRole('button', { name: /Plan-Then-Execute/ })
    expect(other).toHaveAttribute('aria-pressed', 'false')
    await user.click(other)
    expect(other).toHaveAttribute('aria-pressed', 'true')
  })

  it('stacks the two-axis readout into one column on narrow screens', () => {
    const css = readFileSync('src/modules/m4/m4.css', 'utf8')
    const mobileBlock = css.slice(css.indexOf('@media (max-width: 767px)'))
    expect(mobileBlock).toMatch(/\.m4-readout__axis\s*\{[\s\S]*?grid-template-columns:\s*1fr/)
  })
})

describe('TC-06 mastery requires a working defense AND a deterministic justification', () => {
  it('passes when the exploit fails and the reasoning names the structural cut', () => {
    const outcome = evaluateMastery({
      config: { pattern: 'dual-llm', layers: ['egress-allowlist'] },
      justification:
        'The untrusted value cannot reach the send tool because that data flow is structurally cut.',
    })

    expect(outcome.passed).toBe(true)
    expect(outcome.reason).toMatch(/Correct/)
  })
})

describe('TC-07 mastery is blocked when either half is missing', () => {
  it('blocks while the learner own exploit still succeeds', () => {
    const outcome = evaluateMastery({
      config: { pattern: 'plan-then-execute', layers: [] },
      justification: 'The flow is structurally cut and the attacker cannot reach the tool.',
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/still succeeds/i)
  })

  it('blocks a justification that only says it is safer', () => {
    const outcome = evaluateMastery({
      config: { pattern: 'dual-llm', layers: ['egress-allowlist'] },
      justification: 'It is much safer now.',
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/deterministic/i)
  })

  it('asks for a sentence rather than grading an empty answer', () => {
    const outcome = evaluateMastery({
      config: { pattern: 'dual-llm', layers: ['egress-allowlist'] },
      justification: '  ',
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/at least a sentence/i)
  })
})
