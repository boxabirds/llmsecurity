/**
 * The Module 3 shell.
 *
 * One surface hosts all three labs — a segmented control on desktop, stacked
 * sections on narrow viewports where switching costs more than scrolling.
 *
 * Two things make it a module rather than three demos:
 *
 *  · the ROOT-CAUSE LEDGER, where the learner records which layer each attack
 *    acted at. Three attacks that look nothing alike land in three different
 *    rows, and only once all three rows are filled does the shell state the
 *    conclusion they were built to earn: one root cause, three layers.
 *
 *  · the WHY-INSPECTOR, which opens whenever an attempt does not land. A failed
 *    attempt is a diagnosis and a way forward, never an error state.
 */
import { useState } from 'react'
import { TouchTarget } from '../../responsive/TouchTarget'
import { useViewport } from '../../responsive/useViewport'
import { announce } from '../../a11y/announce'
import { SuffixLab } from './SuffixLab'
import { RagPoisonLab } from './RagPoisonLab'
import { McpPoisonLab } from './McpPoisonLab'
import {
  runSuffixLab,
  runRagLab,
  runMcpLab,
  CLEAN_TOOL_DESCRIPTION,
  POISONED_TOOL_DESCRIPTION,
  MOCK_SUFFIX,
  LAB_ORDER,
  LAB_LAYERS,
  LAB_TITLES,
  LAYER_ORDER,
  LAYER_LABELS,
  ROOT_CAUSE,
  type LabId,
  type LabResult,
  type Layer,
  type SuffixLabResult,
  type RagLabResult,
  type McpLabResult,
} from './labs'
import './m3.css'

const LAB_ONE_LINERS: Record<LabId, string> = {
  suffix: 'Nothing but tokens appended to the prompt.',
  rag: 'One crafted passage among a thousand ordinary ones.',
  mcp: 'A tool description edited; not one line of its code.',
}

/** What each lab's worked example fixes, phrased as the next thing to try. */
const WORKED_EXAMPLE_LABELS: Record<LabId, string> = {
  suffix: 'Append the illustrative suffix and send it again',
  rag: 'Add the one crafted passage and ask again',
  mcp: 'Publish a poisoned description and call it again',
}

