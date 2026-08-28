/**
 * Lab 2 — corpus poisoning.
 *
 * A thousand ordinary wiki pages, one genuine policy page, and — when the
 * learner adds it — exactly ONE crafted passage. The crafted passage is not
 * hidden and nothing is exploited: it simply ranks first, and the answer is
 * written from whatever ranks first.
 *
 * The corpus is generated lazily once (see `benignDocs`) and the page list is
 * rendered with `content-visibility: auto`, so a thousand rows cost almost
 * nothing until they are scrolled into view.
 */
import { TouchTarget, ActionBar, ChipToggle } from '../../responsive/TouchTarget'
import { RiskSignal } from '../../a11y/RiskSignal'
import { Citation } from '../../references/Citation'
import { announce } from '../../a11y/announce'
import {
  runRagLab,
  ragCorpus,
  RAG_QUERY,
  BENIGN_DOC_COUNT,
  POISONED_DOC,
  type RagLabResult,
} from './labs'
import './m3.css'

export interface RagPoisonLabProps {
  poisoned: boolean
  onPoisonedChange: (poisoned: boolean) => void
  result: RagLabResult | null
  onRun: (result: RagLabResult) => void
}

export function RagPoisonLab({ poisoned, onPoisonedChange, result, onRun }: RagPoisonLabProps) {
  const corpus = ragCorpus(poisoned)

  function run() {
    const outcome = runRagLab({ poisoned })
    announce(outcome.announcement)
    onRun(outcome)
  }

  return (
    <section className="m3-lab" data-testid="rag-lab" aria-label="Corpus poisoning lab">
      <h3 className="m3-lab__title">Corpus poisoning</h3>
      <p className="m3-lab__note">
        <Citation id="poisonedRag">PoisonedRAG</Citation> reported roughly 90% attack success using
        five poisoned texts per targeted question against a corpus of millions;{' '}
        <Citation id="corruptRag">CorruptRAG</Citation> reaches comparable success with a single
        poisoned text. This lab is the single-document variant: {BENIGN_DOC_COUNT} generated pages,
        one genuine policy page, and at most one crafted passage.
      </p>

      <p className="m3-lab__prompt">
        <strong>The question:</strong> {RAG_QUERY}
      </p>

      <div className="m3-lab__controls">
        <ChipToggle
          label="Add the one crafted passage"
          selected={poisoned}
          onToggle={() => onPoisonedChange(!poisoned)}
          description={poisoned ? 'in the corpus' : 'not in the corpus'}
        />
      </div>

      <ActionBar>
        <TouchTarget primary onClick={run}>
          Ask the assistant
        </TouchTarget>
      </ActionBar>

      {result ? (
        <div
          className={`m3-result${result.compromised ? ' m3-result--breached' : ' m3-result--safe'}`}
          data-testid="lab-result"
          data-lab="rag"
          data-compromised={result.compromised ? 'true' : 'false'}
        >
          <RiskSignal
            level={result.compromised ? 'exposed' : 'contained'}
            detail={
              result.compromised
                ? `One passage out of ${result.corpusSize} wrote the answer.`
                : `The genuine policy page ranked first out of ${result.corpusSize}.`
            }
          />

          <p className="m3-result__label">The answer the learner sees:</p>
          <p className="m3-result__response" data-testid="rag-answer">
            {result.response}
          </p>

          <p className="m3-result__label">Passages retrieved, in rank order:</p>
          <ol className="m3-retrieved" data-testid="rag-retrieved">
            {result.retrieval.top.map((doc) => (
              <li
                key={doc.id}
                className={`m3-retrieved__item${doc.poisoned ? ' m3-retrieved__item--poison' : ''}`}
                data-poisoned={doc.poisoned ? 'true' : 'false'}
              >
                <span className="m3-retrieved__id">{doc.id}</span>
                <span className="m3-retrieved__text">{doc.text}</span>
              </li>
            ))}
          </ol>

          <details className="m3-result__trace">
            <summary>Why that passage won</summary>
            <p>{result.trace}</p>
          </details>
        </div>
      ) : null}

      <details className="m3-corpus">
        <summary className="m3-corpus__summary">
          Inspect the corpus ({corpus.length} pages{poisoned ? ', one of them crafted' : ''})
        </summary>
        <ul className="m3-corpus__list" data-testid="rag-corpus-list">
          {corpus.map((doc) => (
            <li
              key={doc.id}
              className={`m3-corpus__doc${doc.poisoned ? ' m3-corpus__doc--poison' : ''}`}
              data-poisoned={doc.poisoned ? 'true' : 'false'}
            >
              <span className="m3-corpus__id">{doc.id}</span>
              <span className="m3-corpus__text">{doc.text}</span>
            </li>
          ))}
        </ul>
      </details>

      {poisoned ? (
        <p className="m3-lab__note" data-testid="rag-poison-source">
          The crafted passage is <code>{POISONED_DOC.id}</code>. Anyone with write access to the
          corpus can add it; no access to the model or the application is needed.
        </p>
      ) : null}
    </section>
  )
}
