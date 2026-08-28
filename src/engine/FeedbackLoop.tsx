/**
 * The three-beat feedback loop.
 *
 * Every interaction resolves in three beats, never one:
 *   1. Consequence — the world reacts, in-world. No right/wrong modal.
 *   2. Signal      — the causal element is highlighted.
 *   3. Explanation — the learner explains *why* before the canonical
 *                    explanation is revealed (generation before feedback).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { announce } from '../a11y/announce'
import { TouchTarget } from '../responsive/TouchTarget'
import './FeedbackLoop.css'

export type Beat = 'consequence' | 'signal' | 'self_explanation' | 'explained'

export interface FeedbackOutcome {
  /** What happened, shown in-world. */
  consequence: ReactNode
  /** The exact element that caused it. */
  causalElement: ReactNode
  /** Plain-words outcome for assistive technology. */
  announcement: string
  /** True when the action had no valid effect — still diagnostic, never an error. */
  diagnostic?: boolean
}

export interface FeedbackLoopProps {
  outcome: FeedbackOutcome
  /** The self-explanation prompt, e.g. "Which trifecta leg made this possible?" */
  question: string
  options?: readonly string[]
  correctAnswer?: string
  explanation: ReactNode
  onExplained?: (answer: string, correct: boolean) => void
}

export function FeedbackLoop({
  outcome,
  question,
  options,
  correctAnswer,
  explanation,
  onExplained,
}: FeedbackLoopProps) {
  const [beat, setBeat] = useState<Beat>('consequence')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    announce(outcome.announcement)
  }, [outcome.announcement])

  const answered = answer.trim().length > 0
  const correct = useMemo(
    () => (correctAnswer ? answer.trim().toLowerCase() === correctAnswer.toLowerCase() : true),
    [answer, correctAnswer],
  )

  function submit() {
    if (!answered) return
    setBeat('explained')
    onExplained?.(answer, correct)
  }

  return (
    <section className="feedback-loop" data-beat={beat} aria-label="What just happened">
      {/* Beat 1 — the world reacts. */}
      <div
        className={`feedback-loop__consequence${outcome.diagnostic ? ' feedback-loop__consequence--diagnostic' : ''}`}
        data-diagnostic={outcome.diagnostic ? 'true' : undefined}
      >
        {outcome.consequence}
      </div>

      {/* Beat 2 — point at the cause. */}
      {beat !== 'consequence' ? (
        <div className="feedback-loop__signal" data-testid="causal-signal">
          <h3 className="feedback-loop__heading">What caused it</h3>
          {outcome.causalElement}
        </div>
      ) : (
        <TouchTarget onClick={() => setBeat('signal')}>Show me what caused it</TouchTarget>
      )}

      {/* Beat 3 — generate before being told. */}
      {beat === 'signal' || beat === 'self_explanation' ? (
        <div className="feedback-loop__explain">
          <h3 className="feedback-loop__heading">
            <label htmlFor="self-explanation">{question}</label>
          </h3>

          {options ? (
            <div role="group" aria-label={question}>
              {options.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`feedback-loop__option${answer === option ? ' feedback-loop__option--chosen' : ''}`}
                  aria-pressed={answer === option}
                  onClick={() => setAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              id="self-explanation"
              className="feedback-loop__input"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="In your own words…"
            />
          )}

          <TouchTarget primary onClick={submit} disabled={!answered}>
            Submit explanation
          </TouchTarget>
        </div>
      ) : null}

      {/* Only now is the canonical explanation revealed. */}
      {beat === 'explained' ? (
        <div className="feedback-loop__explanation" data-testid="canonical-explanation">
          <h3 className="feedback-loop__heading">
            {correctAnswer ? (correct ? 'You got it' : 'Not quite') : 'Why this happened'}
          </h3>
          {explanation}
        </div>
      ) : null}
    </section>
  )
}
