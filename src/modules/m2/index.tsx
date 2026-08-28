/**
 * Module 2 — Attack sandbox: prompt injection.
 *
 * The flagship experience: the learner becomes the attacker and succeeds,
 * before any defense is taught.
 */
import { Citation, SectionAnchor } from '../../references/Citation'
import { LadderFlow } from './LadderFlow'

export const M2_REFERENCE_IDS = ['echoleak', 'trifecta', 'owasp2025'] as const

export default function Module2() {
  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 2 · Experience</p>
        <h1>You are the attacker</h1>
        <p>
          In June 2025 a single crafted email made Microsoft 365 Copilot send private data to a
          stranger, with no click from the victim — <Citation id="echoleak">EchoLeak</Citation>. The
          mechanism is not exotic, and you are about to reproduce it. Everything here is scripted
          and runs on your device; the secret is fake and nothing leaves the browser.
        </p>
        <p className="module-note">
          This lab depicts the documented shape of the attack (<SectionAnchor anchor="3.1" />), not
          live model output.
        </p>
      </header>

      <LadderFlow />
    </article>
  )
}
