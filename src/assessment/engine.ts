/**
 * Assessment and retention engine.
 *
 * Formative everywhere, summative sparsely. Anything load-bearing is assessed
 * by *generation* (name it, craft it, critique it, write it) rather than
 * recognition, because picking the right option from a list overstates
 * competence. Later modules deliberately pull items from earlier ones so
 * spacing and interleaving are built into the sequence rather than bolted on.
 */

export type QuestionKind = 'classify' | 'tag' | 'achieve' | 'critique'

/** Kinds that require the learner to produce something, not select it. */
export const GENERATION_KINDS: readonly QuestionKind[] = ['achieve', 'critique'] as const

export interface Rubric {
  /** Concepts the answer must engage with; matched case-insensitively. */
  keywords: string[]
  /** Fraction of keywords required to pass, 0..1. */
  minScore: number
}

export interface AssessmentItem {
  id: string
  moduleId: string
  kind: QuestionKind
  prompt: string
  loadBearing?: boolean
  rubric?: Rubric
}

// ---------------------------------------------------------------------------
// TC-01 — every interaction is a low-stakes retrieval opportunity
// ---------------------------------------------------------------------------

export interface RetrievalOpportunity {
  prompt: string
  lowStakes: true
}

export function retrievalOpportunityFor(item: AssessmentItem): RetrievalOpportunity {
  return { prompt: item.prompt, lowStakes: true }
}

// ---------------------------------------------------------------------------
// TC-02 — interleaving: later modules draw on earlier concepts
// ---------------------------------------------------------------------------

const MODULE_ORDER = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6']

function orderOf(moduleId: string): number {
  const index = MODULE_ORDER.indexOf(moduleId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

/**
 * Picks an item from an *earlier* module than the current one, so assessment
 * spaces and interleaves rather than only testing what was just taught.
 */
export function selectInterleavedItem(
  bank: readonly AssessmentItem[],
  currentModuleId: string,
): AssessmentItem | null {
  const current = orderOf(currentModuleId)
  const earlier = bank.filter((item) => orderOf(item.moduleId) < current)
  if (earlier.length === 0) return null
  // Prefer the oldest unrevisited concept: the longest spacing interval.
  return earlier.reduce((a, b) => (orderOf(a.moduleId) <= orderOf(b.moduleId) ? a : b))
}

/** True when no two consecutive items share a category. */
export function isInterleavedOrder(items: readonly { category: string }[]): boolean {
  for (let i = 1; i < items.length; i += 1) {
    if (items[i].category === items[i - 1].category) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// TC-03 — generation over recognition for load-bearing concepts
// ---------------------------------------------------------------------------

export function requiresGeneration(item: AssessmentItem): boolean {
  return item.loadBearing === true
}

export function satisfiesGenerationRule(item: AssessmentItem): boolean {
  if (!requiresGeneration(item)) return true
  return GENERATION_KINDS.includes(item.kind)
}

// ---------------------------------------------------------------------------
// TC-04 / TC-05 — rubric grading, with retry rather than a silent pass
// ---------------------------------------------------------------------------

export type GradeStatus = 'graded' | 'retry'

export interface GradeOutcome {
  status: GradeStatus
  /** 0..1 fraction of rubric concepts engaged; present when graded. */
  score?: number
  passed?: boolean
  guidance?: string
  matched?: string[]
}

/** Fraction of rubric keywords the answer engages with. */
export function grade(answer: string, rubric: Rubric): number {
  const text = answer.toLowerCase()
  if (rubric.keywords.length === 0) return 0
  const matched = rubric.keywords.filter((k) => text.includes(k.toLowerCase()))
  return matched.length / rubric.keywords.length
}

const MIN_ANSWER_CHARS = 3

/**
 * Grades a free-text answer. An empty or unparseable answer is never silently
 * passed: it returns a retry with specific guidance.
 */
export function gradeOrRetry(answer: string, rubric: Rubric): GradeOutcome {
  const trimmed = answer.trim()

  if (trimmed.length < MIN_ANSWER_CHARS) {
    return {
      status: 'retry',
      guidance:
        'Write at least a sentence in your own words — explaining it is what makes it stick.',
    }
  }

  const score = grade(trimmed, rubric)
  const matched = rubric.keywords.filter((k) => trimmed.toLowerCase().includes(k.toLowerCase()))

  return {
    status: 'graded',
    score,
    matched,
    passed: score >= rubric.minScore,
    guidance:
      score >= rubric.minScore
        ? undefined
        : `Your answer did not engage with: ${rubric.keywords
            .filter((k) => !matched.includes(k))
            .join(', ')}.`,
  }
}

// ---------------------------------------------------------------------------
// Calibration (metacognitive mirror)
// ---------------------------------------------------------------------------

export interface Calibration {
  /** Learner's predicted confidence, 0..100. */
  predicted: number
  /** Actual score, 0..100. */
  actual: number
}

export type CalibrationView = 'readout' | 'no-data'

export function calibrationView(calibration: Calibration | null): CalibrationView {
  return calibration ? 'readout' : 'no-data'
}

export function calibrationGap(calibration: Calibration): number {
  return calibration.predicted - calibration.actual
}

export function calibrationVerdict(calibration: Calibration): string {
  const gap = calibrationGap(calibration)
  if (gap > 15) return 'You were more confident than your result — worth a second look.'
  if (gap < -15) return 'You did better than you expected — trust yourself a little more.'
  return 'Your confidence matched your result closely.'
}
