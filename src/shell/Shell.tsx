/**
 * The learning shell.
 *
 * Desktop gets three panes (rail, stage, concept-and-reference). Mobile
 * collapses to a single column with a top app bar (course-map drawer) and a
 * bottom bar (stage indicator plus Back/Next in the thumb zone). Progress is
 * saved per device and the learner is offered a way back in.
 */
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES, moduleById, nextModule, previousModule } from '../content/modules'
import { useProgress } from '../state/progress'
import { useViewport } from '../responsive/useViewport'
import { ResponsiveLayout } from '../responsive/ResponsiveLayout'
import { TouchTarget } from '../responsive/TouchTarget'
import { ModuleRail } from './ModuleRail'
import { ConceptInspector } from './ConceptInspector'
import { ModuleReferences } from '../references/Citation'
import { resumeFor } from './resume'
import './Shell.css'

export interface ShellProps {
  moduleId: string
  children: React.ReactNode
  /** Reference ids this module cites, listed in its drawer. */
  referenceIds?: readonly string[]
  /** Term currently in focus, surfaced by the inspector. */
  focusedTerm?: string | null
}

export function Shell({ moduleId, children, referenceIds = [], focusedTerm = null }: ShellProps) {
  const navigate = useNavigate()
  const { isMobile } = useViewport()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resumeDismissed, setResumeDismissed] = useState(false)

  const progress = useProgress()
  const meta = moduleById(moduleId) ?? MODULES[0]
  const resume = resumeFor(progress)
  const previous = previousModule(moduleId)
  const next = nextModule(moduleId)

  const go = useCallback(
    (path: string) => {
      setDrawerOpen(false)
      navigate(path)
    },
    [navigate],
  )

  const rail = (
    <ModuleRail currentModuleId={moduleId} completed={progress.completedModules} />
  )

  const aside = (
    <>
      <ConceptInspector term={focusedTerm} />
      <ModuleReferences ids={referenceIds} />
    </>
  )

  const topBar = (
    <>
      <TouchTarget
        onClick={() => setDrawerOpen((open) => !open)}
        ariaLabel={drawerOpen ? 'Close course map' : 'Open course map'}
      >
        ☰
      </TouchTarget>
      <span className="shell__module-label">
        <span className="shell__module-title">{meta.title}</span>
        <span className="shell__module-stage">{meta.stage}</span>
      </span>
    </>
  )

  const bottomBar = (
    <nav className="shell__bottom-nav" aria-label="Module navigation">
      <TouchTarget
        onClick={() => previous && go(previous.path)}
        disabled={!previous}
        ariaLabel="Previous module"
      >
        ‹ Back
      </TouchTarget>
      <span className="shell__progress-dots" aria-label={`Module ${meta.order + 1} of ${MODULES.length}`}>
        {MODULES.map((m) => (
          <span
            key={m.id}
            className={`shell__dot${m.id === moduleId ? ' shell__dot--current' : ''}${
              progress.completedModules[m.id] ? ' shell__dot--done' : ''
            }`}
            aria-hidden="true"
          />
        ))}
      </span>
      <TouchTarget
        primary
        onClick={() => next && go(next.path)}
        disabled={!next}
        ariaLabel="Next module"
      >
        Next ›
      </TouchTarget>
    </nav>
  )

  const stage = (
    <>
      {resume.hasProgress && !resumeDismissed && resume.lastIncompleteModule !== moduleId ? (
        <aside className="shell__resume" data-testid="resume-banner">
          <p className="shell__resume-text">
            Welcome back — you left off at{' '}
            <strong>{moduleById(resume.lastIncompleteModule ?? '')?.title ?? 'the start'}</strong>.
          </p>
          <div className="shell__resume-actions">
            <TouchTarget
              primary
              onClick={() => {
                const target = moduleById(resume.lastIncompleteModule ?? '')
                if (target) go(target.path)
                setResumeDismissed(true)
              }}
            >
              Resume
            </TouchTarget>
            <TouchTarget destructive onClick={() => setResumeDismissed(true)}>
              Dismiss
            </TouchTarget>
          </div>
        </aside>
      ) : null}

      {children}

      <p className="shell__save-indicator" data-testid="save-indicator">
        {resume.savedAt
          ? 'Progress saved on this device'
          : 'Progress will be saved on this device'}
      </p>

      {isMobile ? (
        <details className="shell__mobile-aside">
          <summary>Concepts &amp; references</summary>
          {aside}
        </details>
      ) : null}
    </>
  )

  return (
    <div className="shell">
      <a className="shell__skip" href="#main-content">
        Skip to content
      </a>

      <ResponsiveLayout
        rail={rail}
        stage={stage}
        aside={aside}
        topBar={topBar}
        bottomBar={bottomBar}
      />

      {isMobile && drawerOpen ? (
        <div className="shell__drawer" data-testid="course-map-drawer" role="dialog" aria-label="Course map">
          <div className="shell__drawer-header">
            <h2>Course map</h2>
            <TouchTarget onClick={() => setDrawerOpen(false)}>Close</TouchTarget>
          </div>
          <ModuleRail
            currentModuleId={moduleId}
            completed={progress.completedModules}
            onNavigate={(m) => go(m.path)}
          />
        </div>
      ) : null}
    </div>
  )
}
