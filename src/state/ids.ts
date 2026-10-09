export type IdFactory = () => string

/**
 * Stable unique IDs for new nodes.
 * Prefer `crypto.randomUUID()`; fall back when unavailable (older runtimes / tests).
 */
export function createNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
