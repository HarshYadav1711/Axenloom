import type { Point } from '../geometry/point'
import type { ResizeHandle } from '../geometry/resize'
import type { CanvasNode, Selection, Viewport } from './editor'

/**
 * Explicit interaction state machine.
 * Phase 4: idle, pan, nodeDrag, nodeResize, marquee.
 */
export type InteractionState =
  | { mode: 'idle' }
  | {
      mode: 'pan'
      pointerId: number
      startPointer: Point
      originViewport: Viewport
    }
  | {
      mode: 'nodeDrag'
      pointerId: number
      nodeId: string
      startScreen: Point
      startWorld: Point
      originNode: CanvasNode
      hasMoved: boolean
    }
  | {
      mode: 'nodeResize'
      pointerId: number
      nodeId: string
      handle: ResizeHandle
      startWorld: Point
      originNode: CanvasNode
    }
  | {
      mode: 'marquee'
      pointerId: number
      startScreen: Point
      startWorld: Point
      currentWorld: Point
      /** Committed selection before the marquee began (restored on cancel). */
      previousSelection: Selection
      hasCrossedThreshold: boolean
    }

export const IDLE_INTERACTION: InteractionState = { mode: 'idle' }
