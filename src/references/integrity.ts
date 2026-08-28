/**
 * Reference integrity rules — pure predicates so the build gate and the unit
 * tests share exactly one implementation.
 */
import type { Reference } from './registry'

export interface IntegrityResult {
  ok: boolean
  violations: string[]
}

/** Extracts every Citation element's id attribute from source text. */
export function collectCitedIds(sources: readonly string[]): string[] {
  const ids = new Set<string>()
  const re = /<Citation\s+id="([^"]+)"/g
  for (const source of sources) {
    let match: RegExpExecArray | null
    while ((match = re.exec(source)) !== null) ids.add(match[1])
  }
  return [...ids]
}

function hasResolvableUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function checkIntegrity(
  registry: Record<string, Reference>,
  citedIds: readonly string[],
  claims: readonly string[] = [],
): IntegrityResult {
  const violations: string[] = []

  // Rule 1 — every cited id exists in the registry.
  for (const id of citedIds) {
    if (!registry[id]) violations.push(`citation "${id}" is not in the reference registry`)
  }

  // Rule 2 — every entry has a resolvable source, a summary, a claim and a caveat.
  for (const [id, reference] of Object.entries(registry)) {
    if (!hasResolvableUrl(reference.url)) violations.push(`reference "${id}" has no resolvable URL`)
    if (!reference.summary?.trim()) violations.push(`reference "${id}" has no summary`)
    if (!reference.claimAsUsed?.trim()) violations.push(`reference "${id}" has no claim-as-used`)
    if (!reference.caveat?.trim()) violations.push(`reference "${id}" has no confidence/caveat line`)
  }

  // Rule 3 — every teaching claim carries a citation.
  for (const claim of claims) {
    if (!/<Citation\s+id="/.test(claim)) {
      violations.push(`teaching claim is uncited: "${claim.slice(0, 60)}…"`)
    }
  }

  return { ok: violations.length === 0, violations }
}
