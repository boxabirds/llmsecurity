/**
 * Story 1 (task 1.5) — Module 0 on a mobile viewport.
 *
 * Verifies the trifecta builder and the token stream stay usable on a phone:
 * legs are tap chips (no drag), the danger indicator and its explanation stack
 * below rather than sitting alongside, and the wide token stream scrolls inside
 * its own container so the page never scrolls sideways.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrifectaBuilder } from './TrifectaBuilder'
import { TokenStreamViz } from './TokenStreamViz'
import { CONTEXT_SEGMENTS } from './DiscoveryFlow'
import { ReferenceProvider } from '../../references/ReferenceProvider'
import { useProgress, emptyProgress } from '../../state/progress'
import { setViewportWidth } from '../../test/setup'

beforeEach(() => {
  useProgress.setState({ ...emptyProgress() })
  setViewportWidth(390)
})

function withRefs(ui: React.ReactNode) {
  return render(<ReferenceProvider>{ui}</ReferenceProvider>)
}

describe('the trifecta legs are operable by tap, with no drag', () => {
  it('adds and removes each leg by tapping a chip', async () => {
    const user = userEvent.setup()
    withRefs(<TrifectaBuilder />)

    const chip = screen.getByRole('button', { name: /access to private data/i })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('uses no drag-and-drop handlers anywhere in the builder', () => {
    const source = readFileSync('src/modules/m0/TrifectaBuilder.tsx', 'utf8')
    expect(source).not.toMatch(/onDragStart|onDragOver|onDrop|draggable/)
  })

  it('still arms only on the third leg at a phone width', async () => {
    const user = userEvent.setup()
    withRefs(<TrifectaBuilder />)

    await user.click(screen.getByRole('button', { name: /access to private data/i }))
    await user.click(screen.getByRole('button', { name: /untrusted content/i }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'false')

    await user.click(screen.getByRole('button', { name: /external communication/i }))
    expect(screen.getByTestId('danger-indicator')).toHaveAttribute('data-armed', 'true')
    expect(screen.getByTestId('danger-explanation')).toBeVisible()
  })
})

describe('the token stream is confined to its own scroll container', () => {
  it('renders inside a horizontally scrollable region', () => {
    withRefs(<TokenStreamViz segments={CONTEXT_SEGMENTS} />)

    const stream = screen.getByTestId('token-stream')
    expect(stream.closest('.scroll-x')).not.toBeNull()
  })

  it('collapses to a single column at narrow widths', () => {
    const css = readFileSync('src/modules/m0/m0.css', 'utf8')
    const mediaIndex = css.search(/@media \(max-width: \d+px\)/)
    expect(mediaIndex).toBeGreaterThan(-1)
    expect(css.slice(mediaIndex)).toMatch(/grid-template-columns:\s*1fr/)
  })
})
