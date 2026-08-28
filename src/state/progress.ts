/**
 * Shared progress store.
 *
 * Persistence is localStorage-only and per-device by design (no backend, no
 * data egress — the same property the tutorial teaches). The schema is
 * versioned and minimal, and reads are cached so the store is parsed once per
 * app load rather than on every render.
 */
import { create } from 'zustand'

export const PROGRESS_SCHEMA_VERSION = 1
export const PROGRESS_STORAGE_KEY = 'llmsec.progress.v1'

/** Captured in M2 so M4 can replay the learner's own exploit against defenses. */
export interface StoredExploit {
  surface: string
  payload: string
  succeeded: boolean
}

export interface ProgressSnapshot {
  version: number
  /** moduleId -> completed */
  completedModules: Record<string, boolean>
  /** owaspId -> visited (drives the M1 map filling in) */
  visitedRisks: Record<string, boolean>
  /** moduleId -> predicted confidence 0..100, for the calibration mirror */
  predictions: Record<string, number>
  /** moduleId -> actual score 0..100 */
  scores: Record<string, number>
  exploit: StoredExploit | null
  savedAt: number | null
}

export function emptyProgress(): ProgressSnapshot {
  return {
    version: PROGRESS_SCHEMA_VERSION,
    completedModules: {},
    visitedRisks: {},
    predictions: {},
    scores: {},
    exploit: null,
    savedAt: null,
  }
}

/**
 * Reads persisted progress. Returns null when nothing is stored, when the
 * payload cannot be parsed, or when the schema version does not match — the
 * caller then starts cleanly rather than surfacing an error to the learner.
 */
export function readPersistedProgress(): ProgressSnapshot | null {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>
    if (!parsed || parsed.version !== PROGRESS_SCHEMA_VERSION) return null
    return {
      ...emptyProgress(),
      ...parsed,
      version: PROGRESS_SCHEMA_VERSION,
    } as ProgressSnapshot
  } catch {
    return null
  }
}

function persist(snapshot: ProgressSnapshot): ProgressSnapshot {
  const stamped = { ...snapshot, savedAt: Date.now() }
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(stamped))
  } catch {
    // Storage may be unavailable (private mode, quota). Progress stays
    // in-memory for this session rather than breaking the lesson.
  }
  return stamped
}

export interface ProgressActions {
  completeModule: (moduleId: string, score?: number) => void
  visitRisk: (owaspId: string) => void
  recordPrediction: (moduleId: string, predicted: number) => void
  recordScore: (moduleId: string, score: number) => void
  storeExploit: (exploit: StoredExploit) => void
  reset: () => void
}

export type ProgressStore = ProgressSnapshot & ProgressActions

/** Cached one-time read (init-once); subsequent renders use in-memory state. */
const initial = (typeof window === 'undefined' ? null : readPersistedProgress()) ?? emptyProgress()

export const useProgress = create<ProgressStore>((set, get) => ({
  ...initial,

  completeModule: (moduleId, score) =>
    set(() => {
      const s = get()
      const next: ProgressSnapshot = {
        ...snapshotOf(s),
        completedModules: { ...s.completedModules, [moduleId]: true },
        scores: score === undefined ? s.scores : { ...s.scores, [moduleId]: score },
      }
      return persist(next)
    }),

  visitRisk: (owaspId) =>
    set(() => {
      const s = get()
      if (s.visitedRisks[owaspId]) return {}
      return persist({
        ...snapshotOf(s),
        visitedRisks: { ...s.visitedRisks, [owaspId]: true },
      })
    }),

  recordPrediction: (moduleId, predicted) =>
    set(() => {
      const s = get()
      return persist({
        ...snapshotOf(s),
        predictions: { ...s.predictions, [moduleId]: predicted },
      })
    }),

  recordScore: (moduleId, score) =>
    set(() => {
      const s = get()
      return persist({ ...snapshotOf(s), scores: { ...s.scores, [moduleId]: score } })
    }),

  storeExploit: (exploit) =>
    set(() => persist({ ...snapshotOf(get()), exploit })),

  reset: () =>
    set(() => {
      try {
        window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      return emptyProgress()
    }),
}))

/** Strips actions, leaving the persistable snapshot. */
export function snapshotOf(s: ProgressSnapshot): ProgressSnapshot {
  return {
    version: PROGRESS_SCHEMA_VERSION,
    completedModules: s.completedModules,
    visitedRisks: s.visitedRisks,
    predictions: s.predictions,
    scores: s.scores,
    exploit: s.exploit,
    savedAt: s.savedAt,
  }
}
