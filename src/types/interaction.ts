import type { Point } from '../geometry/point'
import type { CanvasNode, Viewport } from './editor'

/**
 * Explicit interaction state machine.
 * Phase 2: idle, pan, and nodeDrag. Resize/marquee remain unimplemented.
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
      /** SVG-local screen position at pointer-down. */
      startScreen: Point
      /** World position under the pointer at pointer-down. */
      startWorld: Point
      /** Node geometry at gesture start — used for updates and cancel restore. */
      originNode: CanvasNode
      /** True once movement crossed the click-versus-drag threshold. */
      hasMoved: boolean
    }

export const IDLE_INTERACTION: InteractionState = { mode: 'idle' }
