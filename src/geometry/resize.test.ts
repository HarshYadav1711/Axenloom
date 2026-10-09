import { describe, expect, it } from 'vitest'
import { screenDeltaToWorldDelta } from './drag'
import {
  DEFAULT_MINIMUM_SIZE,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  resizeRect,
  type Rect,
} from './resize'
import { screenToWorld, worldToScreen } from './viewport'
import type { Viewport } from '../types/editor'

const origin: Rect = { x: 100, y: 200, width: 160, height: 100 }

function edges(rect: Rect) {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  }
}

describe('resizeRect', () => {
  it('Test A — southeast grows width/height with fixed top-left', () => {
    const next = resizeRect(origin, 'se', { x: 40, y: 20 })
    expect(next).toEqual({ x: 100, y: 200, width: 200, height: 120 })
    expect(edges(next).left).toBe(100)
    expect(edges(next).top).toBe(200)
  })

  it('Test B — northwest keeps bottom-right fixed', () => {
    const next = resizeRect(origin, 'nw', { x: -30, y: -20 })
    const o = edges(origin)
    const n = edges(next)
    expect(n.right).toBeCloseTo(o.right, 9)
    expect(n.bottom).toBeCloseTo(o.bottom, 9)
    expect(next.width).toBeCloseTo(190, 9)
    expect(next.height).toBeCloseTo(120, 9)
  })

  it('Test C — northeast keeps bottom-left fixed', () => {
    const next = resizeRect(origin, 'ne', { x: 25, y: -15 })
    const o = edges(origin)
    const n = edges(next)
    expect(n.left).toBeCloseTo(o.left, 9)
    expect(n.bottom).toBeCloseTo(o.bottom, 9)
    expect(next.width).toBeCloseTo(185, 9)
    expect(next.height).toBeCloseTo(115, 9)
  })

  it('Test D — southwest keeps top-right fixed', () => {
    const next = resizeRect(origin, 'sw', { x: -20, y: 30 })
    const o = edges(origin)
    const n = edges(next)
    expect(n.right).toBeCloseTo(o.right, 9)
    expect(n.top).toBeCloseTo(o.top, 9)
    expect(next.width).toBeCloseTo(180, 9)
    expect(next.height).toBeCloseTo(130, 9)
  })

  it('Test E — minimum width preserves anchored opposite edge', () => {
    const next = resizeRect(origin, 'se', { x: -10_000, y: 0 })
    expect(next.width).toBe(MIN_NODE_WIDTH)
    expect(next.x).toBe(origin.x)
    expect(next.height).toBe(origin.height)

    const fromNw = resizeRect(origin, 'nw', { x: 10_000, y: 0 })
    expect(fromNw.width).toBe(MIN_NODE_WIDTH)
    expect(edges(fromNw).right).toBeCloseTo(edges(origin).right, 9)
  })

  it('Test F — minimum height preserves anchored opposite edge', () => {
    const next = resizeRect(origin, 'se', { x: 0, y: -10_000 })
    expect(next.height).toBe(MIN_NODE_HEIGHT)
    expect(next.y).toBe(origin.y)

    const fromNe = resizeRect(origin, 'ne', { x: 0, y: 10_000 })
    expect(fromNe.height).toBe(MIN_NODE_HEIGHT)
    expect(edges(fromNe).bottom).toBeCloseTo(edges(origin).bottom, 9)
  })

  it('Test G — both-axis clamping during diagonal shrink', () => {
    const next = resizeRect(origin, 'nw', { x: 10_000, y: 10_000 })
    expect(next.width).toBe(MIN_NODE_WIDTH)
    expect(next.height).toBe(MIN_NODE_HEIGHT)
    expect(edges(next).right).toBeCloseTo(edges(origin).right, 9)
    expect(edges(next).bottom).toBeCloseTo(edges(origin).bottom, 9)
  })

  it('Test H — resizing across the world origin', () => {
    const straddling: Rect = { x: -40, y: -20, width: 80, height: 60 }
    const next = resizeRect(straddling, 'se', { x: 10, y: 10 })
    expect(next.x).toBe(-40)
    expect(next.y).toBe(-20)
    expect(next.width).toBe(90)
    expect(next.height).toBe(70)

    const nw = resizeRect(straddling, 'nw', { x: -10, y: -10 })
    expect(edges(nw).right).toBeCloseTo(40, 9)
    expect(edges(nw).bottom).toBeCloseTo(40, 9)
  })

  it('Test I — zoom independence via screen→world delta conversion', () => {
    const deltaScreen = { x: 100, y: 50 }
    const scales = [0.25, 0.5, 1, 2, 4] as const

    for (const scale of scales) {
      const deltaWorld = screenDeltaToWorldDelta(deltaScreen, scale)
      const next = resizeRect(origin, 'se', deltaWorld)
      expect(next.width).toBeCloseTo(origin.width + 100 / scale, 9)
      expect(next.height).toBeCloseTo(origin.height + 50 / scale, 9)
      expect(next.x).toBe(origin.x)
      expect(next.y).toBe(origin.y)
    }
  })

  it('Test J — nonzero viewport translation does not affect world resize math', () => {
    const viewport: Viewport = { x: 240, y: -80, scale: 1.5 }
    const startScreen = worldToScreen({ x: 260, y: 300 }, viewport)
    const currentScreen = {
      x: startScreen.x + 45,
      y: startScreen.y + 30,
    }
    const startWorld = screenToWorld(startScreen, viewport)
    const currentWorld = screenToWorld(currentScreen, viewport)
    const delta = {
      x: currentWorld.x - startWorld.x,
      y: currentWorld.y - startWorld.y,
    }
    const next = resizeRect(origin, 'se', delta)
    expect(next.width).toBeCloseTo(origin.width + 45 / 1.5, 9)
    expect(next.height).toBeCloseTo(origin.height + 30 / 1.5, 9)
  })

  it('Test K — does not mutate the original rectangle', () => {
    const snapshot = { ...origin }
    resizeRect(origin, 'nw', { x: -5, y: -5 })
    expect(origin).toEqual(snapshot)
  })

  it('Test N — zero delta leaves geometry unchanged', () => {
    for (const handle of ['nw', 'ne', 'sw', 'se'] as const) {
      expect(resizeRect(origin, handle, { x: 0, y: 0 })).toEqual(origin)
    }
  })

  it('accepts explicit minimum size overrides', () => {
    const next = resizeRect(
      origin,
      'se',
      { x: -10_000, y: -10_000 },
      { width: 10, height: 12 },
    )
    expect(next.width).toBe(10)
    expect(next.height).toBe(12)
    expect(DEFAULT_MINIMUM_SIZE).toEqual({
      width: MIN_NODE_WIDTH,
      height: MIN_NODE_HEIGHT,
    })
  })
})
