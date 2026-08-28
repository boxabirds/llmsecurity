/**
 * Story 7 — Module 4 replay engine (m4d.replay_engine), TC-04..TC-05.
 *
 * The payoff of the course so far: the learner's own exploit is re-run against
 * the defenses they chose, and either fails or breaches — a breach is shown as
 * a consequence to learn from, never as an error.
 */
import { test, expect } from '@playwright/test'

test.describe('Module 4 replay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m4')
  })

  test('TC-04 a sufficient defense makes the earlier exploit fail', async ({ page }) => {
    // Cut the outbound channel in the defense-in-depth stack.
    await page.getByRole('button', { name: /Egress allowlist/ }).click()
    await expect(page.getByTestId('risk-score')).toHaveAttribute('data-score', '65')

    await page.getByRole('button', { name: 'Replay the attack' }).click()

    const result = page.getByTestId('replay-result')
    await expect(result).toHaveAttribute('data-blocked', 'true')
    await expect(result).toContainText('Contained')
    await expect(result).toContainText('nowhere to go')
  })

  test('TC-05 a too-weak pattern lets the attack through as a consequence, not an error', async ({
    page,
  }) => {
    // Open the disclosure and choose a pattern that constrains control flow but
    // still permits the tainted value to ride a planned send.
    await page.getByTestId('more-patterns').click()
    await page.getByRole('button', { name: /Plan-Then-Execute/ }).click()

    await expect(page.getByTestId('tradeoff-readout')).toBeVisible()

    await page.getByRole('button', { name: 'Replay the attack' }).click()

    const result = page.getByTestId('replay-result')
    await expect(result).toHaveAttribute('data-blocked', 'false')
    await expect(result).toContainText('Exposed')
    // A breach is a lesson, not a failure state.
    await expect(page.locator('[role="alert"]')).toHaveCount(0)

    // The learner revises: adding egress control now blocks the same exploit.
    await page.getByRole('button', { name: /Egress allowlist/ }).click()
    await page.getByRole('button', { name: 'Replay the attack' }).click()
    await expect(page.getByTestId('replay-result')).toHaveAttribute('data-blocked', 'true')
  })

  test('the mastery gate needs both a working defense and deterministic reasoning', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Egress allowlist/ }).click()

    // Reasoning that only says "safer" is refused.
    await page.getByTestId('justification-input').fill('It is much safer now.')
    await page.getByRole('button', { name: 'Check my answer' }).click()
    await expect(page.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'false')

    await page
      .getByTestId('justification-input')
      .fill('The untrusted value cannot reach the send tool because that data flow is structurally cut.')
    await page.getByRole('button', { name: 'Check my answer' }).click()
    await expect(page.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'true')
  })
})
