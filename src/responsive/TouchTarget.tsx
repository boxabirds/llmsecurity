/**
 * Touch-first primitives.
 *
 * `ChipToggle` is the tap-to-add-and-remove control that replaces drag as the
 * primary path. It is a plain button, so the touch path and the keyboard path
 * are the same code path — accessibility and mobile support fall out together
 * rather than being two separate implementations.
 */
import type { ReactNode } from 'react'
import './TouchTarget.css'

export const MIN_TOUCH_PX = 44

export interface TouchTargetProps {
  children: ReactNode
  /** Primary actions sit in the bottom thumb zone on mobile. */
  primary?: boolean
  destructive?: boolean
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit'
}

export function TouchTarget({
  children,
  primary = false,
  destructive = false,
  onClick,
  disabled,
  ariaLabel,
  type = 'button',
}: TouchTargetProps) {
  const classes = [
    'touch-target',
    primary ? 'touch-target--primary' : '',
    destructive ? 'touch-target--destructive' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-primary={primary ? 'true' : undefined}
    >
      {children}
    </button>
  )
}

export interface ChipToggleProps {
  label: string
  selected: boolean
  onToggle: () => void
  description?: string
  disabled?: boolean
}

/** Tap (or Enter/Space) to add; tap again to remove. No dragging required. */
export function ChipToggle({ label, selected, onToggle, description, disabled }: ChipToggleProps) {
  return (
    <button
      type="button"
      className={`chip-toggle${selected ? ' chip-toggle--on' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
      disabled={disabled}
    >
      <span className="chip-toggle__mark" aria-hidden="true">
        {selected ? '−' : '+'}
      </span>
      <span className="chip-toggle__label">{label}</span>
      {description ? <span className="chip-toggle__desc">{description}</span> : null}
      <span className="visually-hidden">{selected ? ' (added, activate to remove)' : ' (activate to add)'}</span>
    </button>
  )
}

/**
 * Wide content (charts, token streams, corpora, diagrams) scrolls inside this
 * container so the page body never scrolls horizontally.
 */
export function ScrollX({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="scroll-x scroll-x--framed" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  )
}

/** Bottom-anchored action bar; on mobile this is the thumb zone. */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="action-bar">{children}</div>
}
