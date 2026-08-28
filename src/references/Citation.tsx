/**
 * Citation chips and reference listings.
 *
 * A citation is always an interactive element with an accessible name that says
 * it opens the reference panel — never a bare hyperlink and never inert text.
 */
import { getReference, REFERENCES } from './registry'
import { useReferences } from './ReferenceProvider'
import './ReferenceSurface.css'

export function Citation({ id, children }: { id: string; children?: React.ReactNode }) {
  const { open } = useReferences()
  const reference = getReference(id)
  const shortTitle = reference ? reference.title.split(/[:(]/)[0].trim() : id

  return (
    <button
      type="button"
      className="citation"
      onClick={() => open(id)}
      aria-label={`Reference: ${shortTitle}, opens reference panel`}
      data-citation={id}
    >
      {children ?? shortTitle}
    </button>
  )
}

export function SectionAnchor({ anchor, children }: { anchor: string; children?: React.ReactNode }) {
  const { openSection } = useReferences()
  return (
    <button
      type="button"
      className="citation citation--section"
      onClick={() => openSection(anchor)}
      aria-label={`Research section ${anchor}, opens reference panel`}
      data-section={anchor}
    >
      {children ?? `research §${anchor}`}
    </button>
  )
}

/** Per-module drawer listing every source that module touches. */
export function ModuleReferences({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0) {
    return (
      <section className="reference-list" aria-label="References for this module">
        <h2 className="reference-list__title">References</h2>
        <p className="reference-list__empty" data-testid="empty-references">
          This module cites no external sources.
        </p>
      </section>
    )
  }

  return (
    <section className="reference-list" aria-label="References for this module">
      <h2 className="reference-list__title">References</h2>
      <ul className="reference-list__items">
        {ids.map((id) => (
          <li key={id}>
            <Citation id={id} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Global, deduplicated bibliography. */
export function Bibliography() {
  const entries = Object.values(REFERENCES).sort((a, b) => a.title.localeCompare(b.title))
  return (
    <section className="reference-list" aria-label="Bibliography">
      <h2 className="reference-list__title">Bibliography</h2>
      <ul className="reference-list__items reference-list__items--bibliography">
        {entries.map((reference) => (
          <li key={reference.id}>
            <Citation id={reference.id} />
            <span className="reference-list__meta">
              {reference.authors} · {reference.venue}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
