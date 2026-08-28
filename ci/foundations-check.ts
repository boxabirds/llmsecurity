/**
 * CI gate: the design register must be complete and violation-free.
 * Run with `bun run lint:foundations`.
 */
import { DESIGN_REGISTER } from '../src/foundations/designRegister'
import { lint } from '../src/foundations/lint'

const result = lint(DESIGN_REGISTER)

if (!result.ok) {
  console.error('Design register check FAILED:')
  for (const violation of result.violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log(`Design register check passed (${DESIGN_REGISTER.length} interactives).`)
