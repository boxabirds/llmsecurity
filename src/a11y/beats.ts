/**
 * Learner-paced beats.
 *
 * Guided replays advance only when the learner advances them. Comprehension,
 * not a timer, sets the tempo — so no beat sequence is ever driven by
 * setTimeout/setInterval.
 */
import { useCallback, useState } from 'react'

export interface Beats {
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
  next: () => void
  previous: () => void
  reset: () => void
}

export function useBeats(total: number): Beats {
  const [index, setIndex] = useState(0)

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, Math.max(total - 1, 0))), [total])
  const previous = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const reset = useCallback(() => setIndex(0), [])

  return {
    index,
    total,
    isFirst: index === 0,
    isLast: index >= total - 1,
    next,
    previous,
    reset,
  }
}