export function LabShell() {
  const { isMobile } = useViewport()

  const [active, setActive] = useState<LabId>('suffix')
  const [lastRun, setLastRun] = useState<LabId | null>(null)

  const [suffix, setSuffix] = useState('')
  const [poisoned, setPoisoned] = useState(false)
  const [description, setDescription] = useState(CLEAN_TOOL_DESCRIPTION)

  const [suffixResult, setSuffixResult] = useState<SuffixLabResult | null>(null)
  const [ragResult, setRagResult] = useState<RagLabResult | null>(null)
  const [mcpResult, setMcpResult] = useState<McpLabResult | null>(null)

  const [ledger, setLedger] = useState<Partial<Record<LabId, Layer>>>({})

  const results: Record<LabId, LabResult | null> = {
    suffix: suffixResult,
    rag: ragResult,
    mcp: mcpResult,
  }

  function record(lab: LabId, result: SuffixLabResult | RagLabResult | McpLabResult) {
    if (result.lab === 'suffix') setSuffixResult(result)
    else if (result.lab === 'rag') setRagResult(result)
    else setMcpResult(result)
    setLastRun(lab)
  }

  /** Re-runs a lab from its worked example, so a stalled attempt always has a way on. */
  function runWorkedExample(lab: LabId) {
    if (lab === 'suffix') {
      setSuffix(MOCK_SUFFIX)
      const result = runSuffixLab({ suffix: MOCK_SUFFIX })
      announce(result.announcement)
      record('suffix', result)
      return
    }
    if (lab === 'rag') {
      setPoisoned(true)
      const result = runRagLab({ poisoned: true })
      announce(result.announcement)
      record('rag', result)
      return
    }
    setDescription(POISONED_TOOL_DESCRIPTION)
    const result = runMcpLab({ description: POISONED_TOOL_DESCRIPTION })
    announce(result.announcement)
    record('mcp', result)
  }

  const inspected = lastRun ? results[lastRun] : null
  const showInspector = inspected !== null && !inspected.compromised

  const recordedCorrectly = LAB_ORDER.filter((lab) => ledger[lab] === LAB_LAYERS[lab])
  const ledgerComplete = recordedCorrectly.length === LAB_ORDER.length

  function renderLab(lab: LabId) {
    if (lab === 'suffix') {
      return (
        <SuffixLab
          suffix={suffix}
          onSuffixChange={setSuffix}
          result={suffixResult}
          onRun={(result) => record('suffix', result)}
        />
      )
    }
    if (lab === 'rag') {
      return (
        <RagPoisonLab
          poisoned={poisoned}
          onPoisonedChange={setPoisoned}
          result={ragResult}
          onRun={(result) => record('rag', result)}
        />
      )
    }
    return (
      <McpPoisonLab
        description={description}
        onDescriptionChange={setDescription}
        result={mcpResult}
        onRun={(result) => record('mcp', result)}
      />
    )
  }

  return (
    <section className="m3-shell" data-testid="lab-shell" data-layout={isMobile ? 'stacked' : 'tabs'}>
      {isMobile ? (
        // Narrow viewports stack the labs: scrolling is cheaper than switching.
        <div className="m3-shell__stack">
          {LAB_ORDER.map((lab) => (
            <div key={lab} className="m3-shell__stacked-lab">
              {renderLab(lab)}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="m3-segmented" role="tablist" aria-label="Attack labs">
            {LAB_ORDER.map((lab) => (
              <button
                key={lab}
                type="button"
                role="tab"
                id={`m3-tab-${lab}`}
                aria-selected={active === lab}
                aria-controls={`m3-panel-${lab}`}
                className={`m3-segmented__item${active === lab ? ' m3-segmented__item--on' : ''}`}
                onClick={() => setActive(lab)}
                data-testid={`lab-tab-${lab}`}
              >
                <span className="m3-segmented__label">{LAB_TITLES[lab]}</span>
                <span className="m3-segmented__hint">{LAB_ONE_LINERS[lab]}</span>
              </button>
            ))}
          </div>

          <div
            className="m3-shell__panel"
            role="tabpanel"
            id={`m3-panel-${active}`}
            aria-labelledby={`m3-tab-${active}`}
          >
            {renderLab(active)}
          </div>
        </>
      )}

      {showInspector && inspected ? (
        <aside
          className="m3-inspector"
          data-testid="why-inspector"
          data-lab={inspected.lab}
          aria-label="Why that attempt did not land"
        >
          <h3 className="m3-inspector__title">That attempt did not land — here is why</h3>
          <p className="m3-inspector__why">{inspected.whyNot}</p>
          <p className="m3-inspector__trace">{inspected.trace}</p>
          <TouchTarget primary onClick={() => runWorkedExample(inspected.lab)}>
            {WORKED_EXAMPLE_LABELS[inspected.lab]}
          </TouchTarget>
        </aside>
      ) : null}

      <section className="m3-ledger" data-testid="ledger" aria-label="Root-cause ledger">
        <h3 className="m3-ledger__title">Root-cause ledger</h3>
        <p className="m3-ledger__intro">
          After each attack lands, record the layer it acted at. Three rows, three layers — then
          read what they have in common.
        </p>

        <ul className="m3-ledger__rows">
          {LAB_ORDER.map((lab) => {
            const result = results[lab]
            const landed = result?.compromised === true
            const chosen = ledger[lab]
            const correct = chosen === LAB_LAYERS[lab]

            return (
              <li key={lab} className="m3-ledger__row">
                <span className="m3-ledger__lab">{LAB_TITLES[lab]}</span>

                {!landed ? (
                  <span className="m3-ledger__pending" data-testid={`ledger-pending-${lab}`}>
                    Land this attack first, then record its layer.
                  </span>
                ) : (
                  <>
                    <span className="m3-ledger__choices">
                      {LAYER_ORDER.map((layer) => (
                        <TouchTarget
                          key={layer}
                          primary={chosen === layer}
                          ariaLabel={`${LAB_TITLES[lab]}: acted at ${LAYER_LABELS[layer]}`}
                          onClick={() => setLedger((prev) => ({ ...prev, [lab]: layer }))}
                        >
                          {LAYER_LABELS[layer]}
                        </TouchTarget>
                      ))}
                    </span>

                    {chosen ? (
                      <span
                        className={`m3-ledger__entry${correct ? '' : ' m3-ledger__entry--wrong'}`}
                        data-testid={`ledger-entry-${lab}`}
                        data-layer={chosen}
                        data-correct={correct ? 'true' : 'false'}
                      >
                        {correct
                          ? `Recorded: acted at ${LAYER_LABELS[chosen]}.`
                          : `Not quite. Nothing at ${LAYER_LABELS[chosen]} was touched in this lab — look again at what you actually changed.`}
                      </span>
                    ) : null}
                  </>
                )}
              </li>
            )
          })}
        </ul>

        {ledgerComplete ? (
          <div className="m3-ledger__conclusion" data-testid="root-cause-conclusion">
            <h4 className="m3-ledger__conclusion-title">
              Three layers. One root cause.
            </h4>
            <p>{ROOT_CAUSE}</p>
            <p>
              That is why these are not three problems with three fixes. A filter tuned for suffixes
              does nothing about a poisoned passage, and sanitising a corpus does nothing about a
              tool description — because none of them touch the reason any of it worked.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  )
}
