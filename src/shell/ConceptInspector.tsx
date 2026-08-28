/**
 * The concept inspector: definitions adjacent to the concept, not a tab away.
 */
import { lookup } from '../content/glossary'
import { Citation } from '../references/Citation'
import './Shell.css'

export function ConceptInspector({ term }: { term: string | null }) {
  const result = lookup(term)

  if (result === 'none') {
    return (
      <section className="inspector" aria-label="Concept inspector">
        <h2 className="inspector__title">Concepts</h2>
        <p className="inspector__prompt" data-testid="inspector-prompt">
          Select any highlighted term to see what it means, right here.
        </p>
      </section>
    )
  }

  if (result === 'unavailable') {
    return (
      <section className="inspector" aria-label="Concept inspector">
        <h2 className="inspector__title">Concepts</h2>
        <p className="inspector__unavailable" data-testid="inspector-unavailable">
          Definition unavailable for “{term}”.
        </p>
      </section>
    )
  }

  return (
    <section className="inspector" aria-label="Concept inspector">
      <h2 className="inspector__title">Concepts</h2>
      <article className="inspector__entry" data-testid="inspector-definition">
        <h3 className="inspector__term">{result.term}</h3>
        <p>{result.definition}</p>
        {result.referenceId ? <Citation id={result.referenceId} /> : null}
      </article>
    </section>
  )
}

/** A term in prose that opens its definition in the inspector. */
export function Term({
  name,
  onFocusTerm,
  children,
}: {
  name: string
  onFocusTerm: (term: string) => void
  children?: React.ReactNode
}) {
  return (
    <button type="button" className="term" onClick={() => onFocusTerm(name)} data-term={name}>
      {children ?? name}
    </button>
  )
}
