import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement matchMedia; the responsive and reduced-motion layers
// depend on it, so provide a controllable stub that tests can drive.
type MediaListener = (e: MediaQueryListEvent) => void

const mediaState = {
  reducedMotion: false,
  width: 1280,
}

export function setViewportWidth(width: number) {
  mediaState.width = width
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  window.dispatchEvent(new Event('resize'))
}

export function setReducedMotion(value: boolean) {
  mediaState.reducedMotion = value
}

function matchMediaStub(query: string): MediaQueryList {
  const listeners = new Set<MediaListener>()
  const matches = query.includes('prefers-reduced-motion')
    ? mediaState.reducedMotion
    : false
  return {
    matches,
    media: query,
    onchange: null,
    addListener: (l: MediaListener) => listeners.add(l),
    removeListener: (l: MediaListener) => listeners.delete(l),
    addEventListener: (_: string, l: MediaListener) => listeners.add(l),
    removeEventListener: (_: string, l: MediaListener) => listeners.delete(l),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList
}

beforeEach(() => {
  mediaState.reducedMotion = false
  mediaState.width = 1280
  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
  vi.stubGlobal('matchMedia', matchMediaStub)
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
