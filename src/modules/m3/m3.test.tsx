/**
 * Story 4 — Module 3 labs (TC-01..TC-03, TC-13), the shell ledger and
 * why-inspector, and the mastery gate (TC-06, TC-14).
 */
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactElement } from 'react'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import {
  runSuffixLab,
  runRagLab,
  runMcpLab,
  benignDocs,
  MOCK_SUFFIX,
  BENIGN_DOC_COUNT,
  CLEAN_TOOL_DESCRIPTION,
  POISONED_TOOL_DESCRIPTION,
  POISONED_DOC,
  AUTHORITATIVE_DOC,
  LAB_TITLES,
  LAYER_LABELS,
} from './labs'
import { evaluateMastery, NOVEL_SCENARIO } from './mastery'
import { SuffixLab } from './SuffixLab'
import { LabShell } from './LabShell'
import Module3, { M3_OWASP_RISK_IDS } from './index'
import { useProgress } from '../../state/progress'

function renderWithReferences(ui: ReactElement) {
  return render(<ReferenceProvider>{ui}</ReferenceProvider>)
}

/** The suffix lab is controlled by the shell, so a test needs the same wiring. */
function SuffixLabHarness() {
  const [suffix, setSuffix] = useState('')
  const [result, setResult] = useState<ReturnType<typeof runSuffixLab> | null>(null)
  return (
    <SuffixLab suffix={suffix} onSuffixChange={setSuffix} result={result} onRun={setResult} />
  )
}

