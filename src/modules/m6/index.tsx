/**
 * Module 6 — Apply: the enterprise decision workshop.
 *
 * One decision per screen, consequences narrated as they land, and the course's
 * closing move: choosing the most capable configuration runs the same
 * EchoLeak-shaped incident the learner met in Module 0 — except now they
 * understand every step of it.
 */
import { useMemo, useState } from 'react'
import { TouchTarget, ActionBar, ScrollX } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation, SectionAnchor } from '../../references/Citation'
import { announce } from '../../a11y/announce'
import { useProgress } from '../../state/progress'
import { CalibrationMirror } from '../../assessment/CalibrationMirror'
import {
  DECISIONS,
  assess,
  optionFor,
  replaceChoice,
  type DecisionId,
  type Selections,
} from './scenario'
import { generateMemo, evaluateMemo, memoToText, type MemoOutcome } from './memo'
import './m6.css'

export default function Module6() {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Selections>({})
  const [residualRisk, setResidualRisk] = useState('')
  const [outcome, setOutcome] = useState<MemoOutcome | null>(null)

  const completeModule = useProgress((s) => s.completeModule)
  const predictions = useProgress((s) => s.predictions)
  const scores = useProgress((s) => s.scores)

  const decision = DECISIONS[step]
  const finished = step >= DECISIONS.length
  const assessment = useMemo(() => assess(selections), [selections])
  const memo = useMemo(
    () => generateMemo(selections, residualRisk),
    [selections, residualRisk],
  )

  const lastChoice = decision ? optionFor(decision.id, selections[decision.id]) : undefined

  function choose(id: DecisionId, optionId: string) {
    const next = replaceChoice(selections, id, optionId)
    setSelections(next)
    const chosen = optionFor(id, optionId)
    if (chosen) announce(chosen.consequence)
  }

  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 6 · Apply</p>
        <h1>Your call</h1>
        <p>
          Your company wants an AI assistant over the corporate inbox. You are asked whether it can
          go ahead, and on what terms. There is no single right answer here — only decisions you can
          defend (<SectionAnchor anchor="6" />).
        </p>
      </header>

      {!finished ? (
        <section className="m6-decision" aria-label={`Decision ${step + 1} of ${DECISIONS.length}`}>
          <p className="m6-decision__counter">
            Decision {step + 1} of {DECISIONS.length}
          </p>
          <h2 data-testid="decision-question">{decision.question}</h2>

          <div className="m6-decision__options">
            {decision.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`m6-option${selections[decision.id] === option.id ? ' m6-option--chosen' : ''}`}
                aria-pressed={selections[decision.id] === option.id}
                onClick={() => choose(decision.id, option.id)}
                data-testid={`option-${option.id}`}
              >
                <span className="m6-option__label">{option.label}</span>
                <span className="m6-option__detail">{option.detail}</span>
              </button>
            ))}
          </div>

          {lastChoice ? (
            <div className="m6-consequence" data-testid="consequence">
              <p>{lastChoice.consequence}</p>
              <p className="m6-consequence__atlas">
                MITRE ATLAS technique: <strong>{lastChoice.atlasTechnique}</strong>{' '}
                <Citation id="mitreAtlas" />
              </p>
            </div>
          ) : null}

          <ActionBar>
            {step > 0 ? (
              <TouchTarget onClick={() => setStep((s) => s - 1)}>Back</TouchTarget>
            ) : null}
            <TouchTarget
              primary
              disabled={!selections[decision.id]}
              onClick={() => setStep((s) => s + 1)}
            >
              {step === DECISIONS.length - 1 ? 'See the outcome' : 'Next decision'}
            </TouchTarget>
          </ActionBar>
        </section>
      ) : (
        <>
          <section className="m6-outcome" aria-label="Outcome">
            <h2>What you have built</h2>
            <RiskSignal
              level={assessment.trifectaComplete ? 'exposed' : 'contained'}
              detail={
                assessment.trifectaComplete
                  ? 'All three legs are present: the assistant holds private data, reads content strangers can write, and can reach the outside. This is the lethal trifecta.'
                  : 'At least one leg is cut, so this class of attack cannot complete in this configuration.'
              }
            />

            <p data-testid="capability-readout">
              Retained capability: <strong>~{assessment.capability}%</strong>
            </p>

            {assessment.incident ? (
              <div className="m6-incident" data-testid="full-circle-incident">
                <h3>You have seen this before</h3>
                <p>
                  A supplier emails an invoice query. Hidden in the footer is a line the recipient
                  never sees. Your assistant reads it, retrieves the finance thread, and sends the
                  account details to a stranger — the same shape as{' '}
                  <Citation id="echoleak">EchoLeak</Citation>, and the same scene that opened
                  Module 0. The difference is that you can now explain every step of it.
                </p>
              </div>
            ) : null}

            <ActionBar>
              <TouchTarget
                onClick={() => {
                  setStep(0)
                  setOutcome(null)
                }}
              >
                Change one decision
              </TouchTarget>
            </ActionBar>
          </section>

          <section className="m6-memo" aria-label="Risk memo">
            <h2>Your risk memo</h2>
            <p>
              This is the artifact you would actually hand over. It is not finished until it says
              what is still exposed.
            </p>

            <label>
              <span className="m6-memo__label">
                One residual risk this configuration cannot eliminate
              </span>
              <textarea
                className="m6-memo__input"
                data-testid="residual-risk-input"
                rows={3}
                value={residualRisk}
                onChange={(e) => setResidualRisk(e.target.value)}
                placeholder="Even with this in place, we cannot rule out…"
              />
            </label>

            <ActionBar>
              <TouchTarget
                primary
                onClick={() => {
                  const evaluated = evaluateMemo(memo)
                  setOutcome(evaluated)
                  if (evaluated.passed) completeModule('m6', 100)
                }}
              >
                Finish my memo
              </TouchTarget>
            </ActionBar>

            {outcome ? (
              <p
                className={`m6-memo__result m6-memo__result--${outcome.passed ? 'pass' : 'fail'}`}
                data-testid="memo-result"
                data-passed={outcome.passed ? 'true' : 'false'}
              >
                {outcome.reason}
              </p>
            ) : null}

            {outcome?.passed ? (
              <>
                <h3>Exported memo</h3>
                <ScrollX label="Exported risk memo">
                  <pre className="m6-memo__export" data-testid="memo-export">
                    {memoToText(memo)}
                  </pre>
                </ScrollX>
                <CalibrationMirror
                  calibration={
                    predictions.m5 !== undefined
                      ? { predicted: predictions.m5, actual: scores.m5 ?? 100 }
                      : null
                  }
                />
              </>
            ) : null}
          </section>
        </>
      )}
    </article>
  )
}
