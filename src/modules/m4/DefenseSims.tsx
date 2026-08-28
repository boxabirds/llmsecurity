/**
 * Module 4 defense interactives.
 *
 * CaMeLFlow lets the learner attempt the forbidden and watch a *structural*
 * block hold — the felt contrast with the probabilistic filters they defeated
 * in Modules 2 and 3. The picker and builder make the trade-off tangible:
 * every defense costs capability, and residual risk never reaches zero.
 */
import { useMemo, useState } from 'react'
import { ChipToggle, TouchTarget, ActionBar } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { announce } from '../../a11y/announce'
import { Citation } from '../../references/Citation'
import {
  PATTERNS,
  LAYERS,
  RECOMMENDED_PATTERN,
  patternById,
  layerById,
  riskScore,
  type LayerId,
  type PatternId,
} from './patterns'
import './m4.css'

// ---------------------------------------------------------------------------
// CaMeLFlow — attempt the forbidden, watch the capability check hold
// ---------------------------------------------------------------------------

export function CaMeLFlow() {
  const [tainted, setTainted] = useState(false)
  const [outcome, setOutcome] = useState<'blocked' | 'allowed' | null>(null)

  function route() {
    const blocked = tainted
    setOutcome(blocked ? 'blocked' : 'allowed')
    announce(
      blocked
        ? 'Blocked: a value tagged untrusted cannot reach the send tool.'
        : 'Allowed: a trusted value reached the send tool normally.',
    )
  }

  return (
    <section className="m4-sim" aria-label="Capability check walkthrough" data-testid="camel-flow">
      <h3>Try to route a value to a tool</h3>
      <p>
        In a <Citation id="camel">CaMeL</Citation>-style runtime every value carries a capability
        tag. Mark this value untrusted, then try to send it.
      </p>

      <div className="m4-flow">
        <div className="m4-flow__node">
          <span className="m4-flow__label">Value</span>
          <ChipToggle
            label={tainted ? 'tagged untrusted' : 'tagged trusted'}
            selected={tainted}
            onToggle={() => {
              setTainted((t) => !t)
              setOutcome(null)
            }}
          />
        </div>
        <span className="m4-flow__arrow" aria-hidden="true">
          →
        </span>
        <div className="m4-flow__node m4-flow__node--check">
          <span className="m4-flow__label">Capability check</span>
        </div>
        <span className="m4-flow__arrow" aria-hidden="true">
          →
        </span>
        <div className="m4-flow__node">
          <span className="m4-flow__label">send_email tool</span>
        </div>
      </div>

      <ActionBar>
        <TouchTarget primary onClick={route}>
          Route the value
        </TouchTarget>
      </ActionBar>

      {outcome ? (
        <div data-testid="camel-outcome" data-blocked={outcome === 'blocked' ? 'true' : 'false'}>
          <RiskSignal
            level={outcome === 'blocked' ? 'contained' : 'elevated'}
            detail={
              outcome === 'blocked'
                ? 'Blocked by the capability check. This is not a filter that usually catches it — the flow is structurally impossible, so there is no attempt count to grind down.'
                : 'Allowed: this value is trusted, so the same tool call proceeds normally. The rule constrains data flow, not the tool.'
            }
          />
        </div>
      ) : null}
    </section>
  )
}

// ---------------------------------------------------------------------------
// DefensePatternPicker — recommended default first, the rest behind disclosure
// ---------------------------------------------------------------------------

export function DefensePatternPicker({
  selected,
  onSelect,
}: {
  selected: PatternId | null
  onSelect: (id: PatternId) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const recommended = patternById(RECOMMENDED_PATTERN)
  const others = PATTERNS.filter((p) => p.id !== RECOMMENDED_PATTERN)
  const current = selected ? patternById(selected) : null

  return (
    <section className="m4-sim" aria-label="Defense pattern picker" data-testid="pattern-picker">
      <h3>Choose a pattern for this workflow</h3>
      <p>
        Six patterns from <Citation id="designPatterns">the design-patterns paper</Citation>. Start
        with the one that fits most assistant workflows; open the rest when you want to compare.
      </p>

      <ChipToggle
        label={`${recommended.name} (recommended)`}
        description={recommended.summary}
        selected={selected === recommended.id}
        onToggle={() => onSelect(recommended.id)}
      />

      <details
        className="m4-more"
        open={showAll}
        onToggle={(e) => setShowAll((e.target as HTMLDetailsElement).open)}
      >
        <summary data-testid="more-patterns">Compare the other five patterns</summary>
        <div className="m4-pattern-list">
          {others.map((pattern) => (
            <ChipToggle
              key={pattern.id}
              label={pattern.name}
              description={pattern.summary}
              selected={selected === pattern.id}
              onToggle={() => onSelect(pattern.id)}
            />
          ))}
        </div>
      </details>

      {current ? (
        <div className="m4-readout" data-testid="tradeoff-readout">
          <div className="m4-readout__axis">
            <span className="m4-readout__label">Residual capability</span>
            <meter
              min={0}
              max={100}
              value={current.residualCapability}
              data-testid="residual-capability"
            >
              {current.residualCapability}%
            </meter>
            <span className="m4-readout__value">{current.residualCapability}%</span>
          </div>
          <div className="m4-readout__axis">
            <span className="m4-readout__label">Residual risk</span>
            <meter min={0} max={100} value={current.residualRisk} data-testid="residual-risk">
              {current.residualRisk}%
            </meter>
            <span className="m4-readout__value">{current.residualRisk}%</span>
          </div>
          <p className="m4-readout__rationale">{current.rationale}</p>
        </div>
      ) : null}
    </section>
  )
}

// ---------------------------------------------------------------------------
// ArchitectureBuilder — stack layers, watch the score, see what each stops
// ---------------------------------------------------------------------------

export function ArchitectureBuilder({
  layers,
  onToggleLayer,
}: {
  layers: readonly LayerId[]
  onToggleLayer: (id: LayerId) => void
}) {
  const score = useMemo(() => riskScore(layers), [layers])

  return (
    <section className="m4-sim" aria-label="Defense-in-depth builder" data-testid="architecture-builder">
      <h3>Stack your defense in depth</h3>
      <div className="m4-layers">
        {LAYERS.map((layer) => (
          <ChipToggle
            key={layer.id}
            label={layer.name}
            description={layer.deterministic ? 'deterministic' : 'probabilistic'}
            selected={layers.includes(layer.id)}
            onToggle={() => onToggleLayer(layer.id)}
          />
        ))}
      </div>

      <p className="m4-score" data-testid="risk-score" data-score={score}>
        Residual risk score: <strong>{score}</strong> / 100
      </p>
      <p className="m4-score__note">
        The score never reaches zero. Some of this problem is unsolved — Module 5 is about exactly
        that.
      </p>

      <ul className="m4-attribution" data-testid="layer-attribution">
        {layers.map((id) => (
          <li key={id}>
            <strong>{layerById(id).name}:</strong> {layerById(id).stopsAttack}
          </li>
        ))}
      </ul>
    </section>
  )
}
