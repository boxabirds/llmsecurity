/**
 * The instruction/data collapse, made visible.
 *
 * Two views of the *same* context. "What we wish the model saw" is the mental
 * model almost everyone starts with: labelled channels, the developer's rules
 * over here, your message there, the email quarantined somewhere else. "What it
 * actually sees" is one flat run of tokens with no channel at all — which is
 * why a sentence in an email can act as an instruction.
 *
 * The flattening is not a metaphor invented for this page: it is the kernel's
 * `tokenize`, the same function the simulation runs on.
 */
import { useMemo, useState } from 'react'
import { ScrollX } from '../../responsive/TouchTarget'
import { announce } from '../../a11y/announce'
import { tokenize, trustOf, type ContextSegment, type SegmentOrigin } from '../../sim/kernel'
import './m0.css'

export type StreamView = 'wished' | 'actual'

export const ORIGIN_LABELS: Record<SegmentOrigin, string> = {
  system: 'System prompt — written by the developer',
  user: 'Your message',
  retrieved: 'Text pulled in from the email',
  tool: 'Text handed back by a tool',
}

const VIEW_COPY: Record<StreamView, { caption: string; toggle: string; announcement: string }> = {
  wished: {
    caption:
      'Neatly separated, each block tagged with where it came from and how much it should be trusted. This is the picture in your head. The model has no such picture.',
    toggle: 'Show what it actually sees',
    announcement:
      'Showing the context grouped by origin: the mental model, with each block labelled by where it came from.',
  },
  actual: {
    caption:
      'One run of tokens, end to end. No labels, no borders, no origin, no trust level — the words from the email sit in the same stream as the developer’s rules and your request, and carry exactly the same weight.',
    toggle: 'Show what we wish it saw',
    announcement:
      'Showing what the model actually sees: one flat token stream with no origin and no trust labels.',
  },
}

export interface TokenStreamVizProps {
  segments: readonly ContextSegment[]
  /** Which view to open on. Defaults to the learner’s existing mental model. */
  initialView?: StreamView
}

export function TokenStreamViz({ segments, initialView = 'wished' }: TokenStreamVizProps) {
  const [view, setView] = useState<StreamView>(initialView)
  const tokens = useMemo(() => tokenize(segments), [segments])
  const copy = VIEW_COPY[view]

  function toggle() {
    const next: StreamView = view === 'wished' ? 'actual' : 'wished'
    setView(next)
    announce(VIEW_COPY[next].announcement)
  }

  return (
    <figure className="m0-stream" data-testid="token-stream-figure">
      <figcaption className="m0-stream__caption">
        <h4 className="m0-stream__title">
          {view === 'wished' ? 'What we wish the model saw' : 'What it actually sees'}
        </h4>
        <p>{copy.caption}</p>
      </figcaption>

      <button
        type="button"
        className="touch-target m0-stream__toggle"
        data-testid="token-stream-toggle"
        aria-pressed={view === 'actual'}
        onClick={toggle}
      >
        {copy.toggle}
      </button>

      <ScrollX label="The assistant's context window, token by token">
        <div className={`m0-stream__body m0-stream__body--${view}`} data-testid="token-stream" data-view={view}>
          {view === 'wished'
            ? segments.map((segment) => (
                <div
                  key={segment.id}
                  className="m0-stream__group"
                  data-origin={segment.origin}
                  data-trust={trustOf(segment.origin)}
                >
                  <span className="m0-stream__group-label">
                    {ORIGIN_LABELS[segment.origin]} · {trustOf(segment.origin)}
                  </span>
                  <span className="m0-stream__group-tokens">
                    {tokenize([segment]).map((token, index) => (
                      <span
                        key={`${segment.id}-${index}`}
                        className="m0-token m0-token--tagged"
                        data-origin={token.origin}
                      >
                        {token.text}
                      </span>
                    ))}
                  </span>
                </div>
              ))
            : tokens.map((token, index) => (
                <span key={`flat-${index}`} className="m0-token m0-token--flat">
                  {token.text}
                </span>
              ))}
        </div>
      </ScrollX>
    </figure>
  )
}
