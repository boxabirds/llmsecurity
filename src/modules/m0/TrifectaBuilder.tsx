/**
 * Module 0 — building the trifecta by hand.
 *
 * The point of the interaction is the *discontinuity*. Two legs is not
 * two-thirds of an attack: it is no attack. The danger indicator therefore
 * stays flat and honest at zero, one and two legs, and only arms at three — and
 * the explanation changes in the same render, so the reason arrives with the
 * state rather than a beat later.
 *
 * Chips are tap-to-add and tap-to-remove: the touch path and the keyboard path
 * are the same path, and nothing here requires dragging.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar, ChipToggle } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { announce } from '../../a11y/announce'
import { useProgress } from '../../state/progress'
import { LEG_LABELS, trifectaComplete, type LegConfig, type LegName } from '../../sim/kernel'
import {
  evaluateMastery,
  emptyAnswers,
  M0_SYSTEMS,
  type M0Answer,
  type M0MasteryOutcome,
} from './mastery'
import './m0.css'

const NO_LEGS: LegConfig = {
  privateData: false,
  untrustedContent: false,
  externalComms: false,
}

const LEG_NAMES: readonly LegName[] = ['privateData', 'untrustedContent', 'externalComms'] as const

const LEG_WHY: Record<LegName, string> = {
  privateData: 'gives the attack something worth taking',
  untrustedContent: 'is where the instruction comes from',
  externalComms: 'is how the data gets out',
}

const ARMED_EXPLANATION =
  'All three at once. The untrusted content supplies an instruction, the private data gives it something worth taking, and the outbound channel carries it away. No exploit is needed at any step — the assistant is doing its job.'

const MODULE_ID = 'm0'
const MASTERY_SCORE = 100

function legCount(legs: LegConfig): number {
  return LEG_NAMES.filter((leg) => legs[leg]).length
}

function safeExplanation(legs: LegConfig): string {
  const absent = LEG_NAMES.filter((leg) => !legs[leg])
  const present = legCount(legs)

  if (present === 0) {
    return 'Nothing here yet. Add the capabilities one at a time and watch when — and only when — the indicator changes.'
  }

  const absentText = absent.map((leg) => `${LEG_LABELS[leg]} (${LEG_WHY[leg]})`).join(', and ')
  return `${present} of ${LEG_NAMES.length}. Still absent: ${absentText}. This class of attack cannot complete without it, so the indicator stays where it is.`
}

export function TrifectaBuilder() {
  const [legs, setLegs] = useState<LegConfig>(NO_LEGS)
  const armed = trifectaComplete(legs)
  const present = legCount(legs)

  function toggleLeg(leg: LegName) {
    const next = { ...legs, [leg]: !legs[leg] }
    setLegs(next)
    announce(
      trifectaComplete(next)
        ? `Danger armed: all three legs present. ${ARMED_EXPLANATION}`
        : `Not exploitable by this class: ${legCount(next)} of ${LEG_NAMES.length} legs present.`,
    )
  }

  return (
    <div className="m0-builder">
      <p className="m0-builder__prompt">
        Add the capabilities your assistant had that morning. Take them away again. Watch the
        indicator.
      </p>

      <div className="m0-builder__legs">
        {LEG_NAMES.map((leg) => (
          <ChipToggle
            key={leg}
            label={LEG_LABELS[leg]}
            selected={legs[leg]}
            onToggle={() => toggleLeg(leg)}
            description={legs[leg] ? 'present' : 'absent'}
          />
        ))}
      </div>

      <div
        className={`m0-indicator${armed ? ' m0-indicator--armed' : ''}`}
        data-testid="danger-indicator"
        data-armed={armed ? 'true' : 'false'}
        data-legs={present}
      >
        <p className="m0-indicator__count">
          {present} of {LEG_NAMES.length} legs present
        </p>
        <RiskSignal
          level={armed ? 'exposed' : 'contained'}
          detail={
            armed
              ? 'All three legs present: this system can be made to leak by text alone.'
              : 'Not exploitable by this class of attack in this configuration.'
          }
        />
        <p className="m0-indicator__explanation" data-testid="danger-explanation">
          {armed ? ARMED_EXPLANATION : safeExplanation(legs)}
        </p>
      </div>
    </div>
  )
}

export function TrifectaMastery() {
  const [answers, setAnswers] = useState<Record<string, M0Answer>>(emptyAnswers)
  const [outcome, setOutcome] = useState<M0MasteryOutcome | null>(null)
  const completeModule = useProgress((s) => s.completeModule)

  function judge(systemId: string, complete: boolean) {
    setAnswers((prev) => ({
      ...prev,
      // Calling a system complete retracts any leg named for it.
      [systemId]: { complete, missingLeg: complete ? null : (prev[systemId]?.missingLeg ?? null) },
    }))
  }

  function nameLeg(systemId: string, leg: LegName) {
    setAnswers((prev) => ({
      ...prev,
      [systemId]: { complete: prev[systemId]?.complete ?? false, missingLeg: leg },
    }))
  }

  function check() {
    const result = evaluateMastery(answers)
    setOutcome(result)
    if (result.passed) completeModule(MODULE_ID, MASTERY_SCORE)
  }

  return (
    <div className="m0-mastery">
      <p>
        Five systems. For each one: are all three legs present? And where a leg is missing, say
        which — naming it is the part that proves you can read a system rather than react to how
        alarming it sounds.
      </p>

      <ol className="m0-systems">
        {M0_SYSTEMS.map((system) => {
          const answer = answers[system.id]
          return (
            <li className="m0-system" key={system.id} data-testid={`system-${system.id}`}>
              <h3 className="m0-system__name">{system.name}</h3>
              <p className="m0-system__description">{system.description}</p>

              <div className="m0-system__judgement">
                <ChipToggle
                  label="All three legs"
                  selected={answer?.complete === true}
                  onToggle={() => judge(system.id, true)}
                />
                <ChipToggle
                  label="A leg is missing"
                  selected={answer?.complete === false}
                  onToggle={() => judge(system.id, false)}
                />
              </div>

              {answer?.complete === false ? (
                <div className="m0-system__legs">
                  <p className="m0-system__legs-prompt">Which leg is absent?</p>
                  {LEG_NAMES.map((leg) => (
                    <ChipToggle
                      key={leg}
                      label={LEG_LABELS[leg]}
                      selected={answer.missingLeg === leg}
                      onToggle={() => nameLeg(system.id, leg)}
                    />
                  ))}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <ActionBar>
        <TouchTarget primary onClick={check}>
          Check my answers
        </TouchTarget>
      </ActionBar>

      {outcome ? (
        <p
          className={`m0-mastery__result m0-mastery__result--${outcome.passed ? 'pass' : 'fail'}`}
          data-testid="mastery-result"
          data-passed={outcome.passed ? 'true' : 'false'}
        >
          {outcome.reason}
        </p>
      ) : null}
    </div>
  )
}
