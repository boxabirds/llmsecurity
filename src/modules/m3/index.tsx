/**
 * Module 3 — Jailbreaks, RAG poisoning and tool poisoning.
 *
 * Module 2 made the learner run one attack. This module runs three that look
 * nothing alike — a suffix, a passage, a tool description — and then makes the
 * learner discover, by recording each one in a ledger, that they are the same
 * failure at three different layers.
 *
 * Everything is scripted and on-device: no model is called, the addresses are
 * non-routable example hosts, and the corpus is generated locally.
 */
import { useEffect, useState } from 'react'
import { Citation, SectionAnchor } from '../../references/Citation'
import { TouchTarget, ActionBar } from '../../responsive/TouchTarget'
import { useProgress } from '../../state/progress'
import { announce } from '../../a11y/announce'
import { LabShell } from './LabShell'
import { LAYER_ORDER, LAYER_LABELS, type Layer } from './labs'
import {
  evaluateMastery,
  NOVEL_SCENARIO,
  MECHANISM_LABELS,
  type Mechanism,
  type MasteryOutcome,
} from './mastery'
import './m3.css'

export const M3_REFERENCE_IDS = [
  'universalSuffixes',
  'poisonedRag',
  'corruptRag',
  'mcptox',
  'owasp2025',
] as const

/**
 * OWASP entries this module covers, so the M1 map fills in as the learner
 * works: prompt injection, data and model poisoning, and vector/embedding
 * weaknesses.
 */
export const M3_OWASP_RISK_IDS = ['LLM01', 'LLM04', 'LLM08'] as const

const MECHANISM_ORDER: readonly Mechanism[] = ['suffix', 'rag', 'mcp'] as const

/** A passed mastery gate is the whole module score; there is no partial credit. */
const MASTERY_SCORE = 100

export default function Module3() {
  const visitRisk = useProgress((s) => s.visitRisk)

  useEffect(() => {
    for (const risk of M3_OWASP_RISK_IDS) visitRisk(risk)
  }, [visitRisk])

  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 3 · Experience</p>
        <h1>Three attacks, one root cause</h1>
        <p>
          A suffix of nonsense tokens. A single page in a wiki. A sentence in a tool description.
          These three do not look related, and the industry mostly treats them as separate problems
          with separate products. Run all three and record what each one touched, and the
          relationship becomes hard to unsee (<SectionAnchor anchor="3.1" />
          ).
        </p>
        <p className="module-note">
          Every lab here is a scripted simulation running on your device. Nothing calls a model,
          nothing leaves the browser, and the suffix used in the first lab is a synthetic stand-in
          rather than a working jailbreak.
        </p>
      </header>

      <LabShell />

      <MasteryCheck />
    </article>
  )
}

/**
 * The mastery gate: a fourth scenario the learner has not run. Naming the
 * mechanism and the layer is generation rather than recognition — the pair has
 * to be produced from the ledger, not recalled from a lab.
 */
function MasteryCheck() {
  const [mechanism, setMechanism] = useState<Mechanism | null>(null)
  const [layer, setLayer] = useState<Layer | null>(null)
  const [explanation, setExplanation] = useState('')
  const [outcome, setOutcome] = useState<MasteryOutcome | null>(null)

  const completeModule = useProgress((s) => s.completeModule)

  return (
    <section className="m3-mastery" aria-label="Mastery check">
      <h2>A fourth case you have not seen</h2>
      <p className="m3-mastery__brief" data-testid="mastery-scenario">
        <strong>{NOVEL_SCENARIO.title}.</strong> {NOVEL_SCENARIO.brief}
      </p>

      <h3 className="m3-mastery__question">Which mechanism is this?</h3>
      <div className="m3-mastery__choices">
        {MECHANISM_ORDER.map((option) => (
          <TouchTarget
            key={option}
            primary={mechanism === option}
            ariaLabel={`Mechanism: ${MECHANISM_LABELS[option]}`}
            onClick={() => setMechanism(option)}
          >
            {MECHANISM_LABELS[option]}
          </TouchTarget>
        ))}
      </div>

      <h3 className="m3-mastery__question">Which layer did it act at?</h3>
      <div className="m3-mastery__choices">
        {LAYER_ORDER.map((option) => (
          <TouchTarget
            key={option}
            primary={layer === option}
            ariaLabel={`Layer: ${LAYER_LABELS[option]}`}
            onClick={() => setLayer(option)}
          >
            {LAYER_LABELS[option]}
          </TouchTarget>
        ))}
      </div>

      <h3 className="m3-mastery__question">And what actually changed in this system?</h3>
      <p className="m3-mastery__hint">
        In your own words. A correct guess and real understanding look identical until you explain
        it.
      </p>
      <label>
        <span className="visually-hidden">Your explanation</span>
        <textarea
          className="m3-mastery__input"
          data-testid="mastery-explanation"
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Nothing changed about the model or the tools — what changed was…"
        />
      </label>

      <ActionBar>
        <TouchTarget
          primary
          disabled={!mechanism || !layer || explanation.trim().length === 0}
          onClick={() => {
            const result = evaluateMastery({ mechanism, layer, explanation })
            setOutcome(result)
            announce(result.reason)
            if (result.passed) completeModule('m3', MASTERY_SCORE)
          }}
        >
          Check my answer
        </TouchTarget>
      </ActionBar>

      {outcome ? (
        <p
          className={`m3-mastery__result m3-mastery__result--${outcome.passed ? 'pass' : 'fail'}`}
          data-testid="mastery-result"
          data-passed={outcome.passed ? 'true' : 'false'}
          data-mechanism-correct={outcome.mechanismCorrect ? 'true' : 'false'}
          data-layer-correct={outcome.layerCorrect ? 'true' : 'false'}
        >
          {outcome.reason}
        </p>
      ) : null}

      <p className="module-note">
        Sources for this module: <Citation id="universalSuffixes" />, <Citation id="poisonedRag" />,{' '}
        <Citation id="corruptRag" />, <Citation id="mcptox" />, <Citation id="owasp2025" />.
      </p>
    </section>
  )
}
