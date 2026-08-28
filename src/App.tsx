import { Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { MODULES, moduleById } from './content/modules'
import { ReferenceProvider } from './references/ReferenceProvider'
import { Shell } from './shell/Shell'
import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Module routes are registered here as each module ships. Modules are
 * code-split so the initial bundle stays small and a heavy lab is fetched only
 * when the learner opens it.
 */
export const MODULE_COMPONENTS: Record<
  string,
  { component: LazyExoticComponent<ComponentType>; referenceIds: readonly string[] }
> = {}

function ModuleFallback() {
  return (
    <p role="status" aria-live="polite">
      Loading module…
    </p>
  )
}

function NotBuiltYet({ id }: { id: string }) {
  const meta = moduleById(id)
  return (
    <section>
      <h1>{meta?.title ?? 'Module'}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        This module is not built yet. Use the course map to reach the modules that are.
      </p>
    </section>
  )
}

function ModuleRoute() {
  const { moduleId = MODULES[0].id } = useParams()
  const registered = MODULE_COMPONENTS[moduleId]
  const Component = registered?.component

  return (
    <Shell moduleId={moduleId} referenceIds={registered?.referenceIds ?? []}>
      <Suspense fallback={<ModuleFallback />}>
        {Component ? <Component /> : <NotBuiltYet id={moduleId} />}
      </Suspense>
    </Shell>
  )
}

export default function App() {
  return (
    <ReferenceProvider>
      <Routes>
        <Route path="/" element={<Navigate to={MODULES[0].path} replace />} />
        <Route path="/module/:moduleId" element={<ModuleRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ReferenceProvider>
  )
}
