import type { CanvasNode, Selection } from '../types/editor'

/**
 * Deterministic demonstration shapes for Phase 2.
 * Not simulated backend data — fixed sample editing objects near the world origin.
 */
const INITIAL_NODE_TEMPLATES: readonly CanvasNode[] = [
  { id: 'node-a', x: -40, y: -30, width: 120, height: 80 },
  { id: 'node-b', x: 120, y: -20, width: 160, height: 100 },
  { id: 'node-c', x: -20, y: 90, width: 90, height: 90 },
]

/** Fresh copies so module templates are never mutated. */
export function createInitialNodes(): CanvasNode[] {
  return INITIAL_NODE_TEMPLATES.map((node) => ({ ...node }))
}

export function emptySelection(): Selection {
  return new Set()
}

export function selectOnly(nodeId: string): Selection {
  return new Set([nodeId])
}

export function findNode(
  nodes: readonly CanvasNode[],
  nodeId: string,
): CanvasNode | undefined {
  return nodes.find((node) => node.id === nodeId)
}

/**
 * Replace one node by id. Returns the same array reference when the id is absent.
 */
export function replaceNode(
  nodes: readonly CanvasNode[],
  next: CanvasNode,
): CanvasNode[] {
  let changed = false
  const result = nodes.map((node) => {
    if (node.id !== next.id) {
      return node
    }
    changed = true
    return next
  })
  return changed ? result : [...nodes]
}

/**
 * Move a node from its gesture-origin geometry by a world-space delta.
 * Preserves width/height; does not mutate `nodes` or `origin`.
 */
export function moveNodeFromOrigin(
  nodes: readonly CanvasNode[],
  nodeId: string,
  origin: CanvasNode,
  deltaWorld: { x: number; y: number },
): CanvasNode[] {
  if (origin.id !== nodeId) {
    return [...nodes]
  }

  return replaceNode(nodes, {
    ...origin,
    x: origin.x + deltaWorld.x,
    y: origin.y + deltaWorld.y,
  })
}

/**
 * Apply resized geometry for one node from its gesture-origin snapshot.
 * Preserves id; does not mutate `nodes` or `origin`.
 */
export function resizeNodeFromOrigin(
  nodes: readonly CanvasNode[],
  nodeId: string,
  origin: CanvasNode,
  nextRect: Pick<CanvasNode, 'x' | 'y' | 'width' | 'height'>,
): CanvasNode[] {
  if (origin.id !== nodeId) {
    return [...nodes]
  }

  return replaceNode(nodes, {
    ...origin,
    x: nextRect.x,
    y: nextRect.y,
    width: nextRect.width,
    height: nextRect.height,
  })
}

export function isValidNodeGeometry(node: CanvasNode): boolean {
  return (
    Number.isFinite(node.x) &&
    Number.isFinite(node.y) &&
    Number.isFinite(node.width) &&
    Number.isFinite(node.height) &&
    node.width > 0 &&
    node.height > 0
  )
}
