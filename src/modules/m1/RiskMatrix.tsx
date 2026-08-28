/**
 * Module 1 — the living map (m1d.risk_map).
 *
 * Ten cards, not a table. A table invites reading top to bottom once; cards
 * invite landing on one, and the learner will land on them repeatedly from
 * later labs. Three layers of detail keep the load low: code and title always,
 * the one-line gloss on focus or hover, the documented incident on activation.
 *
 * The two 2025 additions announce themselves once — a single settle-to-still
 * pulse — because "what changed this year" is the one thing a returning
 * practitioner needs from this page. It never repeats, and never runs at all
 * under reduced motion.
 */
import { useEffect, useMemo, useState } from 'react'
import { Citation } from '../../references/Citation'
import { useProgress } from '../../state/progress'
import { useReducedMotion, motionDuration } from '../../a11y/motion'
import { OWASP_RISKS, type Risk, type RiskCode } from './risks'
import './m1.css'

export interface RiskMatrixProps {
  /** Injectable for tests and for future filtered views. */
  risks?: readonly Risk[]
}

export function RiskMatrix({ risks = OWASP_RISKS }: RiskMatrixProps) {
  const [expanded, setExpanded] = useState<RiskCode | null>(null)
  const [raised, setRaised] = useState<RiskCode | null>(null)
  const visitedRisks = useProgress((s) => s.visitedRisks)
  const reduced = useReducedMotion()

  // Pulse once, then settle. Reduced motion skips the pulse entirely rather
  // than shortening it: the "New in 2025" badge already carries the meaning.
  const [pulsing, setPulsing] = useState(!reduced)
  useEffect(() => {
    if (reduced) {
      setPulsing(false)
      return
    }
    const timer = window.setTimeout(() => setPulsing(false), motionDuration('slow', reduced))
    return () => window.clearTimeout(timer)
  }, [reduced])

  const byCode = useMemo(() => new Map(risks.map((risk) => [risk.code, risk])), [risks])

  function toggle(code: RiskCode) {
    setExpanded((current) => (current === code ? null : code))
  }

  return (
    <section className="m1-map" aria-labelledby="m1-map-heading">
      <h2 id="m1-map-heading">The ten, on one screen</h2>
      <p className="m1-map__hint">
        Focus or hover a card for the one-liner. Open one for a documented case and where it sits in
        the frameworks. You are not memorising this — you are getting somewhere to put things.
      </p>

      <ul className="m1-grid" aria-label="OWASP Top 10 for LLM Applications 2025">
        {[...byCode.values()].map((risk) => {
          const isExpanded = expanded === risk.code
          const isVisited = Boolean(visitedRisks[risk.code])
          const glossId = `m1-gloss-${risk.id}`
          const panelId = `m1-panel-${risk.id}`

          return (
            <li
              key={risk.id}
              className="m1-card"
              data-testid={`risk-card-${risk.code}`}
              data-visited={isVisited ? 'true' : undefined}
              data-new2025={risk.isNew2025 ? 'true' : undefined}
              data-raised={raised === risk.code || isExpanded ? 'true' : undefined}
              data-pulse={risk.isNew2025 && pulsing ? 'true' : undefined}
            >
              <button
                type="button"
                className="m1-card__button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                aria-describedby={glossId}
                onFocus={() => setRaised(risk.code)}
                onBlur={() => setRaised((current) => (current === risk.code ? null : current))}
                onMouseEnter={() => setRaised(risk.code)}
                onMouseLeave={() => setRaised((current) => (current === risk.code ? null : current))}
                onClick={() => toggle(risk.code)}
              >
                <span className="m1-card__code">{risk.code}</span>
                <span className="m1-card__title">{risk.title}</span>
                <span className="m1-card__badges">
                  {risk.isNew2025 ? (
                    <span className="m1-badge m1-badge--new">New in 2025</span>
                  ) : null}
                  {isVisited ? <span className="m1-badge m1-badge--visited">Seen in a lab</span> : null}
                </span>
              </button>

              <p className="m1-card__gloss" id={glossId}>
                {risk.gloss}
              </p>

              <div className="m1-card__panel" id={panelId} hidden={!isExpanded}>
                {isExpanded ? (
                  risk.incident ? (
                    <div data-testid="risk-incident">
                      <p className="m1-card__incident">{risk.incident}</p>
                      <p className="m1-card__chips">
                        <Citation id={risk.frameworkRef} />
                        {risk.referenceId ? <Citation id={risk.referenceId} /> : null}
                      </p>
                    </div>
                  ) : (
                    <div data-testid="risk-placeholder">
                      <p className="m1-card__incident m1-card__incident--placeholder">
                        No verified public case is recorded here yet — the category still holds. Use
                        the framework entry for the definition.
                      </p>
                      <p className="m1-card__chips">
                        <Citation id={risk.frameworkRef} />
                      </p>
                    </div>
                  )
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
