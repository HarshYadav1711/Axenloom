import type { Point } from './point'

/** Axis-aligned bounds needed to convert client coordinates into SVG-local space. */
export type SvgClientRect = {
  left: number
  top: number
}

/**
 * Convert browser client coordinates to SVG-local screen coordinates.
 *
 * Phase 1 assumption: the workspace SVG has no viewBox and its user units
 * correspond 1:1 with CSS pixels of its bounding client rect. If a viewBox
 * is introduced later, compensate with the SVG CTM instead.
 */
export function clientToSvgPoint(
  client: Point,
  svgRect: SvgClientRect,
): Point {
  return {
    x: client.x - svgRect.left,
    y: client.y - svgRect.top,
  }
}
