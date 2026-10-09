import { describe, expect, it } from 'vitest'
import type { CanvasNode } from '../types/editor'
import { screenToWorld, worldToScreen } from './viewport'
import type { Viewport } from '../types/editor'
import {
  cloneSelection,
  normalizeRectangle,
  rectanglesIntersect,
  selectIntersectingNodes,
} from './rectangles'
import { hasExceededDragThreshold } from './drag'
import type { Rect } from './resize'

const nodeA: CanvasNode = {
  id: 'a',
  x: 0,
  y: 0,
  width: 100,
  height: 80,
}
const nodeB: CanvasNode = {
  id: 'b',
  x: 150,
  y: 20,
  width: 60,
  height: 40,
}
const nodeC: CanvasNode = {
  id: 'c',
  x: -80,
  y: -50,
  width: 40,
  height: 30,
}

describe('normalizeRectangle', () => {
  it('Test A — four drag directions produce identical bounds', () => {
    const start = { x: 10, y: 20 }
    const end = { x: 40, y: 50 }
    const expected = { x: 10, y: 20, width: 30, height: 30 }

    expect(normalizeRectangle(start, end)).toEqual(expected)
    expect(normalizeRectangle(end, start)).toEqual(expected)
    expect(normalizeRectangle({ x: 40, y: 20 }, { x: 10, y: 50 })).toEqual(
      expected,
    )
    expect(normalizeRectangle({ x: 10, y: 50 }, { x: 40, y: 20 })).toEqual(
      expected,
    )
  })

  it('Test G — works with negative world coordinates', () => {
    expect(
      normalizeRectangle({ x: -10, y: -5 }, { x: -40, y: 20 }),
    ).toEqual({ x: -40, y: -5, width: 30, height: 25 })
  })

  it('Test H — zero-size marquee has zero dimensions', () => {
    expect(normalizeRectangle({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
      width: 0,
      height: 0,
    })
  })
})

describe('rectanglesIntersect', () => {
  const base: Rect = { x: 0, y: 0, width: 100, height: 100 }

  it('Test B — partial overlap intersects', () => {
    expect(
      rectanglesIntersect(base, { x: 80, y: 80, width: 40, height: 40 }),
    ).toBe(true)
  })

  it('Test C — full containment intersects', () => {
    expect(
      rectanglesIntersect(base, { x: 20, y: 20, width: 10, height: 10 }),
    ).toBe(true)
  })

  it('Test D — marquee inside node intersects', () => {
    expect(
      rectanglesIntersect(
        { x: 0, y: 0, width: 200, height: 200 },
        { x: 50, y: 50, width: 20, height: 20 },
      ),
    ).toBe(true)
  })

  it('Test E — separated rectangles do not intersect', () => {
    expect(
      rectanglesIntersect(base, { x: 200, y: 200, width: 10, height: 10 }),
    ).toBe(false)
  })

  it('Test F — edge-only and corner-only contact do not count', () => {
    expect(
      rectanglesIntersect(base, { x: 100, y: 0, width: 20, height: 20 }),
    ).toBe(false)
    expect(
      rectanglesIntersect(base, { x: 0, y: 100, width: 20, height: 20 }),
    ).toBe(false)
    expect(
      rectanglesIntersect(base, { x: 100, y: 100, width: 20, height: 20 }),
    ).toBe(false)
  })
})

describe('selectIntersectingNodes', () => {
  const nodes = [nodeA, nodeB, nodeC]

  it('Test I/J — returns all intersecting IDs and excludes outsiders', () => {
    // Covers nodeA and partially overlaps nodeC; misses nodeB.
    const marquee = { x: -70, y: -40, width: 120, height: 100 }
    const selected = selectIntersectingNodes(nodes, marquee)
    expect(selected.has('a')).toBe(true)
    expect(selected.has('b')).toBe(false)
    expect(selected.has('c')).toBe(true)
  })

  it('Test H — zero-area marquee selects nothing', () => {
    expect(selectIntersectingNodes(nodes, { x: 10, y: 10, width: 0, height: 0 }).size).toBe(0)
  })

  it('Test K — does not mutate a previous selection set', () => {
    const previous = new Set(['b'])
    const snapshot = new Set(previous)
    const next = selectIntersectingNodes(nodes, {
      x: -100,
      y: -100,
      width: 50,
      height: 50,
    })
    expect(previous).toEqual(snapshot)
    expect(next).not.toBe(previous)
    expect(cloneSelection(previous)).toEqual(previous)
  })

  it('Test L — opposite drag directions yield identical selection', () => {
    const start = { x: 140, y: 10 }
    const end = { x: 220, y: 70 }
    const a = selectIntersectingNodes(nodes, normalizeRectangle(start, end))
    const b = selectIntersectingNodes(nodes, normalizeRectangle(end, start))
    expect([...a].sort()).toEqual([...b].sort())
    expect(a.has('b')).toBe(true)
  })

  it('Test M — pan/zoom conversion selects the same world nodes', () => {
    const viewport: Viewport = { x: 120, y: -40, scale: 2 }
    const worldStart = { x: -10, y: -10 }
    const worldEnd = { x: 110, y: 90 }
    const screenStart = worldToScreen(worldStart, viewport)
    const screenEnd = worldToScreen(worldEnd, viewport)
    const recovered = normalizeRectangle(
      screenToWorld(screenStart, viewport),
      screenToWorld(screenEnd, viewport),
    )
    const direct = normalizeRectangle(worldStart, worldEnd)
    expect(recovered.x).toBeCloseTo(direct.x, 9)
    expect(recovered.y).toBeCloseTo(direct.y, 9)
    expect(recovered.width).toBeCloseTo(direct.width, 9)
    expect(recovered.height).toBeCloseTo(direct.height, 9)

    const selected = selectIntersectingNodes(nodes, recovered)
    expect(selected.has('a')).toBe(true)
    expect(selected.has('b')).toBe(false)
  })
})

describe('marquee click threshold', () => {
  it('Test N — screen-space threshold distinguishes click vs drag', () => {
    const start = { x: 0, y: 0 }
    expect(hasExceededDragThreshold(start, { x: 2, y: 0 })).toBe(false)
    expect(hasExceededDragThreshold(start, { x: 3, y: 0 })).toBe(true)
  })
})

describe('selection transaction helpers', () => {
  it('Test O — cloneSelection returns an independent set', () => {
    const previous = new Set(['a', 'b'])
    const cloned = new Set(cloneSelection(previous))
    cloned.add('c')
    expect(previous.has('c')).toBe(false)
    expect(cloned.has('c')).toBe(true)
  })
})
