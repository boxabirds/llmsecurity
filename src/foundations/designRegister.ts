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

  // Module 0 — story first, principle second.
  {
    id: 'M0DiscoveryFlow',
    owner: 'story-1',
    principle: 'concreteness-fading',
  },
  {
    id: 'TokenStreamViz',
    owner: 'story-1',
    principle: 'paivio-dual-coding',
  },
  {
    id: 'TrifectaBuilder',
    owner: 'story-1',
    principle: 'paivio-dual-coding',
    loadBearing: true,
    generation: true,
  },

  // Module 1 — the advance organizer.
  {
    id: 'M1RiskMatrix',
    owner: 'story-2',
    principle: 'ausubel-advance-organizer',
  },
  {
    id: 'M1TaggingAssessment',
    owner: 'story-2',
    principle: 'bjork-desirable-difficulties',
    loadBearing: true,
    generation: true,
  },

  // Module 3 — three contrasting attack labs.
  {
    id: 'M3LabShell',
    owner: 'story-4',
    principle: 'bjork-desirable-difficulties',
    isAttackLab: true,
    hasBookend: true,
    loadBearing: true,
    generation: true,
  },

  // Module 5 — cognitive conflict about what cannot be fixed.
  {
    id: 'GuardrailGauntlet',
    owner: 'story-5',
    principle: 'posner-conceptual-change',
  },
  {
    id: 'IndefensibleMap',
    owner: 'story-5',
    principle: 'sweller-cognitive-load',
  },
  {
    id: 'M5CritiqueGate',
    owner: 'story-5',
    principle: 'chi-self-explanation',
    loadBearing: true,
    generation: true,
  },

  // Module 6 — authentic assessment: a decision you have to defend.
  {
    id: 'M6ScenarioSimulator',
    owner: 'story-6',
    principle: 'authentic-assessment',
  },
  {
    id: 'M6RiskMemo',
    owner: 'story-6',
    principle: 'authentic-assessment',
    loadBearing: true,
    generation: true,
  },

  // Module 4 — the defensive payoff: the learner's own exploit, neutralised.
  {
    id: 'CaMeLFlow',
    owner: 'story-7',
    principle: 'kolb-experiential-cycle',
  },
  {
    id: 'DefensePatternPicker',
    owner: 'story-7',
    principle: 'sweller-cognitive-load',
  },
  {
    id: 'ArchitectureBuilder',
    owner: 'story-7',
    principle: 'kolb-experiential-cycle',
  },
  {
    id: 'M4ReplayEngine',
    owner: 'story-7',
    principle: 'kapur-productive-failure',
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
