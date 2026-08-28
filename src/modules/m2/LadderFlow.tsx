/**
 * Module 2 — the scaffolding ladder in full.
 *
 * Watch (guided replay) -> Complete (supply the payload) -> Do (unaided) ->
 * Vary (transfer to a calendar invite) -> Turn (cut a leg and watch it fail).
 *
 * The learner succeeds at the attack before any defense is taught. That is the
 * point: the defense in Module 4 only means something once you have made the
 * assistant betray you yourself.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar, ChipToggle } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation } from '../../references/Citation'
import { useProgress } from '../../state/progress'
import { announce } from '../../a11y/announce'
import { InjectionPlayground } from './InjectionPlayground'
import { evaluateMastery, type MasteryOutcome } from './mastery'
import {
  processContent,
  ALL_LEGS,
  LEG_LABELS,
  WORKED_PAYLOAD,
  type AgentResult,
  type LegConfig,
  type LegName,
} from './engine'
import './m2.css'

type Step = 'watch' | 'complete' | 'do' | 'vary' | 'turn'

const STEPS: readonly Step[] = ['watch', 'complete', 'do', 'vary', 'turn'] as const

const STEP_LABELS: Record<Step, string> = {
  watch: 'Watch',
  complete: 'Complete',
  do: 'Do',
  vary: 'Vary',
  turn: 'Turn',
}

const WATCH_BEATS = [
  'Your assistant is asked to summarise your unread mail. Ordinary request, ordinary inbox.',
  'One email contains a line the recipient never sees — but the assistant reads everything in its context window.',
  'The assistant cannot tell your request from the attacker\'s text. Both are just tokens, side by side.',
  'So it follows the embedded instruction, and sends your balance to a stranger. No exploit, no malware — just text.',
]

export function LadderFlow() {
  const [step, setStep] = useState<Step>('watch')
  const [beat, setBeat] = useState(0)
  const [doneSteps, setDoneSteps] = useState<Set<Step>>(new Set())

  const [transferExfiltrated, setTransferExfiltrated] = useState(false)
  const [learnerPayload, setLearnerPayload] = useState(WORKED_PAYLOAD)
  const [namedLeg, setNamedLeg] = useState<LegName | null>(null)
  const [outcome, setOutcome] = useState<MasteryOutcome | null>(null)

  // Turn step: live leg configuration and its consequence.
  const [legs, setLegs] = useState<LegConfig>(ALL_LEGS)
  const [turnResult, setTurnResult] = useState<AgentResult | null>(null)

  const completeModule = useProgress((s) => s.completeModule)
  const storeExploit = useProgress((s) => s.storeExploit)

  function goTo(next: Step) {
    setDoneSteps((prev) => new Set(prev).add(step))
    setStep(next)
  }

  function toggleLeg(leg: LegName) {
    const next = { ...legs, [leg]: !legs[leg] }
    setLegs(next)
    const result = processContent(learnerPayload, { legs: next })
    setTurnResult(result)
    announce(result.announcement)
  }

  return (
    <section className="m2-ladder" aria-label="Prompt injection sandbox">
      <ol className="m2-ladder__steps" aria-label="Progress through the lab">
        {STEPS.map((s) => (
          <li
            key={s}
            className={`m2-ladder__step${s === step ? ' m2-ladder__step--current' : ''}${
              doneSteps.has(s) ? ' m2-ladder__step--done' : ''
            }`}
            aria-current={s === step ? 'step' : undefined}
            data-step={s}
          >
            {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      {step === 'watch' ? (
        <div data-testid="step-watch">
          <h2>Watch what happens</h2>
          <div className="m2-beat" data-testid="watch-beat">
            <p>{WATCH_BEATS[beat]}</p>
          </div>
          <ActionBar>
            {beat < WATCH_BEATS.length - 1 ? (
              <TouchTarget primary onClick={() => setBeat((b) => b + 1)}>
                Next beat
              </TouchTarget>
            ) : (
              <TouchTarget primary onClick={() => goTo('complete')}>
                Now you try
              </TouchTarget>
            )}
          </ActionBar>
        </div>
      ) : null}

      {step === 'complete' ? (
        <div data-testid="step-complete">
          <h2>Finish the attack</h2>
          <p>
            The hidden field below is blank. Write the instruction that makes the assistant send the
            balance to <code>collector@attacker.example</code>. This is the shape of{' '}
            <Citation id="echoleak">EchoLeak</Citation>, in miniature.
          </p>
          <InjectionPlayground
            surface="email"
            onResult={(result, payload) => {
              if (result.exfiltrated) {
                setLearnerPayload(payload)
                storeExploit({ surface: 'email', payload, succeeded: true })
              }
            }}
          />
          <ActionBar>
            <TouchTarget primary onClick={() => goTo('do')}>
              Continue unaided
            </TouchTarget>
          </ActionBar>
        </div>
      ) : null}

      {step === 'do' ? (
        <div data-testid="step-do">
          <h2>Do it unaided</h2>
          <p>Compose the whole thing yourself. Nothing is pre-filled this time.</p>
          <InjectionPlayground
            surface="email"
            onResult={(result, payload) => {
              if (result.exfiltrated) {
                setLearnerPayload(payload)
                storeExploit({ surface: 'email', payload, succeeded: true })
              }
            }}
          />
          <ActionBar>
            <TouchTarget primary onClick={() => goTo('vary')}>
              Try a different surface
            </TouchTarget>
          </ActionBar>
        </div>
      ) : null}

      {step === 'vary' ? (
        <div data-testid="step-vary">
          <h2>Now through a calendar invite</h2>
          <p>
            Same principle, new surface. If you can do it here too, you understand the mechanism
            rather than the example.
          </p>
          <InjectionPlayground
            surface="calendar"
            onResult={(result, payload) => {
              if (result.exfiltrated) {
                setTransferExfiltrated(true)
                setLearnerPayload(payload)
                storeExploit({ surface: 'calendar', payload, succeeded: true })
              }
            }}
          />
          {transferExfiltrated ? (
            <p data-testid="transfer-confirmed">
              <RiskSignal
                level="exposed"
                detail="You reproduced the attack on a surface you had not practised on."
              />
            </p>
          ) : null}
          <ActionBar>
            <TouchTarget primary onClick={() => goTo('turn')} disabled={!transferExfiltrated}>
              Now stop it
            </TouchTarget>
          </ActionBar>
        </div>
      ) : null}

      {step === 'turn' ? (
        <div data-testid="step-turn">
          <h2>You just succeeded. Now which leg would you cut?</h2>
          <p>
            The assistant needed three things at once: private data, untrusted content, and a way to
            reach the outside. Switch one off and re-run your own attack.
          </p>

          <div className="m2-legs">
            {(Object.keys(LEG_LABELS) as LegName[]).map((leg) => (
              <ChipToggle
                key={leg}
                label={LEG_LABELS[leg]}
                selected={legs[leg]}
                onToggle={() => toggleLeg(leg)}
                description={legs[leg] ? 'present' : 'cut'}
              />
            ))}
          </div>

          {turnResult ? (
            <div data-testid="turn-result">
              <RiskSignal
                level={turnResult.exfiltrated ? 'exposed' : 'contained'}
                detail={turnResult.trace}
              />
            </div>
          ) : null}

          <div className="m2-mastery">
            <h3>Name the leg you would cut</h3>
            <p>
              Your answer is checked by re-running your own attack with that capability removed — a
              claim that does not hold will not pass.
            </p>
            <div className="m2-legs">
              {(Object.keys(LEG_LABELS) as LegName[]).map((leg) => (
                <ChipToggle
                  key={leg}
                  label={LEG_LABELS[leg]}
                  selected={namedLeg === leg}
                  onToggle={() => setNamedLeg(leg)}
                />
              ))}
            </div>

            <ActionBar>
              <TouchTarget
                primary
                disabled={!namedLeg}
                onClick={() => {
                  const result = evaluateMastery({
                    transferExfiltrated,
                    namedLeg,
                    payload: learnerPayload,
                  })
                  setOutcome(result)
                  if (result.passed) completeModule('m2', 100)
                }}
              >
                Check my answer
              </TouchTarget>
            </ActionBar>

            {outcome ? (
              <p
                className={`m2-mastery__result m2-mastery__result--${outcome.passed ? 'pass' : 'fail'}`}
                data-testid="mastery-result"
                data-passed={outcome.passed ? 'true' : 'false'}
              >
                {outcome.reason}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
