import { describe, expect, it } from 'vitest'
import {
  hasExceededDragThreshold,
  screenDeltaToWorldDelta,
  worldDeltaBetween,
} from './drag'

describe('node drag geometry', () => {
  it('Test B — world delta is currentWorld − startWorld', () => {
    expect(
      worldDeltaBetween({ x: 10, y: 20 }, { x: 40, y: 5 }),
    ).toEqual({ x: 30, y: -15 })
  })

  it('Test C — same screen displacement yields inverse world delta at scale', () => {
    const deltaScreen = { x: 100, y: 0 }
    expect(screenDeltaToWorldDelta(deltaScreen, 0.5)).toEqual({
      x: 200,
      y: 0,
    })
    expect(screenDeltaToWorldDelta(deltaScreen, 1)).toEqual({ x: 100, y: 0 })
    expect(screenDeltaToWorldDelta(deltaScreen, 2)).toEqual({ x: 50, y: 0 })
  })

  it('click-versus-drag threshold ignores sub-threshold motion', () => {
    const start = { x: 0, y: 0 }
    expect(hasExceededDragThreshold(start, { x: 2, y: 0 })).toBe(false)
    expect(hasExceededDragThreshold(start, { x: 3, y: 0 })).toBe(true)
  })
})
