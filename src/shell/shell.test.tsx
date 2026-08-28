/**
 * Story 9 — shell (TC-01..TC-03), concept inspector (TC-04..TC-06),
 * responsive navigation and resume (TC-07..TC-12).
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Shell } from './Shell'
import { ConceptInspector } from './ConceptInspector'
import { resumeFor } from './resume'
import { ReferenceProvider } from '../references/ReferenceProvider'
import { useProgress, PROGRESS_STORAGE_KEY, emptyProgress } from '../state/progress'
import { setViewportWidth } from '../test/setup'

function renderShell(moduleId = 'm2', ui: React.ReactNode = <p>Stage content</p>) {
  return render(
    <MemoryRouter initialEntries={[`/module/${moduleId}`]}>
      <ReferenceProvider>
        <Shell moduleId={moduleId} referenceIds={['echoleak']}>
          {ui}
        </Shell>
      </ReferenceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useProgress.setState({ ...emptyProgress() })
})

describe('TC-01 the desktop shell presents three panes', () => {
  it('renders rail, stage and concept/reference pane', () => {
    setViewportWidth(1280)
    const { container } = renderShell()

    expect(container.querySelector('.layout')).toHaveAttribute('data-layout', 'multi-pane')
    expect(screen.getByRole('navigation', { name: 'Course modules' })).toBeInTheDocument()
    expect(screen.getByText('Stage content')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Concepts and references' })).toBeInTheDocument()
  })
})

describe('TC-02 the rail highlights the current cognitive stage', () => {
  it('marks the stage of the current module on the labelled path', () => {
    setViewportWidth(1280)
    renderShell('m2')

    // m2 is an Experience module.
    const stage = screen.getByText('Experience', { selector: '.rail__stage' })
    expect(stage).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Understand', { selector: '.rail__stage' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('marks the current module as the current page', () => {
    setViewportWidth(1280)
    renderShell('m2')
    const links = screen.getAllByRole('link', { current: 'page' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('data-module', 'm2')
  })
})

describe('TC-03 the stage shows one primary interaction at a time', () => {
  it('renders a single stage region', () => {
    setViewportWidth(1280)
    const { container } = renderShell()
    expect(container.querySelectorAll('.layout__stage')).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})

describe('TC-04..TC-06 the concept inspector', () => {
  it('TC-04 shows a neutral prompt when no term is focused', () => {
    render(
      <ReferenceProvider>
        <ConceptInspector term={null} />
      </ReferenceProvider>,
    )
    expect(screen.getByTestId('inspector-prompt')).toHaveTextContent('Select any highlighted term')
  })

  it('TC-05 shows the definition adjacent to the concept', () => {
    render(
      <ReferenceProvider>
        <ConceptInspector term="lethal trifecta" />
      </ReferenceProvider>,
    )
    const entry = screen.getByTestId('inspector-definition')
    expect(entry).toHaveTextContent('lethal trifecta')
    expect(entry).toHaveTextContent('access to private data')
    // The definition can lead to its source.
    expect(screen.getByRole('button', { name: /opens reference panel/ })).toBeInTheDocument()
  })

  it('TC-06 shows a graceful note when a definition is unavailable', () => {
    render(
      <ReferenceProvider>
        <ConceptInspector term="quantum entanglement" />
      </ReferenceProvider>,
    )
    expect(screen.getByTestId('inspector-unavailable')).toHaveTextContent('Definition unavailable')
  })
})

describe('TC-07 below the mobile breakpoint the shell is a single column', () => {
  it('renders the top app bar and bottom navigation, hiding the side panes', () => {
    setViewportWidth(390)
    const { container } = renderShell()

    expect(container.querySelector('.layout')).toHaveAttribute('data-layout', 'single-column')
    expect(screen.getByRole('button', { name: 'Open course map' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Module navigation' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Course modules' })).not.toBeInTheDocument()
  })
})

describe('TC-08 at desktop the full three-pane shell is presented', () => {
  it('shows the rail rather than the mobile bars', () => {
    setViewportWidth(1280)
    renderShell()
    expect(screen.getByRole('navigation', { name: 'Course modules' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open course map' })).not.toBeInTheDocument()
  })
})

describe('TC-09 the mobile menu opens a course-map drawer with bottom Back/Next', () => {
  it('opens and closes the drawer from the top app bar', async () => {
    setViewportWidth(390)
    const user = userEvent.setup()
    renderShell()

    expect(screen.queryByTestId('course-map-drawer')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open course map' }))

    const drawer = screen.getByTestId('course-map-drawer')
    expect(drawer).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('anchors Back and Next in the bottom bar', () => {
    setViewportWidth(390)
    renderShell('m2')
    const nav = screen.getByRole('navigation', { name: 'Module navigation' })
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Previous module' }))
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Next module' }))
  })

  it('disables Back on the first module and Next on the last', () => {
    setViewportWidth(390)
    const { unmount } = renderShell('m0')
    expect(screen.getByRole('button', { name: 'Previous module' })).toBeDisabled()
    unmount()

    renderShell('m6')
    expect(screen.getByRole('button', { name: 'Next module' })).toBeDisabled()
  })
})

describe('TC-10 returning with saved progress offers a resume point', () => {
  it('shows the resume banner and the save indicator', () => {
    setViewportWidth(1280)
    useProgress.setState({
      ...emptyProgress(),
      completedModules: { m0: true },
      savedAt: Date.now(),
    })

    renderShell('m0')

    expect(screen.getByTestId('resume-banner')).toHaveTextContent('you left off at')
    expect(screen.getByTestId('save-indicator')).toHaveTextContent('Progress saved on this device')
  })

  it('derives the resume point as the first incomplete module', () => {
    const point = resumeFor({
      ...emptyProgress(),
      completedModules: { m0: true, m1: true },
      savedAt: 1,
    })
    expect(point.hasProgress).toBe(true)
    expect(point.lastIncompleteModule).toBe('m2')
  })
})

describe('TC-11 a first-time learner sees no resume prompt', () => {
  it('starts cleanly with no banner', () => {
    setViewportWidth(1280)
    renderShell('m0')

    expect(screen.queryByTestId('resume-banner')).not.toBeInTheDocument()
    expect(screen.getByTestId('save-indicator')).toHaveTextContent(
      'Progress will be saved on this device',
    )
  })

  it('reports no progress for an empty snapshot', () => {
    expect(resumeFor(emptyProgress()).hasProgress).toBe(false)
    expect(resumeFor(null).hasProgress).toBe(false)
  })
})

describe('TC-12 unreadable saved progress starts cleanly with no error', () => {
  it('falls back to a fresh start rather than surfacing a failure', () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, '{ this is not valid json')

    const point = resumeFor(null)
    expect(point.hasProgress).toBe(false)
    expect(point.lastIncompleteModule).toBeNull()

    setViewportWidth(1280)
    renderShell('m0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resume-banner')).not.toBeInTheDocument()
  })
})
