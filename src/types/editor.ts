/**
 * Minimal shared types for Axenloom's editor architecture.
 * Interaction handlers and reducers are intentionally deferred to later phases.
 */

/** Viewport pan translation is in screen space; scale is unitless. */
export interface Viewport {
  x: number
  y: number
  scale: number
}

/** Axis-aligned rectangle node in world space. */
export interface CanvasNode {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/** Primary editor tools. Hand is the default mode (internal decision). */
export type EditorTool = 'hand' | 'select'

/** Selected node identifiers. */
export type Selection = ReadonlySet<string>

/**
 * High-level interaction modes for the planned state machine.
 * Concrete gesture payloads are added when those phases land.
 */
export type InteractionMode =
  | 'idle'
  | 'pan'
  | 'nodeDrag'
  | 'resize'
  | 'marquee'

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  scale: 1,
}

export const DEFAULT_TOOL: EditorTool = 'hand'
