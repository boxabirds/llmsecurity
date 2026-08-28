/**
 * Wayfinding: where am I in the arc, and what have I finished?
 *
 * The rail shows the labelled Understand -> Experience -> Learn -> Confront ->
 * Apply path so the learner always knows which cognitive stage they are in.
 */
import { NavLink } from 'react-router-dom'
import { MODULES, STAGES, type ModuleMeta } from '../content/modules'
import './Shell.css'

export interface ModuleRailProps {
  currentModuleId: string
  completed: Record<string, boolean>
  onNavigate?: (module: ModuleMeta) => void
  /** Preloads the next module's chunk on hover/focus. */
  onPreload?: (module: ModuleMeta) => void
}

export function ModuleRail({
  currentModuleId,
  completed,
  onNavigate,
  onPreload,
}: ModuleRailProps) {
  const current = MODULES.find((m) => m.id === currentModuleId)

  return (
    <div className="rail">
      <ol className="rail__stages" aria-label="Cognitive stages">
        {STAGES.map((stage) => (
          <li
            key={stage}
            className={`rail__stage${current?.stage === stage ? ' rail__stage--current' : ''}`}
            aria-current={current?.stage === stage ? 'step' : undefined}
            data-stage={stage}
          >
            {stage}
          </li>
        ))}
      </ol>

      <ol className="rail__modules">
        {MODULES.map((module) => {
          const isDone = completed[module.id] === true
          return (
            <li key={module.id}>
              <NavLink
                to={module.path}
                className={({ isActive }) => `rail__module${isActive ? ' rail__module--active' : ''}`}
                aria-current={module.id === currentModuleId ? 'page' : undefined}
                onClick={() => onNavigate?.(module)}
                onMouseEnter={() => onPreload?.(module)}
                onFocus={() => onPreload?.(module)}
                data-module={module.id}
                data-complete={isDone ? 'true' : undefined}
              >
                <span className="rail__module-mark" aria-hidden="true">
                  {isDone ? '✔' : module.order}
                </span>
                <span className="rail__module-text">
                  <span className="rail__module-title">{module.title}</span>
                  <span className="rail__module-promise">{module.promise}</span>
                </span>
                {isDone ? <span className="visually-hidden"> (completed)</span> : null}
              </NavLink>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
