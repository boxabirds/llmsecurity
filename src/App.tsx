import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MODULES } from './content/modules'

/**
 * Module routes are registered here as each module ships. Modules are
 * code-split so the initial bundle stays small and a heavy lab is only
 * fetched when the learner opens it.
 */
const MODULE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {}

function ModuleFallback() {
  return (
    <div style={{ padding: 'var(--space-5)' }} role="status" aria-live="polite">
      Loading module…
    </div>
  )
}

function NotBuiltYet({ id }: { id: string }) {
  const meta = MODULES.find((m) => m.id === id)
  return (
    <section style={{ padding: 'var(--space-5)' }}>
      <h1>{meta?.title ?? 'Module'}</h1>
      <p style={{ color: 'var(--text-muted)' }}>This module is not built yet.</p>
    </section>
  )
}

export default function App() {
  return (
    <Suspense fallback={<ModuleFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={MODULES[0].path} replace />} />
        {MODULES.map((m) => {
          const Component = MODULE_COMPONENTS[m.id]
          return (
            <Route
              key={m.id}
              path={m.path}
              element={Component ? <Component /> : <NotBuiltYet id={m.id} />}
            />
          )
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export { MODULE_COMPONENTS, lazy }
