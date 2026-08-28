/**
 * Module 0 — the discovery flow (m0d.discovery_flow), TC-01..TC-03.
 *
 * The whole point of the sequence is its order: scene, consequence, the
 * learner's own hypothesis, and only then the mechanism. These tests hold that
 * order, and hold the promise that a wrong hypothesis costs nothing.
 */
import { test, expect } from '@playwright/test'

test.describe('Module 0 cold open', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m0')
  })

  test('TC-01 the scene plays and nothing is explained before the reflective beat', async ({
    page,
  }) => {
    await expect(page.getByTestId('cold-open')).toBeVisible()
    await expect(page.getByTestId('leak-outcome')).toHaveCount(0)
    await expect(page.getByTestId('mechanism-explanation')).toHaveCount(0)

    await page.getByRole('button', { name: 'Ask the assistant to summarise' }).click()

    // The consequence lands: the assistant mailed the seeded balance to a stranger.
    const outcome = page.getByTestId('leak-outcome')
    await expect(outcome).toBeVisible()
    await expect(outcome).toContainText('collector@attacker.example')
    await expect(outcome).toContainText('GB29-8371-0022')

    // And still no explanation, and no token stream, before the beat.
    await expect(page.getByTestId('mechanism-explanation')).toHaveCount(0)
    await expect(page.getByTestId('token-stream')).toHaveCount(0)

    await page.getByRole('button', { name: 'Wait — what just happened?' }).click()
    const beat = page.getByTestId('reflective-beat')
    await expect(beat).toBeVisible()
    await expect(beat.getByRole('button')).toHaveCount(3)
    await expect(page.getByTestId('mechanism-explanation')).toHaveCount(0)
  })

  test('TC-02 answering correctly advances to the token stream', async ({ page }) => {
    await page.getByRole('button', { name: 'Ask the assistant to summarise' }).click()
    await page.getByRole('button', { name: 'Wait — what just happened?' }).click()

    await page
      .getByTestId('reflective-beat')
      .getByRole('button', { name: /the email sender/ })
      .click()

    const stream = page.getByTestId('token-stream')
    await expect(stream).toBeVisible()
    await expect(stream).toHaveAttribute('data-view', 'wished')

    await page.getByTestId('token-stream-toggle').click()
    await expect(page.getByTestId('token-stream')).toHaveAttribute('data-view', 'actual')
    await expect(page.getByTestId('mechanism-explanation')).toBeVisible()
  })

  test('TC-03 a wrong answer reveals the same thing, with no verdict', async ({ page }) => {
    await page.getByRole('button', { name: 'Ask the assistant to summarise' }).click()
    await page.getByRole('button', { name: 'Wait — what just happened?' }).click()

    await page
      .getByTestId('reflective-beat')
      .getByRole('button', { name: /the developer/ })
      .click()

    await expect(page.getByTestId('token-stream')).toBeVisible()
    await expect(page.getByTestId('mechanism-explanation')).toBeVisible()

    // Discovery-safe: no right/wrong modal, no alert, nothing to dismiss.
    await expect(page.locator('[role=alert]')).toHaveCount(0)
    await expect(page.locator('[role=dialog]')).toHaveCount(0)
  })

  test('the trifecta indicator arms only on the third leg', async ({ page }) => {
    const indicator = page.getByTestId('danger-indicator')
    await expect(indicator).toHaveAttribute('data-armed', 'false')

    await page.getByRole('button', { name: /access to private data/ }).click()
    await page.getByRole('button', { name: /exposure to untrusted content/ }).click()
    await expect(indicator).toHaveAttribute('data-armed', 'false')

    await page.getByRole('button', { name: /an external communication channel/ }).first().click()
    await expect(indicator).toHaveAttribute('data-armed', 'true')
    await expect(page.getByTestId('danger-explanation')).toContainText('All three at once')
  })
})
