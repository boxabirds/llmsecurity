/**
 * Story 6 — Module 6 scenario simulator (m6d.simulator), TC-01..TC-03.
 *
 * The capstone: sequenced decisions with narrated consequences, the full-circle
 * EchoLeak incident for the trifecta-complete design, and a replay with one
 * decision changed.
 */
import { test, expect } from '@playwright/test'

const MOST_CAPABLE = ['vendor-api', 'full-inbox', 'send-and-act', 'open-egress', 'guardrail-only']

async function walk(page: import('@playwright/test').Page, picks: string[]) {
  for (let i = 0; i < picks.length; i += 1) {
    await page.getByTestId(`option-${picks[i]}`).click()
    await page
      .getByRole('button', { name: i === picks.length - 1 ? 'See the outcome' : 'Next decision' })
      .click()
  }
}

test.describe('Module 6 capstone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m6')
  })

  test('TC-01 each choice narrates its consequence with an ATLAS technique', async ({ page }) => {
    await expect(page.getByTestId('decision-question')).toBeVisible()

    // Nothing advances until a choice is actually made.
    await expect(page.getByRole('button', { name: 'Next decision' })).toBeDisabled()

    await page.getByTestId('option-vendor-api').click()

    const consequence = page.getByTestId('consequence')
    await expect(consequence).toBeVisible()
    await expect(consequence).toContainText('MITRE ATLAS technique')
    await expect(consequence).toContainText('ML Supply Chain Compromise')
    await expect(page.getByRole('button', { name: 'Next decision' })).toBeEnabled()
  })

  test('TC-02 the trifecta-complete design runs the full-circle incident', async ({ page }) => {
    await walk(page, MOST_CAPABLE)

    await expect(page.getByTestId('full-circle-incident')).toBeVisible()
    await expect(page.getByTestId('full-circle-incident')).toContainText('Module 0')
    // It is reported as exposed, not quietly celebrated as capable.
    await expect(page.locator('.risk-signal[data-risk="exposed"]')).toBeVisible()
  })

  test('TC-03 replaying with decisions changed updates the outcome', async ({ page }) => {
    await walk(page, MOST_CAPABLE)
    await expect(page.getByTestId('full-circle-incident')).toBeVisible()

    await page.getByRole('button', { name: 'Change one decision' }).click()

    // Close both outbound doors: network egress alone is not a cut.
    await walk(page, ['vendor-api', 'full-inbox', 'draft-only', 'allowlist', 'guardrail-only'])

    await expect(page.getByTestId('full-circle-incident')).toHaveCount(0)
    await expect(page.locator('.risk-signal[data-risk="contained"]')).toBeVisible()
  })

  test('the memo will not finish without an honest residual risk', async ({ page }) => {
    await walk(page, MOST_CAPABLE)

    await page.getByRole('button', { name: 'Finish my memo' }).click()
    await expect(page.getByTestId('memo-result')).toHaveAttribute('data-passed', 'false')

    await page
      .getByTestId('residual-risk-input')
      .fill('A backdoored model cannot be ruled out by any behavioural test we can run.')
    await page.getByRole('button', { name: 'Finish my memo' }).click()

    await expect(page.getByTestId('memo-result')).toHaveAttribute('data-passed', 'true')
    await expect(page.getByTestId('memo-export')).toContainText('RISK MEMO')
  })
})
