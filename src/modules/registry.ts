/**
 * Module route registry.
 *
 * Each module is code-split behind React.lazy so the initial bundle stays small
 * and a heavy lab is fetched only when the learner opens it. Reference ids are
 * declared here (cheap constants, kept in step with each module's own
 * M*_REFERENCE_IDS export) so the shell can render a module's reference drawer
 * without pulling in the module chunk.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface RegisteredModule {
  component: LazyExoticComponent<ComponentType>
  referenceIds: readonly string[]
}

export const MODULE_REGISTRY: Record<string, RegisteredModule> = {
  m0: {
    component: lazy(() => import('./m0')),
    referenceIds: ['echoleak', 'trifecta'],
  },
  m1: {
    component: lazy(() => import('./m1')),
    referenceIds: [
      'owasp2025',
      'mitreAtlas',
      'nistAiRmf',
      'echoleak',
      'mcptox',
      'poisonedRag',
      'corruptRag',
    ],
  },
  m2: {
    component: lazy(() => import('./m2')),
    referenceIds: ['echoleak', 'trifecta', 'owasp2025'],
  },
  m3: {
    component: lazy(() => import('./m3')),
    referenceIds: ['universalSuffixes', 'poisonedRag', 'corruptRag', 'mcptox', 'owasp2025'],
  },
  m4: {
    component: lazy(() => import('./m4')),
    referenceIds: ['camel', 'designPatterns', 'trifecta'],
  },
  m6: {
    component: lazy(() => import('./m6')),
    referenceIds: ['mitreAtlas', 'echoleak', 'trifecta', 'nistAiRmf', 'camel'],
  },
  m5: {
    component: lazy(() => import('./m5')),
    referenceIds: [
      'promptOverflow',
      'injecguard',
      'adaptiveAttacks',
      'sleeperAgents',
      'corruptRag',
      'mcptox',
      'trifecta',
      'designPatterns',
      'echoleak',
    ],
  },
}
