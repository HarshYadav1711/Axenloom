import type { Viewport } from '../types/editor'
import type { Point } from './point'

/** Internal engineering bounds — not an employer requirement. */
export const MIN_SCALE = 0.25
export const MAX_SCALE = 4

/** Scale factor applied per normalized wheel pixel (exponential zoom). */
export const WHEEL_ZOOM_SENSITIVITY = 0.0015

export function worldToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y,
  }
}

export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  }
}

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return MIN_SCALE
  }
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/**
 * Cursor-centered zoom: the world point under `cursor` stays fixed in screen space.
 */
export function zoomAtCursor(
  viewport: Viewport,
  cursor: Point,
  zoomFactor: number,
): Viewport {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    return viewport
  }

  const worldPoint = screenToWorld(cursor, viewport)
  const newScale = clampScale(viewport.scale * zoomFactor)

  return {
    x: cursor.x - worldPoint.x * newScale,
    y: cursor.y - worldPoint.y * newScale,
    scale: newScale,
  }
}

/**
 * Pan using gesture origin + original viewport translation (screen-space deltas).
 * Does not divide by scale — 100 screen pixels pan 100 screen pixels at any zoom.
 */
export function panFromOrigin(
  originViewport: Viewport,
  startPointer: Point,
  currentPointer: Point,
): Viewport {
  return {
    x: originViewport.x + (currentPointer.x - startPointer.x),
    y: originViewport.y + (currentPointer.y - startPointer.y),
    scale: originViewport.scale,
  }
}

/**
 * Normalize wheel deltas across pixel / line / page modes, then map to a zoom factor.
 * Negative deltaY (wheel up / pinch-out on many devices) zooms in.
 */
export function wheelEventToZoomFactor(
  deltaY: number,
  deltaMode: number,
): number {
  let delta = deltaY
  if (deltaMode === 1) {
    // DOM_DELTA_LINE
    delta *= 16
  } else if (deltaMode === 2) {
    // DOM_DELTA_PAGE
    delta *= 800
  }

  if (!Number.isFinite(delta) || delta === 0) {
    return 1
  }

  return Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY)
}

/**
 * SVG transform string matching screen = world * scale + translation.
 * Order is translate then scale in the attribute; SVG applies right-to-left,
 * so the point is scaled first, then translated.
 */
export function viewportWorldTransform(viewport: Viewport): string {
  return `translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`
}

export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`
}
