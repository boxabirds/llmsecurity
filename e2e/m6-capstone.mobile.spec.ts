/**
 * Story 6 (task 6.5) — Module 6 on a mobile viewport.
 *
 * One decision per screen keeps the choice cost low on a phone, the exported
 * memo scrolls in its own container, and the whole capstone is completable by
 * tap.
 */
import { test, expect } from '@playwright/test'

const MOST_CAPABLE = ['vendor-api', 'full-inbox', 'send-and-act', 'open-egress', 'guardrail-only']

test.describe('Module 6 on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m6')
  })

  test('presents one decision at a time and completes by tap', async ({ page }) => {
    await expect(page.locator('.layout')).toHaveAttribute('data-layout', 'single-column')

    // Exactly one question is on screen at any moment.
    await expect(page.getByTestId('decision-question')).toHaveCount(1)

    for (let i = 0; i < MOST_CAPABLE.length; i += 1) {
      await page.getByTestId(`option-${MOST_CAPABLE[i]}`).tap()
      await page
        .getByRole('button', {
          name: i === MOST_CAPABLE.length - 1 ? 'See the outcome' : 'Next decision',
        })
        .tap()
    }

    await expect(page.getByTestId('full-circle-incident')).toBeVisible()

    await page
      .getByTestId('residual-risk-input')
      .fill('Guardrails will eventually be bypassed by a determined attacker.')
    await page.getByRole('button', { name: 'Finish my memo' }).tap()

    await expect(page.getByTestId('memo-result')).toHaveAttribute('data-passed', 'true')
  })

  test('the exported memo scrolls in its own container, not the page', async ({ page }) => {
    for (let i = 0; i < MOST_CAPABLE.length; i += 1) {
      await page.getByTestId(`option-${MOST_CAPABLE[i]}`).tap()
      await page
        .getByRole('button', {
          name: i === MOST_CAPABLE.length - 1 ? 'See the outcome' : 'Next decision',
        })
        .tap()
    }

    await page.getByTestId('residual-risk-input').fill('Supply-chain backdoors remain unverifiable.')
    await page.getByRole('button', { name: 'Finish my memo' }).tap()

    const memoExport = page.getByTestId('memo-export')
    await expect(memoExport).toBeVisible()

    // Pre-formatted text is wide by nature, so it must be contained.
    const scroller = page.locator('.scroll-x', { has: memoExport })
    await expect(scroller).toHaveCount(1)

    const noSidewaysScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    )
    expect(noSidewaysScroll).toBe(true)
  })
})
