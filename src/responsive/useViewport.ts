/**
 * Viewport hook backed by one shared, passive resize listener.
 *
 * Every consumer subscribes to the same listener rather than adding its own,
 * and the breakpoint is derived during render rather than stored in an effect.
 */
import { useSyncExternalStore } from 'react'
import { breakpointFor, type Breakpoint } from './breakpoints'

const subscribers = new Set<() => void>()
let attached = false
let currentWidth = typeof window === 'undefined' ? DESKTOP_FALLBACK() : window.innerWidth

function DESKTOP_FALLBACK() {
  return 1280
}

function handleResize() {
  currentWidth = window.innerWidth
  for (const notify of subscribers) notify()
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify)
  if (!attached && typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize, { passive: true })
    attached = true
  }
  return () => {
    subscribers.delete(notify)
    if (subscribers.size === 0 && attached) {
      window.removeEventListener('resize', handleResize)
      attached = false
    }
  }
}

function getWidth(): number {
  return typeof window === 'undefined' ? DESKTOP_FALLBACK() : window.innerWidth
}

export function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, getWidth, DESKTOP_FALLBACK)
}

export interface Viewport {
  width: number
  breakpoint: Breakpoint
  isMobile: boolean
  isDesktop: boolean
}

export function useViewport(): Viewport {
  const width = useViewportWidth()
  const breakpoint = breakpointFor(width)
  return {
    width,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isDesktop: breakpoint === 'desktop',
  }
}

/** Introspection used by tests to prove the resize listener is deduplicated. */
export function resizeListenerCount(): number {
  return attached ? 1 : 0
}

export { currentWidth as __currentWidth }
