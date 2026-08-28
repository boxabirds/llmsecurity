/**
 * The design register.
 *
 * Every interactive in the tutorial is listed here with the learning-science
 * principle it serves. The register is the artifact the build linter checks, so
 * "every design decision traces to a named principle" is enforced rather than
 * asserted. An interactive that ships without an entry fails the build.
 */

export const PRINCIPLES = [
  'kolb-experiential-cycle',
  'kapur-productive-failure',
  'sweller-cognitive-load',
  'mayer-multimedia',
  'paivio-dual-coding',
  'roediger-karpicke-testing-effect',
  'bjork-desirable-difficulties',
  'scaffolding-and-fading',
  'chi-self-explanation',
  'concreteness-fading',
  'hattie-shute-feedback',
  'ausubel-advance-organizer',
  'posner-conceptual-change',
  'authentic-assessment',
] as const

export type Principle = (typeof PRINCIPLES)[number]

export interface RegisterEntry {
  /** Component or surface id. */
  id: string
  /** Owning module or platform layer. */
  owner: string
  /** The named learning-science principle this interactive serves. */
  principle?: Principle
  /** True when an animation carries no information (a seductive detail). */
  decorative?: boolean
  /** True when this interactive demonstrates an attack. */
  isAttackLab?: boolean
  /** Attack labs must name the root cause and the leg to cut. */
  hasBookend?: boolean
  /** True when this is a load-bearing mastery check. */
  loadBearing?: boolean
  /** Load-bearing checks must require generation, not recognition. */
  generation?: boolean
}

/**
 * Registered interactives. Each module story appends its own entries as it
 * ships; the linter fails the build if any entry is incomplete.
 */
export const DESIGN_REGISTER: RegisterEntry[] = [
  // Platform layer
  {
    id: 'RiskSignal',
    owner: 'story-12',
    principle: 'paivio-dual-coding',
  },
  {
    id: 'ResponsiveLayout',
    owner: 'story-12',
    principle: 'sweller-cognitive-load',
  },
  {
    id: 'ChipToggle',
    owner: 'story-12',
    principle: 'sweller-cognitive-load',
  },
  {
    id: 'FeedbackLoop',
    owner: 'story-10',
    principle: 'chi-self-explanation',
  },
  {
    id: 'CalibrationMirror',
    owner: 'story-13',
    principle: 'roediger-karpicke-testing-effect',
  },
  {
    id: 'ReferenceSurface',
    owner: 'story-11',
    principle: 'mayer-multimedia',
  },
  {
    id: 'ModuleRail',
    owner: 'story-9',
    principle: 'kolb-experiential-cycle',
  },

  // Module 2 — the learner becomes the attacker, then is turned to the defense.
  {
    id: 'InjectionPlayground',
    owner: 'story-3',
    principle: 'kapur-productive-failure',
    isAttackLab: true,
    hasBookend: true,
  },
  {
    id: 'M2LadderFlow',
    owner: 'story-3',
    principle: 'scaffolding-and-fading',
    isAttackLab: true,
    hasBookend: true,
    loadBearing: true,
    generation: true,
  },
]

/** Registers additional interactives (used by module modules at import time). */
export function registerInteractives(entries: RegisterEntry[]): void {
  for (const entry of entries) {
    const existing = DESIGN_REGISTER.findIndex((e) => e.id === entry.id)
    if (existing >= 0) DESIGN_REGISTER[existing] = entry
    else DESIGN_REGISTER.push(entry)
  }
}
