/**
 * Module 0 — orientation.
 *
 * It opens on a scene rather than a principle. The learner watches an ordinary
 * request end in an exfiltration, forms their own hypothesis about why, and
 * only then meets the mechanism and the three-leg model. The abstraction is the
 * payoff, not the premise.
 */
import { Citation, SectionAnchor } from '../../references/Citation'
import { DiscoveryFlow } from './DiscoveryFlow'
import { TrifectaBuilder, TrifectaMastery } from './TrifectaBuilder'
import './m0.css'

export const M0_REFERENCE_IDS = ['echoleak', 'trifecta'] as const

export default function Module0() {
  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 0 · Understand</p>
        <h1>An ordinary inbox, an ordinary request</h1>
        <p>
          It is Tuesday morning. Two unread messages, one of them from a partner you deal with every
          week. You ask your assistant to summarise the lot before your first call. Nothing about
          the next thirty seconds looks like an attack.
        </p>
        <p className="module-note">
          Everything below is scripted and runs on your device: the account number is seeded and
          fake, the recipient is a non-routable <code>example</code> host, and no model is called.
          What you are watching is illustrative mechanics — the documented shape of the attack (
          <SectionAnchor anchor="3.1" />) — not live model output.
        </p>
      </header>

      <DiscoveryFlow />

      <section className="m0-section" aria-label="Why it worked">
        <h2>Why that email could do that</h2>
        <p>
          Reading it as “the assistant was gullible” stops the thought too early. It leaked because
          three capabilities met in one process: it held private data, it took in content from
          someone outside your trust boundary, and it could reach the outside world. Any one of them
          alone is unremarkable. Together they are what Simon Willison named the{' '}
          <Citation id="trifecta">lethal trifecta</Citation>.
        </p>

        <TrifectaBuilder />
      </section>

      <section className="m0-section" aria-label="Read five systems">
        <h2>Now read five systems</h2>
        <TrifectaMastery />
      </section>
    </article>
  )
}
