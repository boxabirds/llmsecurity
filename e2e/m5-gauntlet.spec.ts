/**
 * Story 5 — the guardrail gauntlet (m5d.gauntlet), TC-01..TC-03.
 *
 * The emotional arc is the lesson, so this drives the real journey: commit to a
 * prediction, attack until something lands, then meet the framing that says
 * unsolved is not hopeless.
 */
import { test, expect } from '@playwright/test'

test.describe('Module 5 gauntlet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m5')
  })

  test('TC-01 the prediction is committed before any attempt', async ({ page }) => {
    await expect(page.getByTestId('prediction-beat')).toBeVisible()
    // No attacking is possible until a prediction is on record.
    await expect(page.getByRole('button', { name: 'Try a plain payload' })).toHaveCount(0)

    await page.getByTestId('prediction-input').fill('25')
    await page.getByRole('button', { name: 'Save my prediction' }).click()

    await expect(page.getByTestId('prediction-saved')).toContainText('25')
    await expect(page.getByRole('button', { name: 'Try a plain payload' })).toBeVisible()
  })

  test('TC-02 persistence gets through and the success curve rises', async ({ page }) => {
    await page.getByTestId('prediction-input').fill('25')
    await page.getByRole('button', { name: 'Save my prediction' }).click()

    // Fragmenting the instruction defeats the filter structurally, first try.
    await page.getByRole('button', { name: 'Try splitting it up' }).click()

    await expect(page.getByTestId('attempt-count')).toHaveText('1')
    await expect(page.getByTestId('success-count')).toHaveText('1')
    await expect(page.getByTestId('success-rate')).toHaveText('100%')
    await expect(page.getByTestId('success-chart')).toBeVisible()
    await expect(page.getByTestId('attempt-reason')).toContainText('reassembles the intent')
  })

  test('TC-03 the closing framing says unsolved is not hopeless', async ({ page }) => {
    await page.getByTestId('prediction-input').fill('25')
    await page.getByRole('button', { name: 'Save my prediction' }).click()
    await page.getByRole('button', { name: 'Try splitting it up' }).click()
    await page.getByRole('button', { name: 'I have seen enough' }).click()

    const framing = page.getByTestId('framing-card')
    await expect(framing).toBeVisible()
    await expect(framing).toContainText('Unsolved is not hopeless')
    // It contrasts the learner's own prediction with what actually happened.
    await expect(framing).toContainText('You predicted 25 attempts')
  })

  test('the critique gate demands the structural flaw', async ({ page }) => {
    await page.getByTestId('critique-input').fill('Their model is just not good enough yet.')
    await page.getByRole('button', { name: 'Submit my critique' }).click()
    await expect(page.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'false')

    await page
      .getByTestId('critique-input')
      .fill(
        'The flaw is structural: a probabilistic filter facing unlimited attempts loses eventually.',
      )
    await page.getByRole('button', { name: 'Submit my critique' }).click()
    await expect(page.getByTestId('mastery-result')).toHaveAttribute('data-passed', 'true')
  })
})
