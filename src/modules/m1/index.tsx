/**
 * Module 1 — the OWASP LLM Top 10 map.
 *
 * This is the advance organizer: the map handed over before the territory, so
 * that every attack in the modules that follow has somewhere to land. It is
 * deliberately the least dramatic module in the course. Its job is orientation,
 * not experience — keep the copy short.
 */
import { Citation } from '../../references/Citation'
import { RiskMatrix } from './RiskMatrix'
import { TaggingAssessment } from './TaggingAssessment'
import './m1.css'

export const M1_REFERENCE_IDS = [
  'owasp2025',
  'mitreAtlas',
  'nistAiRmf',
  'echoleak',
  'mcptox',
  'poisonedRag',
  'corruptRag',
] as const

export default function Module1() {
  return (
    <article>
      <header>
        <p className="module-eyebrow">Module 1 · Understand</p>
        <h1>The map before the territory</h1>
        <p>
          Ten categories, one screen. The <Citation id="owasp2025">OWASP Top 10 for LLM
          Applications 2025</Citation> is not a checklist and not a ranking — it is a set of places
          to put things. Two entries are new this year: System Prompt Leakage and Vector and
          Embedding Weaknesses.
        </p>
        <p className="module-note">
          Skim the ten, then tag six real incidents. Ten minutes here saves you guessing for the
          rest of the course.
        </p>
      </header>

      <RiskMatrix />
      <TaggingAssessment />
    </article>
  )
}
