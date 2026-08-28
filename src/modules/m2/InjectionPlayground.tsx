/**
 * The injection sandbox.
 *
 * The learner authors the attacker's content and watches the assistant process
 * it. Everything is scripted and on-device: the "secret" is seeded and fake,
 * the exfiltration target is a non-routable example host, and no model is
 * called. What is real is the mechanism.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar, ScrollX } from '../../responsive/TouchTarget'
import { announce } from '../../a11y/announce'
import {
  processContent,
  SURFACES,
  SEEDED_SECRET,
  USER_REQUEST,
  ALL_LEGS,
  type AgentResult,
  type LegConfig,
} from './engine'
import './m2.css'

export interface InjectionPlaygroundProps {
  surface: 'email' | 'calendar'
  legs?: LegConfig
  /** Pre-filled payload (used by the Complete rung). */
  initialPayload?: string
  onResult?: (result: AgentResult, payload: string) => void
  /** Locks the field so the guided rungs cannot be edited. */
  readOnly?: boolean
}

export function InjectionPlayground({
  surface,
  legs = ALL_LEGS,
  initialPayload = '',
  onResult,
  readOnly = false,
}: InjectionPlaygroundProps) {
  const copy = SURFACES[surface]
  const [payload, setPayload] = useState(initialPayload)
  const [result, setResult] = useState<AgentResult | null>(null)

  function run() {
    const content = `${copy.benign}\n${payload}`
    const outcome = processContent(content, { legs, surface })
    setResult(outcome)
    announce(outcome.announcement)
    onResult?.(outcome, payload)
  }

  return (
    <div className="m2-playground" data-surface={surface}>
      <div className="m2-panel">
        <h3 className="m2-panel__title">Incoming {copy.label.toLowerCase()}</h3>
        <p className="m2-panel__benign">{copy.benign}</p>

        <label className="m2-field">
          <span className="m2-field__label">{copy.fieldLabel}</span>
          <textarea
            className="m2-field__input"
            data-testid="payload-input"
            rows={3}
            value={payload}
            readOnly={readOnly}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Text the recipient never sees — but the assistant reads…"
          />
        </label>
      </div>

      <div className="m2-panel m2-panel--assistant">
        <h3 className="m2-panel__title">Your assistant</h3>
        <p className="m2-panel__task">
          <strong>Your request:</strong> {USER_REQUEST}
        </p>
        <p className="m2-panel__secret">
          <strong>It also holds:</strong> <code>{SEEDED_SECRET}</code>{' '}
          <span className="m2-panel__note">(seeded, fake)</span>
        </p>

        <ActionBar>
          <TouchTarget
            destructive
            onClick={() => {
              setResult(null)
              if (!readOnly) setPayload('')
            }}
          >
            Reset
          </TouchTarget>
          <TouchTarget primary onClick={run}>
            Run the assistant
          </TouchTarget>
        </ActionBar>

        {result ? (
          <div
            className={`m2-result${result.exfiltrated ? ' m2-result--leak' : ' m2-result--safe'}`}
            data-testid={result.exfiltrated ? 'exfil-result' : 'no-exfil-result'}
            data-exfiltrated={result.exfiltrated ? 'true' : 'false'}
          >
            <p className="m2-result__summary">{result.summary}</p>

            {result.exfiltrated && result.exfil ? (
              <>
                <p className="m2-result__label">The assistant rendered this link:</p>
                <ScrollX label="Exfiltration link">
                  <code className="m2-result__link" data-testid="exfil-link">
                    {result.exfil.rendered}
                  </code>
                </ScrollX>
                <p className="m2-result__flight" data-testid="exfil-flight" aria-hidden="true">
                  <span className="m2-result__packet">{SEEDED_SECRET}</span>
                  <span className="m2-result__arrow">→</span>
                  <span className="m2-result__target">{result.exfil.target}</span>
                </p>
              </>
            ) : null}

            <details className="m2-result__trace" data-testid="reasoning-trace">
              <summary>Why the assistant did that</summary>
              <p>{result.trace}</p>
            </details>
          </div>
        ) : null}
      </div>
    </div>
  )
}
