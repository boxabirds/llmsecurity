/**
 * The layout mechanism: single column below the mobile breakpoint, the full
 * multi-pane arrangement at desktop. The shell supplies the pane content; this
 * component owns only how those panes are arranged per viewport.
 */
import type { ReactNode } from 'react'
import { useViewport } from './useViewport'
import './ResponsiveLayout.css'

export interface ResponsiveLayoutProps {
  rail?: ReactNode
  stage: ReactNode
  aside?: ReactNode
  topBar?: ReactNode
  bottomBar?: ReactNode
}

export function ResponsiveLayout({ rail, stage, aside, topBar, bottomBar }: ResponsiveLayoutProps) {
  const { breakpoint, isMobile } = useViewport()
  const layout = isMobile ? 'single-column' : breakpoint === 'tablet' ? 'two-pane' : 'multi-pane'

  return (
    <div className={`layout layout--${layout}`} data-layout={layout} data-breakpoint={breakpoint}>
      {isMobile && topBar ? <header className="layout__top-bar">{topBar}</header> : null}

      {!isMobile && rail ? (
        <nav className="layout__rail" aria-label="Course modules">
          {rail}
        </nav>
      ) : null}

      <main className="layout__stage" id="main-content">
        {stage}
      </main>

      {breakpoint === 'desktop' && aside ? (
        <aside className="layout__aside" aria-label="Concepts and references">
          {aside}
        </aside>
      ) : null}

      {isMobile && bottomBar ? (
        <footer className="layout__bottom-bar">{bottomBar}</footer>
      ) : null}
    </div>
  )
}
