/**
 * Concept glossary surfaced by the inspector, so elaboration sits adjacent to
 * the concept rather than a browser tab away.
 */

export interface GlossaryEntry {
  term: string
  definition: string
  /** Optional reference id, so a definition can lead to its source. */
  referenceId?: string
}

const ENTRIES: GlossaryEntry[] = [
  {
    term: 'lethal trifecta',
    definition:
      'The three capabilities that together make an agent exploitable: access to private data, exposure to untrusted content, and a way to communicate externally. Remove any one and that attack class cannot complete.',
    referenceId: 'trifecta',
  },
  {
    term: 'prompt injection',
    definition:
      'Untrusted content steering the model, because the model cannot tell an instruction from data — everything in the context window is tokens of equal standing.',
    referenceId: 'echoleak',
  },
  {
    term: 'indirect prompt injection',
    definition:
      'Injection delivered through content the model processes on your behalf — an email, a document, a ticket — rather than typed by the attacker into the chat.',
    referenceId: 'echoleak',
  },
  {
    term: 'exfiltration',
    definition:
      'Getting data out. In agent attacks it usually rides the agent\'s own authorised channels: a rendered link, an image URL, or a permitted API call.',
  },
  {
    term: 'guardrail',
    definition:
      'A classifier that screens inputs or outputs for attacks. Useful friction and a rate-limiter on attacker success, but structurally bypassable — not a boundary.',
    referenceId: 'promptOverflow',
  },
  {
    term: 'instruction/data non-separation',
    definition:
      'The root cause of nearly every attack in this course: a transformer has no privileged channel that marks some tokens as instructions and others as inert data.',
  },
  {
    term: 'CaMeL',
    definition:
      'A defense that extracts control and data flow from the trusted query and runs it through an interpreter with capability tags, so untrusted data can never influence program flow.',
    referenceId: 'camel',
  },
  {
    term: 'RAG poisoning',
    definition:
      'Injecting crafted passages into a retrieval corpus so the system returns an attacker-chosen answer. A single well-targeted document can dominate.',
    referenceId: 'corruptRag',
  },
  {
    term: 'tool poisoning',
    definition:
      'Hiding instructions in tool metadata — a description or parameter schema — which agents treat as trusted operating context. No code is changed.',
    referenceId: 'mcptox',
  },
  {
    term: 'jailbreak',
    definition:
      'Defeating the model\'s own safety alignment, as opposed to defeating the application around it.',
    referenceId: 'adaptiveAttacks',
  },
  {
    term: 'deterministic defense',
    definition:
      'A control that structurally prevents an attack (an information-flow rule, a cut capability), as opposed to a probabilistic one that merely detects it most of the time.',
    referenceId: 'camel',
  },
]

/** Map for O(1) lookup rather than scanning the list on every focus change. */
const BY_TERM = new Map(ENTRIES.map((e) => [e.term.toLowerCase(), e]))

export const GLOSSARY_TERMS = ENTRIES.map((e) => e.term)

export type LookupResult = GlossaryEntry | 'none' | 'unavailable'

export function lookup(term: string | null): LookupResult {
  if (!term) return 'none'
  return BY_TERM.get(term.trim().toLowerCase()) ?? 'unavailable'
}
