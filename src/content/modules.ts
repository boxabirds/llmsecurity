/**
 * Canonical module registry: the course spine.
 *
 * The cognitive stage labels are the learner-facing wayfinding path
 * (Understand -> Experience -> Learn -> Confront -> Apply).
 */

export type Stage = 'Understand' | 'Experience' | 'Learn' | 'Confront' | 'Apply'

export const STAGES: readonly Stage[] = [
  'Understand',
  'Experience',
  'Learn',
  'Confront',
  'Apply',
] as const

export interface ModuleMeta {
  id: string
  order: number
  path: string
  title: string
  /** Short learner-facing promise, used on the rail and course map. */
  promise: string
  stage: Stage
}

export const MODULES: readonly ModuleMeta[] = [
  {
    id: 'm0',
    order: 0,
    path: '/module/m0',
    title: 'Orientation & threat model',
    promise: 'See why LLM security is different',
    stage: 'Understand',
  },
  {
    id: 'm1',
    order: 1,
    path: '/module/m1',
    title: 'The OWASP LLM Top 10 map',
    promise: 'Get the map before the territory',
    stage: 'Understand',
  },
  {
    id: 'm2',
    order: 2,
    path: '/module/m2',
    title: 'Attack sandbox: prompt injection',
    promise: 'Become the attacker — and succeed',
    stage: 'Experience',
  },
  {
    id: 'm3',
    order: 3,
    path: '/module/m3',
    title: 'Jailbreaks, RAG & tool poisoning',
    promise: 'Tell three attack classes apart',
    stage: 'Experience',
  },
  {
    id: 'm4',
    order: 4,
    path: '/module/m4',
    title: 'Defenses that hold',
    promise: 'Neutralise your own exploit',
    stage: 'Learn',
  },
  {
    id: 'm5',
    order: 5,
    path: '/module/m5',
    title: 'The indefensible frontier',
    promise: 'Feel why guardrails are not a boundary',
    stage: 'Confront',
  },
  {
    id: 'm6',
    order: 6,
    path: '/module/m6',
    title: 'Enterprise decision workshop',
    promise: 'Make and defend a real call',
    stage: 'Apply',
  },
] as const

const BY_ID = new Map(MODULES.map((m) => [m.id, m]))

export function moduleById(id: string): ModuleMeta | undefined {
  return BY_ID.get(id)
}

export function nextModule(id: string): ModuleMeta | undefined {
  const current = BY_ID.get(id)
  if (!current) return undefined
  return MODULES[current.order + 1]
}

export function previousModule(id: string): ModuleMeta | undefined {
  const current = BY_ID.get(id)
  if (!current || current.order === 0) return undefined
  return MODULES[current.order - 1]
}
