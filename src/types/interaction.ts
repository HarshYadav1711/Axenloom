import type { Point } from '../geometry/point'
import type { Viewport } from './editor'

/**
 * Explicit interaction state machine (Phase 1: idle + pan only).
 * Future modes are reserved in editor types but not implemented here.
 */
export type InteractionState =
  | { mode: 'idle' }
  | {
      mode: 'pan'
      pointerId: number
      startPointer: Point
      originViewport: Viewport
    }

export const IDLE_INTERACTION: InteractionState = { mode: 'idle' }
