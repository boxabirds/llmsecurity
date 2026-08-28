/**
 * Motion policy.
 *
 * Motion exists only to show causality or a state change, and is bounded to
 * 200-400ms. When the learner prefers reduced motion, every explanatory
 * animation is replaced by a static before/after that carries the same causal
 * information — the animation is an enhancement, never the sole channel.
 */
import { useSyncExternalStore } from 'react'

export const MOTION_MIN_MS = 200
export const MOTION_MAX_MS = 400

export type MotionSpeed = 'fast' | 'base' | 'slow'

const DURATIONS: Record<MotionSpeed, number> = {
  fast: MOTION_MIN_MS,
  base: 300,
  slow: MOTION_MAX_MS,
}

const QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void): () => void {
  const mq = mediaQuery()
  if (!mq) return () => {}
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return mediaQuery()?.matches ?? false
}

/** True when the learner has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return getSnapshot()
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Duration for an explanatory animation. Always within the 200-400ms band,
 * and zero when reduced motion is requested so the static parity view is shown
 * instead.
 */
export function motionDuration(speed: MotionSpeed = 'base', reduced = prefersReducedMotion()): number {
  if (reduced) return 0
  return DURATIONS[speed]
}
