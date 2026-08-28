/**
 * Lab 1 — the adversarial suffix.
 *
 * The learner appends a suffix to a request the model refuses, and watches the
 * refusal flip. What is depicted is the *mechanism* reported in the
 * attention-hijacking literature — the suffix pulls contextualisation away from
 * the part of the prompt that triggered the refusal — and not the internals of
 * any real model: this is a scripted simulation, and the suffix is a synthetic
 * stand-in that says so in its own text.
 */
import { TouchTarget, ActionBar, ScrollX } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation } from '../../references/Citation'
import { announce } from '../../a11y/announce'
import {
  runSuffixLab,
  MOCK_SUFFIX,
  SUFFIX_REQUEST,
  type SuffixLabResult,
} from './labs'
import './m3.css'

export interface SuffixLabProps {
  suffix: string
  onSuffixChange: (suffix: string) => void
  result: SuffixLabResult | null
  onRun: (result: SuffixLabResult) => void
}

export function SuffixLab({ suffix, onSuffixChange, result, onRun }: SuffixLabProps) {
  function run() {
    const outcome = runSuffixLab({ suffix })
    announce(outcome.announcement)
    onRun(outcome)
  }

  return (
    <section className="m3-lab" data-testid="suffix-lab" aria-label="Adversarial suffix lab">
      <h3 className="m3-lab__title">Adversarial suffix</h3>
      <p className="m3-lab__note" data-testid="suffix-illustration-note">
        An illustration of the mechanism described in{' '}
        <Citation id="universalSuffixes" />, not live model internals. The suffix below is a
        synthetic stand-in — it is inert against any real system, and the whole exchange is
        scripted and runs on your device.
      </p>

      <p className="m3-lab__prompt">
        <strong>The request:</strong> {SUFFIX_REQUEST}
      </p>

      <label className="m3-field">
        <span className="m3-field__label">Suffix appended to the request</span>
        <textarea
          className="m3-field__input"
          data-testid="suffix-input"
          rows={2}
          value={suffix}
          onChange={(e) => onSuffixChange(e.target.value)}
          placeholder="Append something to the end of the prompt…"
        />
      </label>

      <ActionBar>
        <TouchTarget
          destructive
          onClick={() => {
            onSuffixChange('')
          }}
        >
          Clear suffix
        </TouchTarget>
        <TouchTarget onClick={() => onSuffixChange(MOCK_SUFFIX)}>
          Paste the illustrative suffix
        </TouchTarget>
        <TouchTarget primary onClick={run}>
          Send with the suffix
        </TouchTarget>
      </ActionBar>

      {result ? (
        <div
          className={`m3-result${result.compromised ? ' m3-result--breached' : ' m3-result--safe'}`}
          data-testid="lab-result"
          data-lab="suffix"
          data-compromised={result.compromised ? 'true' : 'false'}
        >
          <RiskSignal
            level={result.compromised ? 'exposed' : 'contained'}
            detail={
              result.compromised
                ? 'The refusal flipped to compliance. The request never changed.'
                : 'The refusal held. The request never changed.'
            }
          />

          <p className="m3-result__label">What the model returned:</p>
          <p className="m3-result__response" data-testid="suffix-response">
            {result.response}
          </p>

          <p className="m3-result__label">
            The prompt as one token stream{result.compromised ? ' — hijacking tokens highlighted' : ''}:
          </p>
          <ScrollX label="Prompt token stream">
            <p className="m3-tokens">
              {result.tokens.map((token, index) => (
                <span
                  key={`${index}-${token.text}`}
                  className={`m3-token${token.hijacked ? ' m3-token--hijacked' : ''}`}
                  data-testid={token.hijacked ? 'hijacked-token' : undefined}
                >
                  {token.text}
                </span>
              ))}
            </p>
          </ScrollX>

          <details className="m3-result__trace">
            <summary>Why the model did that</summary>
            <p>{result.trace}</p>
          </details>
        </div>
      ) : null}
    </section>
  )
}
