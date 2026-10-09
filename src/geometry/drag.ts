import type { Point } from './point'

/** Screen-pixel distance before a node press becomes a drag (internal decision). */
export const NODE_DRAG_THRESHOLD_PX = 3

export function pointDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function worldDeltaBetween(startWorld: Point, currentWorld: Point): Point {
  return {
    x: currentWorld.x - startWorld.x,
    y: currentWorld.y - startWorld.y,
  }
}

/**
 * Convert a screen-space displacement into world units at the given scale.
 * Used by tests and as the conceptual inverse of pan (which stays in screen space).
 */
export function screenDeltaToWorldDelta(
  deltaScreen: Point,
  scale: number,
): Point {
  return {
    x: deltaScreen.x / scale,
    y: deltaScreen.y / scale,
  }
}

export function hasExceededDragThreshold(
  startScreen: Point,
  currentScreen: Point,
  thresholdPx: number = NODE_DRAG_THRESHOLD_PX,
): boolean {
  return pointDistance(startScreen, currentScreen) >= thresholdPx
}
