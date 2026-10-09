import type { Point } from './point'

/** Corner resize handles (Phase 3 — no edge-only handles). */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type MinimumSize = {
  width: number
  height: number
}

/**
 * Minimum node dimensions in world units (internal engineering decision).
 * Not an employer requirement.
 */
export const MIN_NODE_WIDTH = 32
export const MIN_NODE_HEIGHT = 32

export const DEFAULT_MINIMUM_SIZE: MinimumSize = {
  width: MIN_NODE_WIDTH,
  height: MIN_NODE_HEIGHT,
}

/** Visual handle size in CSS pixels; converted to world units via / viewport.scale. */
export const HANDLE_SIZE_SCREEN_PX = 9

/**
 * Resize a rectangle from a corner handle using world-space displacement
 * from the gesture origin. Does not mutate `original`.
 *
 * Anchored opposite edges stay fixed; minimum size is enforced without
 * inverting the rectangle.
 */
export function resizeRect(
  original: Rect,
  handle: ResizeHandle,
  deltaWorld: Point,
  minimumSize: MinimumSize = DEFAULT_MINIMUM_SIZE,
): Rect {
  const minW = Math.max(1, minimumSize.width)
  const minH = Math.max(1, minimumSize.height)

  const left = original.x
  const top = original.y
  const right = original.x + original.width
  const bottom = original.y + original.height

  switch (handle) {
    case 'se': {
      const newWidth = Math.max(minW, original.width + deltaWorld.x)
      const newHeight = Math.max(minH, original.height + deltaWorld.y)
      return {
        x: left,
        y: top,
        width: newWidth,
        height: newHeight,
      }
    }
    case 'nw': {
      const newLeft = Math.min(left + deltaWorld.x, right - minW)
      const newTop = Math.min(top + deltaWorld.y, bottom - minH)
      return {
        x: newLeft,
        y: newTop,
        width: right - newLeft,
        height: bottom - newTop,
      }
    }
    case 'ne': {
      // Anchor bottom-left: left and bottom fixed.
      const newRight = Math.max(left + minW, right + deltaWorld.x)
      const newTop = Math.min(top + deltaWorld.y, bottom - minH)
      return {
        x: left,
        y: newTop,
        width: newRight - left,
        height: bottom - newTop,
      }
    }
    case 'sw': {
      // Anchor top-right: right and top fixed.
      const newLeft = Math.min(left + deltaWorld.x, right - minW)
      const newBottom = Math.max(top + minH, bottom + deltaWorld.y)
      return {
        x: newLeft,
        y: top,
        width: right - newLeft,
        height: newBottom - top,
      }
    }
    default: {
      const _exhaustive: never = handle
      return _exhaustive
    }
  }
}

export function handleWorldSize(viewportScale: number): number {
  const scale = viewportScale > 0 && Number.isFinite(viewportScale) ? viewportScale : 1
  return HANDLE_SIZE_SCREEN_PX / scale
}

/**
 * Cap handle world size so opposite corners do not overlap on small nodes
 * (especially at minimum zoom). Does not change document geometry.
 */
export function clampedHandleWorldSize(
  node: Rect,
  viewportScale: number,
): number {
  const ideal = handleWorldSize(viewportScale)
  const maxByNode = Math.min(node.width, node.height) / 2
  const capped = Math.max(1, maxByNode * 0.9)
  return Math.min(ideal, capped)
}

export function cornerWorldPosition(
  node: Rect,
  handle: ResizeHandle,
): Point {
  switch (handle) {
    case 'nw':
      return { x: node.x, y: node.y }
    case 'ne':
      return { x: node.x + node.width, y: node.y }
    case 'sw':
      return { x: node.x, y: node.y + node.height }
    case 'se':
      return { x: node.x + node.width, y: node.y + node.height }
    default: {
      const _exhaustive: never = handle
      return _exhaustive
    }
  }
}

export function resizeCursor(handle: ResizeHandle): 'nwse-resize' | 'nesw-resize' {
  return handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize'
}
