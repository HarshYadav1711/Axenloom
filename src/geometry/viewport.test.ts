import { describe, expect, it } from 'vitest'
import type { Viewport } from '../types/editor'
import { clientToSvgPoint } from './pointer'
import { pointsApproximatelyEqual, type Point } from './point'
import {
  MAX_SCALE,
  MIN_SCALE,
  clampScale,
  panFromOrigin,
  screenToWorld,
  wheelEventToZoomFactor,
  worldToScreen,
  zoomAtCursor,
} from './viewport'

const EPSILON = 1e-9

function expectPointsEqual(actual: Point, expected: Point, epsilon = EPSILON) {
  expect(pointsApproximatelyEqual(actual, expected, epsilon)).toBe(true)
}

describe('world ↔ screen conversion', () => {
  it('Test A — round-trip world → screen → world preserves points', () => {
    const viewports: Viewport[] = [
      { x: 0, y: 0, scale: 1 },
      { x: 120, y: -40, scale: 0.5 },
      { x: -200, y: 80, scale: 2 },
      { x: 33.3, y: 77.7, scale: 1.25 },
    ]
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: -50 },
      { x: -250, y: 400 },
      { x: 12.5, y: 0.25 },
    ]

    for (const viewport of viewports) {
      for (const point of points) {
        const screen = worldToScreen(point, viewport)
        const back = screenToWorld(screen, viewport)
        expectPointsEqual(back, point)
      }
    }
  })

  it('Test B — inverse round-trip screen → world → screen preserves screen points', () => {
    const viewport: Viewport = { x: 48, y: -96, scale: 1.5 }
    const screenPoints: Point[] = [
      { x: 0, y: 0 },
      { x: 320, y: 180 },
      { x: -10, y: 900 },
    ]

    for (const screen of screenPoints) {
      const world = screenToWorld(screen, viewport)
      const back = worldToScreen(world, viewport)
      expectPointsEqual(back, screen)
    }
  })

  it('Test G — handles negative translations and large world coordinates', () => {
    const viewport: Viewport = { x: -1500, y: 2200, scale: 0.75 }
    const point: Point = { x: -10_000, y: 50_000 }
    const screen = worldToScreen(point, viewport)
    expect(screen.x).toBeCloseTo(-1500 + -10_000 * 0.75, 9)
    expect(screen.y).toBeCloseTo(2200 + 50_000 * 0.75, 9)
    expectPointsEqual(screenToWorld(screen, viewport), point)
  })
})

describe('cursor-centered zoom', () => {
  it('Test C — zooming in keeps the world point under the cursor fixed in screen space', () => {
    const viewport: Viewport = { x: 80, y: -30, scale: 1 }
    const cursor: Point = { x: 240, y: 160 }
    const worldBefore = screenToWorld(cursor, viewport)

    const next = zoomAtCursor(viewport, cursor, 1.25)
    expect(next.scale).toBeCloseTo(1.25, 9)
    expectPointsEqual(worldToScreen(worldBefore, next), cursor)
  })

  it('Test C — zooming out keeps the world point under the cursor fixed in screen space', () => {
    const viewport: Viewport = { x: -40, y: 60, scale: 2 }
    const cursor: Point = { x: 10, y: 400 }
    const worldBefore = screenToWorld(cursor, viewport)

    const next = zoomAtCursor(viewport, cursor, 0.8)
    expect(next.scale).toBeCloseTo(1.6, 9)
    expectPointsEqual(worldToScreen(worldBefore, next), cursor)
  })

  it('Test D — clampScale enforces lower and upper bounds', () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE)
    expect(clampScale(0)).toBe(MIN_SCALE)
    expect(clampScale(-2)).toBe(MIN_SCALE)
    expect(clampScale(Number.NaN)).toBe(MIN_SCALE)
    expect(clampScale(Number.POSITIVE_INFINITY)).toBe(MIN_SCALE)
    expect(clampScale(10)).toBe(MAX_SCALE)
    expect(clampScale(1)).toBe(1)
    expect(clampScale(MIN_SCALE)).toBe(MIN_SCALE)
    expect(clampScale(MAX_SCALE)).toBe(MAX_SCALE)
  })

  it('Test D — repeated zoom near bounds clamps and keeps cursor anchoring', () => {
    let viewport: Viewport = { x: 20, y: 40, scale: MAX_SCALE }
    const cursor: Point = { x: 100, y: 200 }

    for (let i = 0; i < 8; i += 1) {
      const worldBefore = screenToWorld(cursor, viewport)
      viewport = zoomAtCursor(viewport, cursor, 1.2)
      expect(viewport.scale).toBe(MAX_SCALE)
      expectPointsEqual(worldToScreen(worldBefore, viewport), cursor)
    }

    viewport = { x: -15, y: 8, scale: MIN_SCALE }
    for (let i = 0; i < 8; i += 1) {
      const worldBefore = screenToWorld(cursor, viewport)
      viewport = zoomAtCursor(viewport, cursor, 0.7)
      expect(viewport.scale).toBe(MIN_SCALE)
      expectPointsEqual(worldToScreen(worldBefore, viewport), cursor)
    }
  })

  it('ignores non-positive zoom factors without mutating the viewport', () => {
    const viewport: Viewport = { x: 1, y: 2, scale: 1 }
    expect(zoomAtCursor(viewport, { x: 0, y: 0 }, 0)).toEqual(viewport)
    expect(zoomAtCursor(viewport, { x: 0, y: 0 }, -1)).toEqual(viewport)
  })
})

describe('panning mathematics', () => {
  it('Test E — screen-space pan is independent of zoom scale', () => {
    const start: Point = { x: 100, y: 100 }
    const current: Point = { x: 160, y: 70 }
    const scales = [0.5, 1, 2]

    for (const scale of scales) {
      const origin: Viewport = { x: 10, y: 20, scale }
      const next = panFromOrigin(origin, start, current)
      expect(next).toEqual({
        x: 10 + 60,
        y: 20 - 30,
        scale,
      })
    }
  })
})

describe('pointer offset conversion', () => {
  it('Test F — client coordinates are converted relative to the SVG bounding rect', () => {
    const svgRect = { left: 120, top: 80 }
    const client: Point = { x: 200, y: 150 }
    expect(clientToSvgPoint(client, svgRect)).toEqual({ x: 80, y: 70 })
  })

  it('Test F — does not treat page-origin client coordinates as SVG-local', () => {
    const svgRect = { left: 64, top: 48 }
    const client: Point = { x: 64, y: 48 }
    expect(clientToSvgPoint(client, svgRect)).toEqual({ x: 0, y: 0 })
  })
})

describe('wheel normalization', () => {
  it('maps opposing wheel directions to inverse zoom factors', () => {
    const inFactor = wheelEventToZoomFactor(-100, 0)
    const outFactor = wheelEventToZoomFactor(100, 0)
    expect(inFactor).toBeGreaterThan(1)
    expect(outFactor).toBeLessThan(1)
    expect(inFactor * outFactor).toBeCloseTo(1, 9)
  })

  it('scales line-mode deltas relative to pixel mode', () => {
    const pixel = wheelEventToZoomFactor(-1, 0)
    const line = wheelEventToZoomFactor(-1, 1)
    expect(line).not.toBeCloseTo(pixel, 5)
    expect(line).toBeGreaterThan(pixel)
  })
})
