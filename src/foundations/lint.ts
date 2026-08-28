/**
 * Build-time linter over the design register.
 *
 * Four pure rules, one per anti-pattern the tutorial commits to avoiding.
 * Violations fail the build, so the commitments are checked in CI rather than
 * left to reviewer memory.
 */
import type { RegisterEntry } from './designRegister'

export interface LintResult {
  ok: boolean
  violations: string[]
}

export function lint(entries: RegisterEntry[]): LintResult {
  const violations: string[] = []

  for (const entry of entries) {
    // Rule 1 — every interactive traces to a named principle.
    if (!entry.principle) {
      violations.push(`${entry.id}: no linked learning-science principle`)
    }

    // Rule 2 — no seductive details: an element that carries no information.
    if (entry.decorative) {
      violations.push(`${entry.id}: decorative element carries no information`)
    }

    // Rule 3 — an attack lab must be bookended by the defensive lens.
    if (entry.isAttackLab && !entry.hasBookend) {
      violations.push(`${entry.id}: attack lab has no defensive bookend`)
    }

    // Rule 4 — a load-bearing check must require generation, not recognition.
    if (entry.loadBearing && !entry.generation) {
      violations.push(`${entry.id}: load-bearing check offers recognition only`)
    }
  }

  return { ok: violations.length === 0, violations }
}
