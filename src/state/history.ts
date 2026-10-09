import type { CanvasNode, Selection } from '../types/editor'
import { reconcileSelection } from './document'

/** Max completed edits retained in `past` (oldest discarded). */
export const HISTORY_CAPACITY = 100

/** Absolute tolerance for geometry no-op detection (world units). */
export const GEOMETRY_EPSILON = 1e-6

export type DocumentSnapshot = {
  nodes: CanvasNode[]
  selection: Selection
}

export type HistoryStacks = {
  past: DocumentSnapshot[]
  future: DocumentSnapshot[]
}

export const EMPTY_HISTORY: HistoryStacks = {
  past: [],
  future: [],
}

export function nearlyEqual(
  a: number,
  b: number,
  epsilon: number = GEOMETRY_EPSILON,
): boolean {
  return Math.abs(a - b) <= epsilon
}

export function nodeGeometryEqual(
  a: CanvasNode,
  b: CanvasNode,
  epsilon: number = GEOMETRY_EPSILON,
): boolean {
  return (
    a.id === b.id &&
    nearlyEqual(a.x, b.x, epsilon) &&
    nearlyEqual(a.y, b.y, epsilon) &&
    nearlyEqual(a.width, b.width, epsilon) &&
    nearlyEqual(a.height, b.height, epsilon)
  )
}

/** Ordered document equality (ids + geometry). Selection ignored. */
export function nodesEqual(
  a: readonly CanvasNode[],
  b: readonly CanvasNode[],
  epsilon: number = GEOMETRY_EPSILON,
): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i += 1) {
    if (!nodeGeometryEqual(a[i], b[i], epsilon)) {
      return false
    }
  }
  return true
}

export function selectionEqual(a: Selection, b: Selection): boolean {
  if (a.size !== b.size) {
    return false
  }
  for (const id of a) {
    if (!b.has(id)) {
      return false
    }
  }
  return true
}

/** Deep-clone nodes and selection so snapshots stay immutable. */
export function cloneSnapshot(snapshot: DocumentSnapshot): DocumentSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({ ...node })),
    selection: new Set(snapshot.selection),
  }
}

export function createSnapshot(
  nodes: readonly CanvasNode[],
  selection: Selection,
): DocumentSnapshot {
  return cloneSnapshot({
    nodes: [...nodes],
    selection,
  })
}

/**
 * Restore a snapshot: fresh node copies + selection reconciled to living ids.
 */
export function restoreSnapshot(snapshot: DocumentSnapshot): DocumentSnapshot {
  const nodes = snapshot.nodes.map((node) => ({ ...node }))
  const selection = reconcileSelection(new Set(snapshot.selection), nodes)
  return { nodes, selection }
}

export function canUndo(history: HistoryStacks): boolean {
  return history.past.length > 0
}

export function canRedo(history: HistoryStacks): boolean {
  return history.future.length > 0
}

/**
 * Record one completed edit: push pre-edit snapshot to past, clear future.
 * Does not store the post-edit present (authoritative present lives in React).
 */
export function commitTransaction(
  history: HistoryStacks,
  before: DocumentSnapshot,
): HistoryStacks {
  const past = [...history.past, cloneSnapshot(before)]
  if (past.length > HISTORY_CAPACITY) {
    past.splice(0, past.length - HISTORY_CAPACITY)
  }
  return {
    past,
    future: [],
  }
}

/**
 * Undo: present → future, restore latest past.
 * Returns null when past is empty.
 */
export function undoTransaction(
  history: HistoryStacks,
  present: DocumentSnapshot,
): { history: HistoryStacks; present: DocumentSnapshot } | null {
  if (history.past.length === 0) {
    return null
  }
  const previous = history.past[history.past.length - 1]
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [cloneSnapshot(present), ...history.future],
    },
    present: restoreSnapshot(previous),
  }
}

/**
 * Redo: present → past, restore next future.
 * Returns null when future is empty.
 */
export function redoTransaction(
  history: HistoryStacks,
  present: DocumentSnapshot,
): { history: HistoryStacks; present: DocumentSnapshot } | null {
  if (history.future.length === 0) {
    return null
  }
  const [next, ...rest] = history.future
  return {
    history: {
      past: [...history.past, cloneSnapshot(present)],
      future: rest,
    },
    present: restoreSnapshot(next),
  }
}
