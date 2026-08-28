/**
 * Story 12 — responsive and touch layer (x5d.responsive_touch), TC-09..TC-14.
 *
 * jsdom performs no layout, so size and overflow rules are verified against the
 * declared CSS (the rule that ships) plus the DOM contract, rather than against
 * rendered pixels. Breakpoint behaviour is verified through real rendering.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ResponsiveLayout } from './ResponsiveLayout'
import { ChipToggle, ScrollX, TouchTarget, MIN_TOUCH_PX } from './TouchTarget'
import { breakpointFor, MOBILE_MAX_WIDTH, TABLET_MIN_WIDTH, DESKTOP_MIN_WIDTH } from './breakpoints'
import { contrastRatio, extractHexTokens, AA_TEXT_RATIO, AA_UI_RATIO } from '../a11y/contrast'
import { setViewportWidth } from '../test/setup'

function readSrc(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
}

const panes = {
  rail: <p>Module rail</p>,
  stage: <p>Stage content</p>,
  aside: <p>Concept inspector</p>,
  topBar: <p>Top app bar</p>,
  bottomBar: <p>Bottom navigation</p>,
}

describe('TC-09 below the mobile breakpoint the layout is a single column', () => {
  it('renders one column with the top and bottom bars, hiding side panes', () => {
    setViewportWidth(390)
    const { container } = render(<ResponsiveLayout {...panes} />)

    const layout = container.querySelector('.layout')
    expect(layout).toHaveAttribute('data-layout', 'single-column')
    expect(screen.getByText('Top app bar')).toBeInTheDocument()
    expect(screen.getByText('Bottom navigation')).toBeInTheDocument()
    expect(screen.queryByText('Module rail')).not.toBeInTheDocument()
    expect(screen.queryByText('Concept inspector')).not.toBeInTheDocument()
  })

  it('classifies widths at the breakpoint edges', () => {
    expect(breakpointFor(MOBILE_MAX_WIDTH)).toBe('mobile')
    expect(breakpointFor(TABLET_MIN_WIDTH)).toBe('tablet')
    expect(breakpointFor(DESKTOP_MIN_WIDTH - 1)).toBe('tablet')
    expect(breakpointFor(DESKTOP_MIN_WIDTH)).toBe('desktop')
  })
})

describe('TC-10 at desktop the full multi-pane layout is presented', () => {
  it('renders rail, stage and aside together', () => {
    setViewportWidth(1280)
    const { container } = render(<ResponsiveLayout {...panes} />)

    expect(container.querySelector('.layout')).toHaveAttribute('data-layout', 'multi-pane')
    expect(screen.getByText('Module rail')).toBeInTheDocument()
    expect(screen.getByText('Stage content')).toBeInTheDocument()
    expect(screen.getByText('Concept inspector')).toBeInTheDocument()
  })
})

describe('TC-11 compose interactions work by tap, with no drag required', () => {
  function Legs() {
    const [selected, setSelected] = useState<string[]>([])
    const toggle = (l: string) =>
      setSelected((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]))
    return (
      <>
        {['private data', 'external comms'].map((l) => (
          <ChipToggle key={l} label={l} selected={selected.includes(l)} onToggle={() => toggle(l)} />
        ))}
        <p>selected: {selected.length}</p>
      </>
    )
  }

  it('adds on tap and removes on a second tap', async () => {
    const user = userEvent.setup()
    render(<Legs />)

    const chip = screen.getByRole('button', { name: /private data/ })
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('selected: 1')).toBeInTheDocument()

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('selected: 0')).toBeInTheDocument()
  })

  it('uses no drag-and-drop event handlers on the compose control', () => {
    const source = readSrc('./TouchTarget.tsx')
    expect(source).not.toMatch(/onDragStart|onDrop|draggable/)
  })
})

describe('TC-12 wide content scrolls in its own container, never the page', () => {
  it('wraps wide content in a labelled scroll region', () => {
    render(
      <ScrollX label="Token stream">
        <div style={{ width: 4000 }}>very wide content</div>
      </ScrollX>,
    )
    const region = screen.getByRole('region', { name: 'Token stream' })
    expect(region).toHaveClass('scroll-x')
  })

  it('declares horizontal overflow on the container and forbids it on the page', () => {
    const globalCss = readSrc('../styles/global.css')
    expect(globalCss).toMatch(/body[\s\S]*?overflow-x:\s*hidden/)
    expect(globalCss).toMatch(/\.scroll-x\s*\{[\s\S]*?overflow-x:\s*auto/)
  })
})

describe('TC-13 targets clear 44px and the primary action sits in the thumb zone', () => {
  it('marks the primary action and separates the destructive one', () => {
    render(
      <>
        <TouchTarget primary onClick={() => {}}>
          Continue
        </TouchTarget>
        <TouchTarget destructive onClick={() => {}}>
          Reset
        </TouchTarget>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute('data-primary', 'true')
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveClass('touch-target--destructive')
  })

  it('declares the 44px floor in tokens and applies it to controls', () => {
    const tokens = readSrc('../styles/tokens.css')
    expect(tokens).toMatch(/--touch-target:\s*44px/)
    expect(MIN_TOUCH_PX).toBe(44)

    const touchCss = readSrc('./TouchTarget.css')
    expect(touchCss).toMatch(/\.touch-target\s*\{[\s\S]*?min-height:\s*var\(--touch-target\)/)
    expect(touchCss).toMatch(/\.chip-toggle\s*\{[\s\S]*?min-height:\s*var\(--touch-target\)/)

    const globalCss = readSrc('../styles/global.css')
    expect(globalCss).toMatch(/min-height:\s*var\(--touch-target\)/)
  })

  it('anchors the action bar to the bottom on mobile', () => {
    const touchCss = readSrc('./TouchTarget.css')
    const mobileBlock = touchCss.slice(touchCss.indexOf('@media (max-width: 767px)'))
    expect(mobileBlock).toMatch(/\.action-bar\s*\{[\s\S]*?position:\s*sticky/)
    expect(mobileBlock).toMatch(/bottom:\s*0/)
  })
})

describe('TC-14 the palette meets WCAG AA contrast', () => {
  const css = readSrc('../styles/tokens.css')
  const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'))
  const darkBlock = css.slice(css.indexOf(":root[data-theme='dark']"))
  const light = extractHexTokens(lightBlock)
  const dark = extractHexTokens(darkBlock)

  const themes: Array<[string, Record<string, string>]> = [
    ['light', light],
    ['dark', dark],
  ]

  it.each(themes)('%s: body text clears 4.5:1', (_name, t) => {
    expect(contrastRatio(t.text, t.bg)).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
    expect(contrastRatio(t['text-muted'], t.bg)).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
  })

  it.each(themes)('%s: status colours clear 4.5:1 on their own surfaces', (_name, t) => {
    expect(contrastRatio(t.danger, t['danger-soft'])).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
    expect(contrastRatio(t.safe, t['safe-soft'])).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
    expect(contrastRatio(t.warn, t['warn-soft'])).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
  })

  it.each(themes)('%s: accent button text and focus ring clear their thresholds', (_name, t) => {
    expect(contrastRatio(t.accent, t['accent-contrast'])).toBeGreaterThanOrEqual(AA_TEXT_RATIO)
    expect(contrastRatio(t.focus, t.bg)).toBeGreaterThanOrEqual(AA_UI_RATIO)
    expect(contrastRatio(t['border-strong'], t.bg)).toBeGreaterThanOrEqual(AA_UI_RATIO)
  })
})
