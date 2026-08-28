/**
 * CI gate: reference integrity.
 *
 * Fails the build if a citation points at an id that is not in the registry, if
 * a registry entry is missing a resolvable source or summary, or if a teaching
 * claim ships without a citation. Run with `bun run lint:references`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { REFERENCES } from '../src/references/registry'
import { checkIntegrity, collectCitedIds } from '../src/references/integrity'

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue
      walk(full, out)
    } else if (/\.(tsx|ts|mdx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const files = walk('src')
const sources = files.map((path) => ({ path, content: readFileSync(path, 'utf8') }))
const citedIds = collectCitedIds(sources.map((s) => s.content))

const result = checkIntegrity(REFERENCES, citedIds)

if (!result.ok) {
  console.error('Reference integrity check FAILED:')
  for (const violation of result.violations) console.error(`  - ${violation}`)
  process.exit(1)
}

console.log(
  `Reference integrity check passed (${Object.keys(REFERENCES).length} registered, ${citedIds.length} cited).`,
)
