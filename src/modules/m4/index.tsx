/**
 * Module 4 — Defenses that hold.
 *
 * The payoff of the whole course so far: the learner re-runs their OWN Module 2
 * exploit against a configuration they chose, and watches it fail.
 */
import { useState } from 'react'
import { TouchTarget, ActionBar } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation, SectionAnchor } from '../../references/Citation'
import { announce } from '../../a11y/announce'
import { useProgress } from '../../state/progress'
import { CaMeLFlow, DefensePatternPicker, ArchitectureBuilder } from './DefenseSims'
import { replay, type DefenseConfig, type ReplayResult } from './replay'
import { evaluateMastery, type MasteryOutcome } from './mastery'
import type { LayerId, PatternId } from './patterns'
import './m4.css'

export default function Module4() {
  const [pattern, setPattern] = useState<PatternId | null>(null)
  const [layers, setLayers] = useState<LayerId[]>([])
  const [result, setResult] = useState<ReplayResult | null>(null)
  const [justification, setJustification] = useState('')
  const [outcome, setOutcome] = useState<MasteryOutcome | null>(null)

  const storedExploit = useProgress((s) => s.exploit)
  const completeModule = useProgress((s) => s.completeModule)

  const config: DefenseConfig = { pattern, layers }

  function runReplay() {
    const replayResult = replay(config, storedExploit?.payload)
    setResult(replayResult)
    announce(
      replayResult.exploitBlocked
        ? 'Your earlier exploit was blocked by this configuration.'
        : 'Your earlier exploit still succeeds against this configuration.',
    )
  }

  function toggleLayer(id: LayerId) {
    setLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
    setResult(null)
  }

  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 4 · Learn</p>
        <h1>Now stop your own attack</h1>
        <p>
          In Modules 2 and 3 you beat things that <em>usually</em> work. Here you meet controls that
          structurally cannot be beaten by trying again — and pay the price they charge in
          capability. <Citation id="camel">CaMeL</Citation> buys provable security on 77% of
          benchmark tasks against 84% undefended: the guarantee costs about seven points of utility,
          and the remaining tasks cannot be done securely at all (<SectionAnchor anchor="4.1" />).
        </p>
      </header>

      <CaMeLFlow />

      <DefensePatternPicker
        selected={pattern}
        onSelect={(id) => {
          setPattern(id)
          setResult(null)
        }}
      />

      <ArchitectureBuilder layers={layers} onToggleLayer={toggleLayer} />

      <section className="m4-replay" aria-label="Replay your exploit">
        <h3>Re-run your Module 2 exploit</h3>
        <p>
          {storedExploit?.succeeded
            ? 'This replays the payload you actually wrote earlier — not a stand-in.'
            : 'You have not recorded an exploit yet, so this replays the worked example from Module 2.'}
        </p>

        <ActionBar>
          <TouchTarget primary onClick={runReplay}>
            Replay the attack
          </TouchTarget>
        </ActionBar>

        {result ? (
          <div data-testid="replay-result" data-blocked={result.exploitBlocked ? 'true' : 'false'}>
            <RiskSignal
              level={result.exploitBlocked ? 'contained' : 'exposed'}
              detail={result.reason}
            />
            <details>
              <summary>What the assistant did</summary>
              <p>{result.trace}</p>
            </details>
          </div>
        ) : null}
      </section>

      <section className="m4-sim" aria-label="Mastery check">
        <h3>Why is this deterministic?</h3>
        <p>
          In one sentence: what can the attacker structurally <em>not</em> do here, and which flow
          is cut? Saying it is “safer” is not enough.
        </p>
        <label>
          <span className="visually-hidden">Your explanation</span>
          <textarea
            className="m4-mastery__input"
            data-testid="justification-input"
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Because the untrusted value cannot…"
          />
        </label>

        <ActionBar>
          <TouchTarget
            primary
            disabled={justification.trim().length === 0}
            onClick={() => {
              const evaluated = evaluateMastery({ config, justification })
              setOutcome(evaluated)
              if (evaluated.passed) completeModule('m4', 100)
            }}
          >
            Check my answer
          </TouchTarget>
        </ActionBar>

        {outcome ? (
          <p
            className={`m4-mastery__result m4-mastery__result--${outcome.passed ? 'pass' : 'fail'}`}
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
