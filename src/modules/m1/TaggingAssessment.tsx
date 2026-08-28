/**
 * Module 1 — the tagging assessment (m1d.tagging_assessment).
 *
 * Six incidents, interleaved so consecutive items never come from the same
 * family. The learner places each one on the map they have just been given.
 * One vignette is on screen at a time — ten options is already the load budget
 * for this module.
 *
 * An answer is committed once, because a near miss is only informative if it
 * was a real commitment. The feedback then names the specific confusion rather
 * than marking the answer wrong.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar, ChipToggle } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { announce } from '../../a11y/announce'
import { useProgress } from '../../state/progress'
import { OWASP_RISKS, riskLabel, type RiskCode } from './risks'
import {
  VIGNETTES,
  feedbackFor,
  isComplete,
  unansweredCount,
  scoreAnswers,
  exactCount,
  type Answers,
} from './tagging'
import './m1.css'

/** Half of the six, rounded up — the bar for "you have the shape of it". */
const STRONG_EXACT_COUNT = 4

export function TaggingAssessment() {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [score, setScore] = useState<number | null>(null)
  const completeModule = useProgress((s) => s.completeModule)

  const vignette = VIGNETTES[index]
  const chosen = answers[vignette.id]
  const feedback = chosen ? feedbackFor(vignette, chosen) : null
  const remaining = unansweredCount(answers)
  const canComplete = isComplete(answers)

  function choose(code: RiskCode) {
    if (answers[vignette.id]) return
    const next: Answers = { ...answers, [vignette.id]: code }
    setAnswers(next)
    announce(feedbackFor(vignette, code).message)
  }

  function finish() {
    const finalScore = scoreAnswers(answers)
    setScore(finalScore)
    completeModule('m1', finalScore)
    announce(`Module 1 complete. ${exactCount(answers)} of ${VIGNETTES.length} tagged exactly.`)
  }

  return (
    <section className="m1-assessment" aria-labelledby="m1-assessment-heading">
      <h2 id="m1-assessment-heading">Now place six real ones</h2>
      <p className="m1-assessment__hint">
        Each is a short incident. Put it where it belongs on the map. Near misses are worth having —
        they are where the categories touch.
      </p>

      <ol className="m1-progress" aria-label="Vignettes">
        {VIGNETTES.map((v, i) => (
          <li key={v.id}>
            <button
              type="button"
              className={`m1-progress__dot${i === index ? ' m1-progress__dot--current' : ''}`}
              aria-current={i === index ? 'step' : undefined}
              data-answered={answers[v.id] ? 'true' : undefined}
              onClick={() => setIndex(i)}
            >
              <span className="visually-hidden">Vignette </span>
              {v.n}
              <span className="visually-hidden">{answers[v.id] ? ', answered' : ', unanswered'}</span>
            </button>
          </li>
        ))}
      </ol>

      <article className="m1-vignette" data-testid={`vignette-${vignette.n}`}>
        <p className="m1-vignette__setting">{vignette.setting}</p>
        <p className="m1-vignette__scenario">{vignette.scenario}</p>

        <fieldset className="m1-vignette__options">
          <legend className="m1-vignette__legend">Which entry is this?</legend>
          {OWASP_RISKS.map((risk) => (
            <ChipToggle
              key={risk.code}
              label={riskLabel(risk)}
              selected={chosen === risk.code}
              disabled={Boolean(chosen)}
              onToggle={() => choose(risk.code)}
            />
          ))}
        </fieldset>

        {feedback ? (
          <p
            className={`m1-feedback m1-feedback--${feedback.result}`}
            data-testid="tag-feedback"
            data-result={feedback.result}
          >
            {feedback.message}
          </p>
        ) : null}
      </article>

      <ActionBar>
        <TouchTarget onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Previous
        </TouchTarget>
        <TouchTarget
          onClick={() => setIndex((i) => Math.min(VIGNETTES.length - 1, i + 1))}
          disabled={index === VIGNETTES.length - 1}
        >
          Next
        </TouchTarget>
        <TouchTarget primary onClick={finish} disabled={!canComplete}>
          Finish the map
        </TouchTarget>
      </ActionBar>

      {!canComplete ? (
        <p className="m1-assessment__blocked" data-testid="assessment-blocked">
          {remaining} of {VIGNETTES.length} still unanswered. All six are needed to finish.
        </p>
      ) : null}

      {score !== null ? (
        <div className="m1-complete" data-testid="assessment-complete" data-score={score}>
          <RiskSignal
            level={exactCount(answers) >= STRONG_EXACT_COUNT ? 'contained' : 'elevated'}
            detail={`${exactCount(answers)} of ${VIGNETTES.length} placed exactly — score ${score}. You now have somewhere to put every attack in the rest of the course.`}
          />
          <p className="m1-complete__next">
            Next you stop reading the map and walk the territory: you become the attacker.
          </p>
        </div>
      ) : null}
    </section>
  )
}
