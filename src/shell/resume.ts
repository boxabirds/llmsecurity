/**
 * Save and resume.
 *
 * Learning is interrupted and resumed, so the shell offers a way back in. If
 * stored progress cannot be read the learner starts cleanly at the first module
 * rather than seeing an error — an unreadable save is not the learner's problem.
 */
import { MODULES } from '../content/modules'
import { readPersistedProgress, type ProgressSnapshot } from '../state/progress'

export interface ResumePoint {
  lastIncompleteModule: string | null
  /** True when there is saved progress worth resuming. */
  hasProgress: boolean
  savedAt: number | null
}

export function resumeFor(progress: ProgressSnapshot | null): ResumePoint {
  if (!progress) return { lastIncompleteModule: null, hasProgress: false, savedAt: null }

  const completed = progress.completedModules ?? {}
  const anyCompleted = Object.values(completed).some(Boolean)
  const firstIncomplete = MODULES.find((m) => !completed[m.id])

  return {
    lastIncompleteModule: firstIncomplete?.id ?? null,
    hasProgress: anyCompleted,
    savedAt: progress.savedAt ?? null,
  }
}

/** Reads persisted progress and derives the resume point in one step. */
export function readResumePoint(): ResumePoint {
  return resumeFor(readPersistedProgress())
}
