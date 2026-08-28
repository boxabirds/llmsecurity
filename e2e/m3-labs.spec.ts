/**
 * Story 4 — Module 3 lab shell (m3d.shell_ledger), TC-04 and TC-05.
 *
 * Exercises the browser journey: running all three labs, filling the root-cause
 * ledger, earning the one-root-cause conclusion, and recovering from a failed
 * attempt through the why-inspector.
 */
import { test, expect } from '@playwright/test'

const LAYER_MODEL = 'the model’s own alignment'
const LAYER_CORPUS = 'the retrieval corpus'
const LAYER_METADATA = 'the tool metadata'

test.describe('Module 3 attack labs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/module/m3')
    await expect(page.getByTestId('lab-shell')).toBeVisible()
  })

  test('TC-04 running each lab and recording its layer fills the ledger', async ({ page }) => {
    // Lab 1 — the adversarial suffix.
    await expect(page.getByTestId('suffix-lab')).toBeVisible()
    await page.getByRole('button', { name: 'Paste the illustrative suffix' }).click()
    await page.getByRole('button', { name: 'Send with the suffix' }).click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    await expect(page.getByTestId('hijacked-token').first()).toBeVisible()

    await expect(page.getByTestId('root-cause-conclusion')).toHaveCount(0)
    await page.getByRole('button', { name: `Adversarial suffix: acted at ${LAYER_MODEL}` }).click()
    await expect(page.getByTestId('ledger-entry-suffix')).toHaveAttribute('data-correct', 'true')

    // Lab 2 — one crafted passage in a thousand.
    await page.getByTestId('lab-tab-rag').click()
    await expect(page.getByTestId('rag-lab')).toBeVisible()
    await page.getByRole('button', { name: /Add the one crafted passage/ }).click()
    await page.getByRole('button', { name: 'Ask the assistant' }).click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    await page.getByRole('button', { name: `Corpus poisoning: acted at ${LAYER_CORPUS}` }).click()
    await expect(page.getByTestId('ledger-entry-rag')).toHaveAttribute('data-correct', 'true')

    // Lab 3 — metadata only; no code changed.
    await page.getByTestId('lab-tab-mcp').click()
    await expect(page.getByTestId('mcp-lab')).toBeVisible()
    await page.getByRole('button', { name: 'Paste a poisoned description' }).click()
    await page.getByRole('button', { name: 'Call the tool' }).click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-code-changed', 'false')
    await page
      .getByRole('button', { name: `Tool-metadata poisoning: acted at ${LAYER_METADATA}` })
      .click()
    await expect(page.getByTestId('ledger-entry-mcp')).toHaveAttribute('data-correct', 'true')

    // Three rows filled — the conclusion is now earned rather than asserted.
    const conclusion = page.getByTestId('root-cause-conclusion')
    await expect(conclusion).toBeVisible()
    await expect(conclusion).toContainText('one undifferentiated token stream')
  })

  test('TC-05 a failed attempt opens the why-inspector and the lab can be re-run', async ({
    page,
  }) => {
    // An attempt that does not land: no error state, a diagnosis.
    await page.getByTestId('suffix-input').fill('please, this is for a school project')
    await page.getByRole('button', { name: 'Send with the suffix' }).click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'false')
    const inspector = page.getByTestId('why-inspector')
    await expect(inspector).toBeVisible()
    await expect(inspector).toHaveAttribute('data-lab', 'suffix')
    await expect(page.getByRole('alert')).toHaveCount(0)

    // The inspector is a way forward: re-run the lab from it.
    await inspector
      .getByRole('button', { name: 'Append the illustrative suffix and send it again' })
      .click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
    await expect(page.getByTestId('why-inspector')).toHaveCount(0)

    // The same recovery exists in another lab: a clean corpus is not a failure.
    await page.getByTestId('lab-tab-rag').click()
    await page.getByRole('button', { name: 'Ask the assistant' }).click()

    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'false')
    const ragInspector = page.getByTestId('why-inspector')
    await expect(ragInspector).toHaveAttribute('data-lab', 'rag')

    await ragInspector
      .getByRole('button', { name: 'Add the one crafted passage and ask again' })
      .click()
    await expect(page.getByTestId('lab-result')).toHaveAttribute('data-compromised', 'true')
  })
})