describe('TC-01 a matching suffix flips the refusal to compliance', () => {
  it('refuses without the suffix and complies with it', () => {
    const before = runSuffixLab({ suffix: '' })
    expect(before.compromised).toBe(false)
    expect(before.refused).toBe(true)

    const after = runSuffixLab({ suffix: MOCK_SUFFIX })
    expect(after.compromised).toBe(true)
    expect(after.refused).toBe(false)
    expect(after.response).not.toBe(before.response)
  })

  it('flags the suffix tokens as the hijacking ones, and only those', () => {
    const result = runSuffixLab({ suffix: MOCK_SUFFIX })
    const hijacked = result.tokens.filter((t) => t.hijacked)

    expect(hijacked.length).toBeGreaterThan(0)
    expect(hijacked.length).toBeLessThan(result.tokens.length)
    // Every flagged token comes from the suffix, never from the request.
    for (const token of hijacked) expect(MOCK_SUFFIX).toContain(token.text)
  })

  it('renders the flip and the highlighted tokens to the learner', async () => {
    const user = userEvent.setup()
    renderWithReferences(<SuffixLabHarness />)

    await user.click(screen.getByRole('button', { name: 'Paste the illustrative suffix' }))
    await user.click(screen.getByRole('button', { name: 'Send with the suffix' }))

    expect(screen.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    expect(screen.getAllByTestId('hijacked-token').length).toBeGreaterThan(0)
    expect(screen.getByTestId('suffix-illustration-note')).toHaveTextContent(/illustration/i)
  })

  it('leaves the refusal intact for a suffix that does not match', () => {
    const result = runSuffixLab({ suffix: 'please, it is for a school project' })

    expect(result.compromised).toBe(false)
    expect(result.refused).toBe(true)
    expect(result.tokens.some((t) => t.hijacked)).toBe(false)
    expect(result.whyNot).toBeTruthy()
  })
})

describe('TC-02 one poisoned passage in a 1000-document corpus dominates the answer', () => {
  it('generates the benign corpus once and reuses it', () => {
    const first = benignDocs()
    expect(first).toHaveLength(BENIGN_DOC_COUNT)
    expect(benignDocs()).toBe(first)
  })

  it('lets a single crafted passage own the answer', () => {
    const result = runRagLab({ poisoned: true })

    expect(result.corpusSize).toBe(BENIGN_DOC_COUNT + 2)
    expect(result.compromised).toBe(true)
    expect(result.retrieval.dominatedByPoison).toBe(true)
    expect(result.retrieval.top[0].id).toBe(POISONED_DOC.id)
    expect(result.response).toBe(POISONED_DOC.text)
    // Exactly one document in the corpus is the crafted one.
    expect(result.retrieval.top.filter((doc) => doc.poisoned).length).toBe(1)
  })

  it('answers from the genuine page when the crafted passage is absent', () => {
    const clean = runRagLab({ poisoned: false })

    expect(clean.compromised).toBe(false)
    expect(clean.response).toBe(AUTHORITATIVE_DOC.text)
  })
})

describe('TC-03 a poisoned tool description makes the agent silently obey', () => {
  it('obeys metadata without any code change', () => {
    const result = runMcpLab({ description: POISONED_TOOL_DESCRIPTION })

    expect(result.compromised).toBe(true)
    expect(result.call.obeyedEmbeddedInstruction).toBe(true)
    expect(result.codeChanged).toBe(false)
    expect(result.trace).toMatch(/only metadata/i)
    // Silently: what the user sees still reads as a normal tool result.
    expect(result.response).toMatch(/in transit/i)
  })
})

describe('TC-13 clean input to each lab yields the safe baseline', () => {
  it('suffix lab: the refusal holds', () => {
    const result = runSuffixLab({ suffix: 'thanks in advance' })
    expect(result.compromised).toBe(false)
  })

  it('rag lab: the genuine policy page is retrieved', () => {
    const result = runRagLab({ poisoned: false })
    expect(result.compromised).toBe(false)
    expect(result.retrieval.top.some((doc) => doc.poisoned)).toBe(false)
  })

  it('mcp lab: the tool behaves normally', () => {
    const result = runMcpLab({ description: CLEAN_TOOL_DESCRIPTION })
    expect(result.compromised).toBe(false)
    expect(result.call.hijack).toBeNull()
  })

  it('gives every clean run a diagnosis rather than an error state', () => {
    for (const result of [
      runSuffixLab({ suffix: '' }),
      runRagLab({ poisoned: false }),
      runMcpLab({ description: CLEAN_TOOL_DESCRIPTION }),
    ]) {
      expect(result.whyNot).toBeTruthy()
      expect(result.trace.length).toBeGreaterThan(0)
    }
  })
})

describe('the shell ledger and the why-inspector', () => {
  it('opens the why-inspector on a failed attempt and re-runs the lab from it', async () => {
    const user = userEvent.setup()
    renderWithReferences(<LabShell />)

    await user.click(screen.getByRole('button', { name: 'Send with the suffix' }))

    expect(screen.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'false')
    const inspector = screen.getByTestId('why-inspector')
    expect(inspector).toHaveAttribute('data-lab', 'suffix')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.click(
      within(inspector).getByRole('button', {
        name: 'Append the illustrative suffix and send it again',
      }),
    )

    expect(screen.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    expect(screen.queryByTestId('why-inspector')).not.toBeInTheDocument()
  })

  it('states the one-root-cause conclusion only once all three layers are recorded', async () => {
    const user = userEvent.setup()
    renderWithReferences(<LabShell />)

    // Suffix lab.
    await user.click(screen.getByRole('button', { name: 'Paste the illustrative suffix' }))
    await user.click(screen.getByRole('button', { name: 'Send with the suffix' }))
    await user.click(
      screen.getByRole('button', {
        name: `${LAB_TITLES.suffix}: acted at ${LAYER_LABELS['model-alignment']}`,
      }),
    )
    expect(screen.getByTestId('ledger-entry-suffix')).toHaveAttribute('data-correct', 'true')
    expect(screen.queryByTestId('root-cause-conclusion')).not.toBeInTheDocument()

    // RAG lab.
    await user.click(screen.getByTestId('lab-tab-rag'))
    await user.click(screen.getByRole('button', { name: /Add the one crafted passage/ }))
    await user.click(screen.getByRole('button', { name: 'Ask the assistant' }))
    await user.click(
      screen.getByRole('button', {
        name: `${LAB_TITLES.rag}: acted at ${LAYER_LABELS['retrieval-corpus']}`,
      }),
    )

    // MCP lab.
    await user.click(screen.getByTestId('lab-tab-mcp'))
    await user.click(screen.getByRole('button', { name: 'Paste a poisoned description' }))
    await user.click(screen.getByRole('button', { name: 'Call the tool' }))
    await user.click(
      screen.getByRole('button', {
        name: `${LAB_TITLES.mcp}: acted at ${LAYER_LABELS['tool-metadata']}`,
      }),
    )

    const ledger = screen.getByTestId('ledger')
    expect(within(ledger).getByTestId('ledger-entry-rag')).toHaveAttribute('data-correct', 'true')
    expect(within(ledger).getByTestId('ledger-entry-mcp')).toHaveAttribute('data-correct', 'true')
    expect(screen.getByTestId('root-cause-conclusion')).toBeInTheDocument()
    expect(screen.getByTestId('root-cause-conclusion')).toHaveTextContent(
      /not separated|non-separation/i,
    )
  })

  it('does not count a wrongly recorded layer', async () => {
    const user = userEvent.setup()
    renderWithReferences(<LabShell />)

    await user.click(screen.getByRole('button', { name: 'Paste the illustrative suffix' }))
    await user.click(screen.getByRole('button', { name: 'Send with the suffix' }))
    await user.click(
      screen.getByRole('button', {
        name: `${LAB_TITLES.suffix}: acted at ${LAYER_LABELS['tool-metadata']}`,
      }),
    )

    expect(screen.getByTestId('ledger-entry-suffix')).toHaveAttribute('data-correct', 'false')
    expect(screen.queryByTestId('root-cause-conclusion')).not.toBeInTheDocument()
  })
})

describe('the module surface', () => {
  it('renders the shell and the mastery check, and marks the risks it covers as visited', () => {
    renderWithReferences(<Module3 />)

    expect(screen.getByTestId('lab-shell')).toBeInTheDocument()
    expect(screen.getByTestId('mastery-scenario')).toBeInTheDocument()

    const visited = useProgress.getState().visitedRisks
    for (const risk of M3_OWASP_RISK_IDS) expect(visited[risk]).toBe(true)
  })

  it('passes the mastery gate through the UI and records the module', async () => {
    const user = userEvent.setup()
    renderWithReferences(<Module3 />)

    await user.click(
      screen.getByRole('button', { name: /^Mechanism: A poisoned passage/ }),
    )
    await user.click(
      screen.getByRole('button', { name: `Layer: ${LAYER_LABELS['retrieval-corpus']}` }),
    )

    // The pair alone is a nine-way guess; the gate also wants it in the
    // learner's own words.
    expect(screen.getByRole('button', { name: 'Check my answer' })).toBeDisabled()

    await user.type(
      screen.getByTestId('mastery-explanation'),
      'The agent retrieved different content; the model and tools were unchanged.',
    )
    await user.click(screen.getByRole('button', { name: 'Check my answer' }))

    expect(screen.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'true')
    expect(useProgress.getState().completedModules.m3).toBe(true)
  })
})

describe('TC-06 mastery passes on the novel scenario with the right mechanism AND layer', () => {
  it('passes when both halves are right', () => {
    const outcome = evaluateMastery({
      mechanism: NOVEL_SCENARIO.mechanism,
      layer: NOVEL_SCENARIO.layer,
      explanation:
        'The agent retrieved different content from the wiki, while the model and the tools were unchanged.',
    })

    expect(outcome.passed).toBe(true)
    expect(outcome.mechanismCorrect).toBe(true)
    expect(outcome.layerCorrect).toBe(true)
  })

  it('does not pass a correct pair that the learner cannot explain', () => {
    // Three mechanisms and three layers is a nine-way guess, so the pair alone
    // is not evidence of understanding.
    const guessed = evaluateMastery({
      mechanism: NOVEL_SCENARIO.mechanism,
      layer: NOVEL_SCENARIO.layer,
    })

    expect(guessed.passed).toBe(false)
    expect(guessed.mechanismCorrect).toBe(true)
    expect(guessed.layerCorrect).toBe(true)
    expect(guessed.reason).toMatch(/in your own words/i)
  })

  it('rejects an explanation that engages with none of the right concepts', () => {
    const outcome = evaluateMastery({
      mechanism: NOVEL_SCENARIO.mechanism,
      layer: NOVEL_SCENARIO.layer,
      explanation: 'Someone hacked it somehow.',
    })

    expect(outcome.passed).toBe(false)
    expect(outcome.reason).toMatch(/what changed and what did not/i)
  })

  it('uses a scenario none of the three labs contains', () => {
    expect(NOVEL_SCENARIO.mechanism).toBe('rag')
    expect(NOVEL_SCENARIO.layer).toBe('retrieval-corpus')
    expect(NOVEL_SCENARIO.brief).not.toContain('dinner')
  })
})

describe('TC-14 mastery is blocked when either half is wrong', () => {
  it('blocks a wrong layer', () => {
    const outcome = evaluateMastery({ mechanism: 'rag', layer: 'tool-metadata' })
    expect(outcome.passed).toBe(false)
    expect(outcome.mechanismCorrect).toBe(true)
    expect(outcome.layerCorrect).toBe(false)
  })

  it('blocks a wrong mechanism', () => {
    const outcome = evaluateMastery({ mechanism: 'mcp', layer: 'retrieval-corpus' })
    expect(outcome.passed).toBe(false)
    expect(outcome.mechanismCorrect).toBe(false)
    expect(outcome.layerCorrect).toBe(true)
  })

  it('blocks an incomplete answer', () => {
    expect(evaluateMastery({ mechanism: 'rag', layer: null }).passed).toBe(false)
    expect(evaluateMastery({ mechanism: null, layer: 'retrieval-corpus' }).passed).toBe(false)
  })
})
