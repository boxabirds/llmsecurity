/**
 * Responsive breakpoints — a single source of truth shared by the shell, the
 * reference surface, and every lab.
 */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export const MOBILE_MAX_WIDTH = 767
export const TABLET_MIN_WIDTH = 768
export const DESKTOP_MIN_WIDTH = 1024

export function breakpointFor(width: number): Breakpoint {
  if (width < TABLET_MIN_WIDTH) return 'mobile'
  if (width < DESKTOP_MIN_WIDTH) return 'tablet'
  return 'desktop'
}

export function isMobileWidth(width: number): boolean {
  return breakpointFor(width) === 'mobile'
}
