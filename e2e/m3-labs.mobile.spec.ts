/**
 * Story 4 (task 4.7) — Module 3 on a mobile viewport.
 *
 * The three labs stack rather than sitting side by side, the 1000-document
 * corpus scrolls vertically, wide output is confined to its own container, and
 * the ledger remains reachable — all by tap.
 */
import { test, expect } from '@playwright/test'

test.describe('Module 3 on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m3')
  })

  test('all three labs stack vertically and the page never scrolls sideways', async ({ page }) => {
    await expect(page.locator('.layout')).toHaveAttribute('data-layout', 'single-column')

    // On a phone the segmented control is replaced by a stacked list, so every
    // lab is reachable by scrolling rather than by hunting for a tab.
    const shell = page.getByTestId('lab-shell')
    await expect(shell).toHaveAttribute('data-layout', 'stacked')
    await expect(page.getByTestId('lab-tab-rag')).toHaveCount(0)

    await expect(page.getByTestId('suffix-lab')).toBeVisible()
    await expect(page.getByTestId('rag-lab')).toBeVisible()
    await expect(page.getByTestId('mcp-lab')).toBeVisible()

    const noSidewaysScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    )
    expect(noSidewaysScroll).toBe(true)
  })

  test('the poisoned corpus scrolls vertically within the lab', async ({ page }) => {
    // The corpus is behind a disclosure so a thousand rows do not land on a
    // phone screen unasked.
    await page.getByRole('group').filter({ hasText: 'Inspect the corpus' }).first().click()

    const corpus = page.getByTestId('rag-corpus-list')
    await expect(corpus).toBeVisible()

    // The list is its own scroll region, so the page does not grow sideways.
    const overflows = await corpus.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.overflowY === 'auto' || style.overflowY === 'scroll' || el.scrollHeight > el.clientHeight
    })
    expect(overflows).toBe(true)
  })

  test('the ledger stays reachable while working through the labs', async ({ page }) => {
    await expect(page.getByTestId('ledger')).toBeVisible()
    await expect(page.getByTestId('ledger-pending-suffix')).toBeVisible()
  })
})
