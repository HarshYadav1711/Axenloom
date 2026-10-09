import type { CanvasNode, Selection } from '../types/editor'

/**
 * Deterministic demonstration shapes for Phase 2+.
 * Not simulated backend data — fixed sample editing objects near the world origin.
 * Users can create and delete additional rectangles from Phase 5 onward.
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

/**
 * Append a new node. Rejects duplicate IDs and invalid geometry.
 * Does not mutate `nodes` or `node`.
 *
 * Phase 6 note: one successful add = one history transaction boundary.
 */
export function addNode(
  nodes: readonly CanvasNode[],
  node: CanvasNode,
): CanvasNode[] {
  if (!isValidNodeGeometry(node)) {
    return [...nodes]
  }
  if (nodes.some((existing) => existing.id === node.id)) {
    return [...nodes]
  }
  return [...nodes, { ...node }]
}

/**
 * Remove every node whose id is in `selectedIds`.
 * Unknown IDs are ignored. Empty selection is a no-op copy.
 *
 * Phase 6 note: one delete action (any count) = one history transaction.
 */
export function deleteSelectedNodes(
  nodes: readonly CanvasNode[],
  selectedIds: ReadonlySet<string>,
): CanvasNode[] {
  if (selectedIds.size === 0) {
    return [...nodes]
  }
  return nodes.filter((node) => !selectedIds.has(node.id))
}

/** Drop selection IDs that no longer exist in the document. */
export function reconcileSelection(
  selection: Selection,
  nodes: readonly CanvasNode[],
): Selection {
  if (selection.size === 0) {
    return selection
  }
  const living = new Set(nodes.map((node) => node.id))
  const next = new Set<string>()
  for (const id of selection) {
    if (living.has(id)) {
      next.add(id)
    }
  }
  return next
}
