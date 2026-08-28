/**
 * Module route registry.
 *
 * Each module is code-split behind React.lazy so the initial bundle stays small
 * and a heavy lab is fetched only when the learner opens it. Reference ids are
 * declared here (cheap constants) so the shell can render a module's reference
 * drawer without pulling in the module chunk.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface RegisteredModule {
  component: LazyExoticComponent<ComponentType>
  referenceIds: readonly string[]
}

export const MODULE_REGISTRY: Record<string, RegisteredModule> = {
  m2: {
    component: lazy(() => import('./m2')),
    referenceIds: ['echoleak', 'trifecta', 'owasp2025'],
  },
}
