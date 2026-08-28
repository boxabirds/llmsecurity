/**
 * Story 5 (task 5.5) — Module 5 on a mobile viewport.
 *
 * The gauntlet's success chart is wide by nature, so it must live in its own
 * scroll container while the page stays put; the primary attack action must sit
 * in the thumb zone; and the indefensible map must collapse to an accordion.
 */
import { test, expect } from '@playwright/test'

test.describe('Module 5 on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m5')
  })

  test('the gauntlet is playable by tap and the chart scrolls in its own container', async ({
    page,
  }) => {
    await expect(page.locator('.layout')).toHaveAttribute('data-layout', 'single-column')

    await page.getByTestId('prediction-input').fill('20')
    await page.getByRole('button', { name: 'Save my prediction' }).tap()
    await page.getByRole('button', { name: 'Try splitting it up' }).tap()

    const chart = page.getByTestId('success-chart')
    await expect(chart).toBeVisible()

    // The chart sits inside a horizontal scroll region…
    const scroller = page.locator('.scroll-x', { has: chart })
    await expect(scroller).toHaveCount(1)

    // …and the page itself does not scroll sideways.
    const noSidewaysScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    )
    expect(noSidewaysScroll).toBe(true)
  })

  test('the indefensible map works as an accordion', async ({ page }) => {
    const toggle = page.getByTestId('area-assembled-trifecta')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.tap()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('detail-assembled-trifecta')).toBeVisible()

    // Only one area is open at a time, so the page stays short on a phone.
    await page.getByTestId('area-adaptive-jailbreaks').tap()
    await expect(page.getByTestId('detail-assembled-trifecta')).toHaveCount(0)
  })

  test('the critique field and its action stay usable on a small screen', async ({ page }) => {
    const field = page.getByTestId('critique-input')
    await field.tap()
    await field.fill('The flaw is structural: a probabilistic filter loses to unlimited attempts.')

    const submit = page.getByRole('button', { name: 'Submit my critique' })
    await expect(submit).toBeVisible()
    await submit.tap()

    await expect(page.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'true')
  })
})
