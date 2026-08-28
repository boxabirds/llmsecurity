/**
 * Global keyboard handling with listener deduplication.
 *
 * Many surfaces want a global key (Escape to dismiss, arrows to step). Each
 * registering its own document listener would multiply work on every keypress,
 * so a single shared listener fans out to subscribers.
 */

type KeyHandler = (event: KeyboardEvent) => void

const subscribers = new Map<string, Set<KeyHandler>>()
let attached = false

function dispatch(event: KeyboardEvent) {
  const handlers = subscribers.get(event.key)
  if (!handlers || handlers.size === 0) return
  for (const handler of handlers) handler(event)
}

function ensureAttached() {
  if (attached || typeof document === 'undefined') return
  document.addEventListener('keydown', dispatch)
  attached = true
}

/** Subscribe to a global key. Returns an unsubscribe function. */
export function onGlobalKey(key: string, handler: KeyHandler): () => void {
  ensureAttached()
  let handlers = subscribers.get(key)
  if (!handlers) {
    handlers = new Set()
    subscribers.set(key, handlers)
  }
  handlers.add(handler)

  return () => {
    handlers?.delete(handler)
    if (handlers && handlers.size === 0) subscribers.delete(key)
    if (subscribers.size === 0 && attached) {
      document.removeEventListener('keydown', dispatch)
      attached = false
    }
  }
}

/** Introspection used by tests to prove listeners are deduplicated. */
export function globalKeyListenerCount(): number {
  return attached ? 1 : 0
}
