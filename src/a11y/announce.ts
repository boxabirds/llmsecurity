/**
 * Spoken simulation outcomes.
 *
 * Every simulation outcome is announced in words through a single shared ARIA
 * live region. Verbalising the outcome is not only the screen-reader path — it
 * is the second (verbal) coding channel for every learner.
 */

const REGION_ID = 'llmsec-live-region'

let cached: HTMLElement | null = null

/** Returns the one live region, creating it on first use (init-once). */
export function getLiveRegion(): HTMLElement {
  if (cached && cached.isConnected) return cached

  const existing = document.getElementById(REGION_ID)
  if (existing) {
    cached = existing
    return existing
  }

  const el = document.createElement('div')
  el.id = REGION_ID
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-atomic', 'true')
  el.className = 'visually-hidden'
  document.body.appendChild(el)
  cached = el
  return el
}

/**
 * Announce a simulation outcome in plain words, e.g.
 * "Secret exfiltrated: the account number was sent to attacker.example".
 */
export function announce(outcome: string): void {
  const region = getLiveRegion()
  // Re-assigning identical text would not re-trigger some screen readers;
  // clearing first guarantees the update is announced.
  if (region.textContent === outcome) region.textContent = ''
  region.textContent = outcome
}

/** Test seam: drop the cached handle and remove the region from the document. */
export function resetLiveRegion(): void {
  document.getElementById(REGION_ID)?.remove()
  cached = null
}
