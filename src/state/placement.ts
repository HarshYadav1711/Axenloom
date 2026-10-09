import type { Viewport } from '../types/editor'
import { screenToWorld } from '../geometry/viewport'
import type { Point } from '../geometry/point'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './nodeDefaults'

/** Cascade step in screen pixels between successive creations. */
export const CREATION_OFFSET_SCREEN_PX = 24

/** Number of cascade steps before wrapping back to the viewport center. */
export const CREATION_OFFSET_WRAP = 8

export type PlacementInput = {
  viewport: Viewport
  svgWidth: number
  svgHeight: number
  /** How many nodes have already been created this session (0-based). */
  creationIndex: number
  width?: number
  height?: number
}

/**
 * Place a new rectangle near the visible SVG center with a deterministic
 * screen-space cascade offset, then convert to world coordinates.
 *
 * World width/height stay constant across zoom; only the center shifts.
 */
export function placeNewNodeRect(input: PlacementInput): {
  x: number
  y: number
  width: number
  height: number
  worldCenter: Point
} {
  const width = input.width ?? DEFAULT_NODE_WIDTH
  const height = input.height ?? DEFAULT_NODE_HEIGHT
  const svgWidth = Math.max(1, input.svgWidth)
  const svgHeight = Math.max(1, input.svgHeight)

  const step = input.creationIndex % CREATION_OFFSET_WRAP
  const screenCenter: Point = {
    x: svgWidth / 2 + step * CREATION_OFFSET_SCREEN_PX,
    y: svgHeight / 2 + step * CREATION_OFFSET_SCREEN_PX,
  }

  const worldCenter = screenToWorld(screenCenter, input.viewport)

  return {
    x: worldCenter.x - width / 2,
    y: worldCenter.y - height / 2,
    width,
    height,
    worldCenter,
  }
}
