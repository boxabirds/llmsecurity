/**
 * Openable references.
 *
 * Every citation is a live control, never inert text. Activating one opens the
 * reference surface in place — a right-hand slide-over on desktop, a
 * full-screen bottom sheet on mobile — so the learner can verify a claim
 * without losing their place. The panel is pedagogical rather than
 * bibliographic: it states the claim as this tutorial uses it and the caveat
 * that bounds it, which is how learners are trained to read sources critically.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getReference, type Reference } from './registry'
import { useViewport } from '../responsive/useViewport'
import { onGlobalKey } from '../a11y/keyboard'
import { useEffect } from 'react'
import './ReferenceSurface.css'

export interface ResearchSection {
  anchor: string
  title: string
  summary: string
}

/** Internal research-doc anchors open the same surface, scoped to a section. */
export const RESEARCH_SECTIONS: Record<string, ResearchSection> = {
  '3.1': {
    anchor: '3.1',
    title: 'Research §3.1 — Prompt injection (direct and indirect)',
    summary:
      'Indirect injection is the enterprise-critical form: instructions hidden in emails, documents or tickets that the model processes on the victim\'s behalf.',
  },
  '3.6': {
    anchor: '3.6',
    title: 'Research §3.6 — Guardrail and detection-layer weaknesses',
    summary:
      'Classifier guardrails are structurally bypassable, benchmark robustness does not transfer, and tightening them drives over-defense.',
  },
  '4.1': {
    anchor: '4.1',
    title: 'Research §4.1 — Defenses that hold',
    summary:
      'Architectural, deterministic control- and data-flow separation (CaMeL, the six design patterns) is what actually prevents rather than detects.',
  },
  '6': {
    anchor: '6',
    title: 'Research §6 — Currently indefensible areas',
    summary:
      'Eight areas where no known defense is deterministic, all tracing to instruction/data non-separation amplified by agents-with-tools and adaptive adversaries.',
  },
}

type Target =
  | { kind: 'reference'; reference: Reference }
  | { kind: 'section'; section: ResearchSection }
  | { kind: 'unavailable'; id: string }

interface ReferenceContextValue {
  target: Target | null
  open: (id: string) => void
  openSection: (anchor: string) => void
  close: () => void
}

const ReferenceContext = createContext<ReferenceContextValue | null>(null)

export function useReferences(): ReferenceContextValue {
  const ctx = useContext(ReferenceContext)
  if (!ctx) throw new Error('useReferences must be used inside a ReferenceProvider')
  return ctx
}

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null)
  // Focus returns to the citation that opened the surface when it is dismissed.
  const opener = useRef<HTMLElement | null>(null)

  const open = useCallback((id: string) => {
    opener.current = document.activeElement as HTMLElement | null
    const reference = getReference(id)
    setTarget(reference ? { kind: 'reference', reference } : { kind: 'unavailable', id })
  }, [])

  const openSection = useCallback((anchor: string) => {
    opener.current = document.activeElement as HTMLElement | null
    const section = RESEARCH_SECTIONS[anchor]
    setTarget(section ? { kind: 'section', section } : { kind: 'unavailable', id: `§${anchor}` })
  }, [])

  const close = useCallback(() => {
    setTarget(null)
    opener.current?.focus()
  }, [])

  const value = useMemo(
    () => ({ target, open, openSection, close }),
    [target, open, openSection, close],
  )

  return (
    <ReferenceContext.Provider value={value}>
      {children}
      <ReferenceSurface />
    </ReferenceContext.Provider>
  )
}

export function ReferenceSurface() {
  const { target, close } = useReferences()
  const { isMobile } = useViewport()

  useEffect(() => {
    if (!target) return
    return onGlobalKey('Escape', close)
  }, [target, close])

  if (!target) return null

  const presentation = isMobile ? 'sheet' : 'slideover'

  return (
    <div className="reference-backdrop" onClick={close} role="presentation">
      <section
        className={`reference-surface reference-surface--${presentation}`}
        data-presentation={presentation}
        role="dialog"
        aria-modal="true"
        aria-label="Reference"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="reference-surface__header">
          <h2 className="reference-surface__title">
            {target.kind === 'reference'
              ? target.reference.title
              : target.kind === 'section'
                ? target.section.title
                : 'Reference unavailable'}
          </h2>
          <button type="button" className="reference-surface__close" onClick={close}>
            Close
          </button>
        </header>

        {target.kind === 'reference' ? (
          <div className="reference-surface__body">
            <p className="reference-surface__meta">
              {target.reference.authors} · {target.reference.venue} · {target.reference.date}
            </p>
            <h3 className="reference-surface__heading">Summary</h3>
            <p>{target.reference.summary}</p>
            <h3 className="reference-surface__heading">Claim as used here</h3>
            <p>{target.reference.claimAsUsed}</p>
            <h3 className="reference-surface__heading">Confidence &amp; caveat</h3>
            <p className="reference-surface__caveat">{target.reference.caveat}</p>
            <a
              className="reference-surface__source"
              href={target.reference.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open source ↗
            </a>
          </div>
        ) : target.kind === 'section' ? (
          <div className="reference-surface__body">
            <p>{target.section.summary}</p>
            <a
              className="reference-surface__source"
              href={`https://github.com/boxabirds/llmsecurity/blob/main/docs/llm-enterprise-security-research.md`}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open the full research document ↗
            </a>
          </div>
        ) : (
          <div className="reference-surface__body">
            <p data-testid="reference-unavailable">
              This source could not be loaded ({target.id}). The full reference list is available in
              the research document.
            </p>
            <a
              className="reference-surface__source"
              href="https://github.com/boxabirds/llmsecurity/blob/main/docs/llm-enterprise-security-research.md"
              target="_blank"
              rel="noreferrer noopener"
            >
              Open the research document ↗
            </a>
          </div>
        )}
      </section>
    </div>
  )
}
