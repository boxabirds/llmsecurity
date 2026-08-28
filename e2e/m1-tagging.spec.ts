/**
 * Story 2 — Module 1 tagging assessment (m1d.tagging_assessment),
 * TC-05..TC-08 and TC-10.
 *
 * The three-valued feedback is the whole design, so each branch is exercised in
 * the browser: exact, the near miss that names the confusion, and plainly wrong.
 */
import { test, expect, type Page } from '@playwright/test'
import { VIGNETTES } from '../src/modules/m1/tagging'

/** Picks the option chip for a risk code inside the vignette on screen. */
function option(page: Page, vignetteNumber: number, code: string) {
  return page.getByTestId(`vignette-${vignetteNumber}`).getByRole('button', { name: code })
}

function feedback(page: Page, vignetteNumber: number) {
  return page.getByTestId(`vignette-${vignetteNumber}`).getByTestId('tag-feedback')
}

test.describe('Module 1 tagging assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m1')
    await expect(page.getByTestId('vignette-1')).toBeVisible()
  })

  test('TC-05 an exact tag is accepted', async ({ page }) => {
    await option(page, 1, 'LLM01').click()

    const result = feedback(page, 1)
    await expect(result).toHaveAttribute('data-result', 'exact')
    await expect(result).toContainText('Exact')
  })

  test('TC-06 an adjacent tag gives a near-miss hint naming the confusion', async ({ page }) => {
    // LLM02 is the classic confusion for an injection vignette: the consequence
    // mistaken for the mechanism.
    await option(page, 1, 'LLM02').click()

    const result = feedback(page, 1)
    await expect(result).toHaveAttribute('data-result', 'adjacent')
    await expect(result).toContainText('Near miss')
    await expect(result).toContainText('LLM01 Prompt Injection')
    await expect(result).toContainText('LLM02 Sensitive Information Disclosure')
    await expect(result).toContainText('mechanism')
  })

  test('TC-07 a distant tag is plainly wrong', async ({ page }) => {
    await option(page, 1, 'LLM10').click()

    const result = feedback(page, 1)
    await expect(result).toHaveAttribute('data-result', 'distant')
    await expect(result).toContainText('Not this one')
  })

  test('TC-10 completion is blocked while any vignette is unanswered', async ({ page }) => {
    const finish = page.getByRole('button', { name: 'Finish the map' })
    await expect(finish).toBeDisabled()
    await expect(page.getByTestId('assessment-blocked')).toContainText('6 of 6 still unanswered')

    // Answer five of the six; the gate stays shut.
    for (const vignette of VIGNETTES.slice(0, VIGNETTES.length - 1)) {
      await option(page, vignette.n, vignette.answer).click()
      await page.getByRole('button', { name: 'Next', exact: true }).click()
    }

    await expect(page.getByTestId('assessment-blocked')).toContainText('1 of 6 still unanswered')
    await expect(finish).toBeDisabled()
    await expect(page.getByTestId('assessment-complete')).toHaveCount(0)
  })

  test('TC-08 tagging all six completes the module', async ({ page }) => {
    for (const [index, vignette] of VIGNETTES.entries()) {
      await option(page, vignette.n, vignette.answer).click()
      await expect(feedback(page, vignette.n)).toHaveAttribute('data-result', 'exact')
      if (index < VIGNETTES.length - 1) {
        await page.getByRole('button', { name: 'Next', exact: true }).click()
      }
    }

    await expect(page.getByTestId('assessment-blocked')).toHaveCount(0)

    const finish = page.getByRole('button', { name: 'Finish the map' })
    await expect(finish).toBeEnabled()
    await finish.click()

    const complete = page.getByTestId('assessment-complete')
    await expect(complete).toBeVisible()
    await expect(complete).toHaveAttribute('data-score', '100')
    await expect(complete).toContainText('6 of 6 placed exactly')

    // Completion is recorded in the shared progress store, not just on screen.
    const completed = await page.evaluate(() => {
      const raw = window.localStorage.getItem('llmsec.progress.v1')
      return raw ? (JSON.parse(raw) as { completedModules: Record<string, boolean> }) : null
    })
    expect(completed?.completedModules.m1).toBe(true)
  })

  test('the map is browsable before the assessment', async ({ page }) => {
    const card = page.getByTestId('risk-card-LLM08')
    await expect(card).toHaveAttribute('data-new2025', 'true')

    await card.getByRole('button').first().click()
    await expect(page.getByTestId('risk-incident')).toContainText('vector store')
  })
})
