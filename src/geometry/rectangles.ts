import type { CanvasNode, Selection } from '../types/editor'
import type { Point } from './point'
import type { Rect } from './resize'

/**
 * Normalize a drag between two world points into a rect with nonnegative size.
 * Dragging in any direction yields the same geometric bounds.
 */
export function normalizeRectangle(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

/**
 * Strict positive-area axis-aligned overlap (Legman handoff semantics).
 * Edge- or corner-only contact does not count — requires a < / > (not ≤ / ≥).
 */
export function rectanglesIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function nodeAsRect(node: Pick<CanvasNode, 'x' | 'y' | 'width' | 'height'>): Rect {
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }
}

/**
 * Return IDs of every node that positively overlaps the marquee.
 * Zero-area marquees select nothing. Result is a new Set (immutable vs callers).
 */
export function selectIntersectingNodes(
  nodes: readonly CanvasNode[],
  marquee: Rect,
): Selection {
  const selected = new Set<string>()
  if (marquee.width <= 0 || marquee.height <= 0) {
    return selected
  }

  for (const node of nodes) {
    if (rectanglesIntersect(nodeAsRect(node), marquee)) {
      selected.add(node.id)
    }
  }
  return selected
}

export function cloneSelection(selection: Selection): Selection {
  return new Set(selection)
}
