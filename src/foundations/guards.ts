/**
 * Runtime guards.
 *
 * Two commitments enforced at run time rather than by convention:
 *  1. progress is awarded for reasoning, never for a bare click;
 *  2. nothing leaves the device — no live LLM call, no analytics beacon.
 *
 * The second is the tutorial's subject matter applied to itself: a security
 * course that teaches the lethal trifecta should not itself have an
 * exfiltration vector.
 */

/** Hosts that would represent a live model call; blocked explicitly. */
export const KNOWN_LLM_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.mistral.ai',
  'api.cohere.ai',
  'openrouter.ai',
] as const

export type OutboundDecision = 'allow' | 'block'

/**
 * Progress is granted only when the learner supplied reasoning (a
 * self-explanation or a generated answer). A bare click earns nothing.
 */
export function awardProgress(hasReasoning: boolean): boolean {
  return hasReasoning === true
}

/**
 * Decides whether an outbound request may proceed. Same-origin and relative
 * requests (the app's own static assets) are allowed; anything cross-origin is
 * blocked, which covers every live-LLM host as a strict subset.
 */
export function guardOutbound(url: string, origin = currentOrigin()): OutboundDecision {
  let parsed: URL
  try {
    parsed = new URL(url, origin)
  } catch {
    // An unparseable target cannot be shown to be same-origin, so refuse it.
    return 'block'
  }

  if (KNOWN_LLM_HOSTS.includes(parsed.host as (typeof KNOWN_LLM_HOSTS)[number])) return 'block'
  return parsed.origin === origin ? 'allow' : 'block'
}

function currentOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost'
}

let installed = false

/**
 * Installs the outbound guard over fetch so the no-egress property is enforced
 * at run time, not merely documented. Idempotent (init-once).
 */
export function installOutboundGuard(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return
  const original = window.fetch.bind(window)

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const target =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (guardOutbound(target) === 'block') {
      return Promise.reject(
        new Error(
          `Blocked outbound request to ${target}: this tutorial runs fully on-device with no data egress.`,
        ),
      )
    }
    return original(input as RequestInfo, init)
  }) as typeof window.fetch

  installed = true
}

export function outboundGuardInstalled(): boolean {
  return installed
}
