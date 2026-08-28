/**
 * Story 11 — reference UI (TC-01..TC-04, TC-09) and integrity gate (TC-05..TC-08).
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReferenceProvider } from './ReferenceProvider'
import { Citation, SectionAnchor, ModuleReferences, Bibliography } from './Citation'
import { checkIntegrity, collectCitedIds } from './integrity'
import { REFERENCES, type Reference } from './registry'
import { setViewportWidth } from '../test/setup'

function renderWithProvider(ui: React.ReactNode) {
  return render(<ReferenceProvider>{ui}</ReferenceProvider>)
}

describe('TC-01 activating a citation opens the full reference surface', () => {
  it('shows title, authors, summary, claim-as-used, caveat and a source link', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Citation id="camel" />)

    await user.click(screen.getByRole('button', { name: /opens reference panel/ }))

    const dialog = screen.getByRole('dialog', { name: 'Reference' })
    expect(dialog).toHaveTextContent('Defeating Prompt Injections by Design')
    expect(dialog).toHaveTextContent('Debenedetti')
    expect(dialog).toHaveTextContent('Summary')
    expect(dialog).toHaveTextContent('Claim as used here')
    expect(dialog).toHaveTextContent('Confidence & caveat')
    expect(dialog).toHaveTextContent('77% of tasks with provable security versus 84% undefended')

    const source = screen.getByRole('link', { name: /Open source/ })
    expect(source).toHaveAttribute('href', REFERENCES.camel.url)
    expect(source).toHaveAttribute('target', '_blank')
  })

  it('renders citations as interactive controls, never inert text', () => {
    renderWithProvider(<Citation id="echoleak" />)
    const chip = screen.getByRole('button', { name: /Reference: EchoLeak/ })
    expect(chip).toHaveAttribute('data-citation', 'echoleak')
  })
})

describe('TC-02 internal anchors open the same surface scoped to a section', () => {
  it('shows the section summary and a link into the research document', async () => {
    const user = userEvent.setup()
    renderWithProvider(<SectionAnchor anchor="6" />)

    await user.click(screen.getByRole('button', { name: /Research section 6/ }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Currently indefensible areas')
    expect(screen.getByRole('link', { name: /research document/ })).toBeInTheDocument()
  })
})

describe('TC-03 a module with no citations shows an explanatory empty note', () => {
  it('does not render a blank drawer', () => {
    renderWithProvider(<ModuleReferences ids={[]} />)
    expect(screen.getByTestId('empty-references')).toHaveTextContent(
      'This module cites no external sources.',
    )
  })

  it('lists every source a module touches, each openable', () => {
    renderWithProvider(<ModuleReferences ids={['echoleak', 'trifecta']} />)
    expect(screen.getAllByRole('button', { name: /opens reference panel/ })).toHaveLength(2)
  })

  it('aggregates a deduplicated global bibliography', () => {
    renderWithProvider(<Bibliography />)
    const entries = screen.getAllByRole('button', { name: /opens reference panel/ })
    expect(entries).toHaveLength(Object.keys(REFERENCES).length)
  })
})

describe('TC-04 an unresolved source shows a note, never inert text', () => {
  it('explains the reference could not be loaded and still offers the research doc', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Citation id="does-not-exist" />)

    await user.click(screen.getByRole('button', { name: /opens reference panel/ }))

    expect(screen.getByTestId('reference-unavailable')).toHaveTextContent('does-not-exist')
    expect(screen.getByRole('link', { name: /research document/ })).toBeInTheDocument()
  })
})

describe('TC-09 on mobile the surface is a bottom sheet and focus returns on dismiss', () => {
  it('renders as a sheet below the mobile breakpoint', async () => {
    setViewportWidth(390)
    const user = userEvent.setup()
    renderWithProvider(<Citation id="trifecta" />)

    await user.click(screen.getByRole('button', { name: /opens reference panel/ }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'sheet')
  })

  it('renders as a slide-over on desktop', async () => {
    setViewportWidth(1280)
    const user = userEvent.setup()
    renderWithProvider(<Citation id="trifecta" />)

    await user.click(screen.getByRole('button', { name: /opens reference panel/ }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-presentation', 'slideover')
  })

  it('returns focus to the originating citation when dismissed', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Citation id="trifecta" />)

    const chip = screen.getByRole('button', { name: /opens reference panel/ })
    await user.click(chip)
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(chip).toHaveFocus()
  })
})

describe('TC-05..TC-08 the integrity gate', () => {
  const good: Reference = REFERENCES.camel

  it('TC-05 fails when a cited id is absent from the registry', () => {
    const result = checkIntegrity({ camel: good }, ['camel', 'ghost-paper'])
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('citation "ghost-paper" is not in the reference registry')
  })

  it('TC-06 fails when an entry lacks a resolvable source or summary', () => {
    const brokenUrl = { ...good, id: 'x', url: 'not-a-url' }
    expect(checkIntegrity({ x: brokenUrl }, []).violations).toContain(
      'reference "x" has no resolvable URL',
    )

    const noSummary = { ...good, id: 'y', summary: '   ' }
    expect(checkIntegrity({ y: noSummary }, []).violations).toContain('reference "y" has no summary')

    const noCaveat = { ...good, id: 'z', caveat: '' }
    expect(checkIntegrity({ z: noCaveat }, []).violations).toContain(
      'reference "z" has no confidence/caveat line',
    )
  })

  it('TC-07 fails when a teaching claim ships uncited', () => {
    const result = checkIntegrity({ camel: good }, ['camel'], [
      'Guardrails stop all prompt injection.',
    ])
    expect(result.ok).toBe(false)
    expect(result.violations[0]).toMatch(/uncited/)
  })

  it('TC-08 passes for the shipped registry', () => {
    const result = checkIntegrity(REFERENCES, Object.keys(REFERENCES))
    expect(result.violations).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('collects cited ids from source text', () => {
    const ids = collectCitedIds([
      '<p>See <Citation id="echoleak" /> and <Citation id="camel">CaMeL</Citation>.</p>',
      '<Citation id="echoleak" />',
    ])
    expect(ids.sort()).toEqual(['camel', 'echoleak'])
  })
})
