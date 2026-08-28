/**
 * The tutorial's interaction vocabulary. Four verbs, used consistently
 * everywhere so the same gesture always means the same thing.
 */
export type Verb = 'drag' | 'toggle' | 'inject' | 'cut'

export const VERBS: readonly Verb[] = ['drag', 'toggle', 'inject', 'cut'] as const

const MEANINGS: Record<Verb, string> = {
  drag: 'compose a system',
  toggle: "reveal the model's-eye view",
  inject: 'author untrusted content',
  cut: 'remove a capability or leg',
}

export function verbMeaning(verb: Verb): string {
  return MEANINGS[verb]
}
