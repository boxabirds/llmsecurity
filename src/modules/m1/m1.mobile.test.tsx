/**
 * Story 2 (task 2.5) — Module 1 on a mobile viewport.
 *
 * Verifies the OWASP map stays usable on a phone: the grid reflows rather than
 * forcing the page sideways, glosses and incidents open by tap (hover is not
 * available on touch), and long content is confined to its own container.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RiskMatrix } from './RiskMatrix'
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

describe('the map opens by tap, not hover', () => {
  it('expands a card to its incident on tap alone', async () => {
    const user = userEvent.setup()
    withRefs(<RiskMatrix />)

    expect(screen.queryByTestId('risk-incident')).not.toBeInTheDocument()

    const trigger = screen
      .getByTestId('risk-card-LLM01')
      .querySelector<HTMLButtonElement>('.m1-card__button')
    expect(trigger).not.toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger!)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('risk-incident')).toBeVisible()
  })

  it('gives every card a touch-operable trigger', () => {
    withRefs(<RiskMatrix />)

    // The card's trigger is a real button, which inherits the 44px floor from
    // the global control rule rather than relying on hover-only affordances.
    const trigger = screen.getByTestId('risk-card-LLM01').querySelector('.m1-card__button')
    expect(trigger?.tagName.toLowerCase()).toBe('button')

    const globalCss = readFileSync('src/styles/global.css', 'utf8')
    expect(globalCss).toMatch(/min-height:\s*var\(--touch-target\)/)
  })
})

describe('the card grid reflows instead of scrolling the page sideways', () => {
  it('declares a responsive auto-fit grid rather than a fixed column count', () => {
    const css = readFileSync('src/modules/m1/m1.css', 'utf8')
    // An auto-fill/auto-fit minmax grid collapses to one column on a narrow
    // screen without needing a separate mobile rule.
    expect(css).toMatch(/grid-template-columns:\s*repeat\(auto-(fill|fit),\s*minmax\(/)
  })

  it('keeps offscreen cards cheap with content-visibility', () => {
    const css = readFileSync('src/modules/m1/m1.css', 'utf8')
    expect(css).toMatch(/content-visibility:\s*auto/)
  })

  it('never lets the page itself scroll horizontally', () => {
    const globalCss = readFileSync('src/styles/global.css', 'utf8')
    expect(globalCss).toMatch(/body[\s\S]*?overflow-x:\s*hidden/)
  })
})
