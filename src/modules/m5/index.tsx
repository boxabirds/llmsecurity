/**
 * Module 5 — The indefensible frontier.
 *
 * Deliberately induces the comfortable belief that enough guardrails make you
 * safe, then breaks it. The emotional arc (frustration, breakthrough,
 * realisation) is the point: learners must FEEL why a filter is a rate-limiter.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar } from '../../responsive/TouchTarget'
import { Citation, SectionAnchor } from '../../references/Citation'
import { useProgress } from '../../state/progress'
import { GuardrailGauntlet } from './GuardrailGauntlet'
import { IndefensibleMap } from './IndefensibleMap'
import { evaluateCritique, VENDOR_CLAIM, type MasteryOutcome } from './mastery'
import './m5.css'

export default function Module5() {
  const [critique, setCritique] = useState('')
  const [outcome, setOutcome] = useState<MasteryOutcome | null>(null)
  const completeModule = useProgress((s) => s.completeModule)

  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 5 · Confront</p>
        <h1>What cannot be fixed</h1>
        <p>
          Module 4 gave you controls that hold. This one is about the parts that do not. Not to
          demoralise you — to stop you overclaiming, which is how security teams lose credibility (
          <SectionAnchor anchor="6" />).
        </p>
      </header>

      <GuardrailGauntlet />

      <IndefensibleMap />

      <section className="m5-critique" aria-label="Vendor claim critique">
        <h2>Critique this claim</h2>
        <blockquote className="m5-critique__claim" data-testid="vendor-claim">
          “{VENDOR_CLAIM}”
        </blockquote>
        <p>
          What is wrong with it? Not “their model is not good enough” — name the flaw that no
          amount of accuracy fixes (<Citation id="promptOverflow" />,{' '}
          <Citation id="injecguard" />
          ).
        </p>

        <label>
          <span className="visually-hidden">Your critique</span>
          <textarea
            className="m5-critique__input"
            data-testid="critique-input"
            rows={4}
            value={critique}
            onChange={(e) => setCritique(e.target.value)}
            placeholder="The problem is not accuracy, it is that…"
          />
        </label>

        <ActionBar>
          <TouchTarget
            primary
            disabled={critique.trim().length === 0}
            onClick={() => {
              const evaluated = evaluateCritique({ critique })
              setOutcome(evaluated)
              if (evaluated.passed) completeModule('m5', 100)
            }}
          >
            Submit my critique
          </TouchTarget>
        </ActionBar>

        {outcome ? (
          <p
            className={`m5-critique__result m5-critique__result--${outcome.passed ? 'pass' : 'fail'}`}
            data-testid="mastery-result"
            data-passed={outcome.passed ? 'true' : 'false'}
          >
            {outcome.reason}
          </p>
        ) : null}
      </section>
    </article>
  )
}
