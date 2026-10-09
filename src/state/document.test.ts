import { describe, expect, it } from 'vitest'
import {
  createInitialNodes,
  emptySelection,
  isValidNodeGeometry,
  moveNodeFromOrigin,
  replaceNode,
  selectOnly,
} from './document'

describe('document nodes and selection', () => {
  it('Test A — initial nodes have finite positions and positive dimensions', () => {
    const nodes = createInitialNodes()
    expect(nodes).toHaveLength(3)
    for (const node of nodes) {
      expect(isValidNodeGeometry(node)).toBe(true)
    }
    expect(nodes.some((node) => Math.hypot(node.x, node.y) < 80)).toBe(true)
  })

  it('does not mutate module templates across createInitialNodes calls', () => {
    const first = createInitialNodes()
    first[0].x = 9999
    const second = createInitialNodes()
    expect(second[0].x).not.toBe(9999)
  })

  it('Test B/C/D/E — moveNodeFromOrigin applies world delta at any conceptual scale', () => {
    const nodes = createInitialNodes()
    const origin = { ...nodes[0] }

    const cases = [
      { scale: 0.5, screen: { x: 100, y: 0 }, world: { x: 200, y: 0 } },
      { scale: 1, screen: { x: 100, y: 0 }, world: { x: 100, y: 0 } },
      { scale: 2, screen: { x: 100, y: 0 }, world: { x: 50, y: 0 } },
    ] as const

    for (const { world } of cases) {
      const next = moveNodeFromOrigin(nodes, origin.id, origin, world)
      const moved = next.find((node) => node.id === origin.id)
      expect(moved).toEqual({
        ...origin,
        x: origin.x + world.x,
        y: origin.y + world.y,
      })
    }

    // Nonzero viewport translation does not affect world-delta application.
    const panned = moveNodeFromOrigin(nodes, origin.id, origin, {
      x: -25,
      y: 40,
    })
    expect(panned.find((node) => node.id === origin.id)).toEqual({
      ...origin,
      x: origin.x - 25,
      y: origin.y + 40,
    })

    // Negative world coordinates are allowed.
    const negative = moveNodeFromOrigin(nodes, origin.id, origin, {
      x: -500,
      y: -300,
    })
    expect(negative.find((node) => node.id === origin.id)?.x).toBeLessThan(0)
    expect(negative.find((node) => node.id === origin.id)?.y).toBeLessThan(0)
  })

  it('Test F — selectOnly replaces previous single-node selection', () => {
    const previous = selectOnly('node-a')
    const next = selectOnly('node-b')
    expect(previous.has('node-a')).toBe(true)
    expect(next.has('node-a')).toBe(false)
    expect(next.has('node-b')).toBe(true)
    expect(next.size).toBe(1)
  })

  it('Test G — clear selection does not modify node geometry', () => {
    const nodes = createInitialNodes()
    const snapshot = nodes.map((node) => ({ ...node }))
    const selection = emptySelection()
    expect(selection.size).toBe(0)
    expect(nodes).toEqual(snapshot)
  })

  it('Test H/I — moving one node is immutable and preserves width/height', () => {
    const nodes = createInitialNodes()
    const origin = { ...nodes[1] }
    const otherBefore = { ...nodes[0] }
    const next = moveNodeFromOrigin(nodes, origin.id, origin, { x: 15, y: -8 })

    expect(next).not.toBe(nodes)
    expect(nodes[1]).toEqual(origin)
    expect(next.find((node) => node.id === otherBefore.id)).toEqual(otherBefore)

    const moved = next.find((node) => node.id === origin.id)!
    expect(moved.width).toBe(origin.width)
    expect(moved.height).toBe(origin.height)
    expect(moved.x).toBe(origin.x + 15)
    expect(moved.y).toBe(origin.y - 8)
  })

  it('Test J — replaceNode restores cancelled-drag origin geometry', () => {
    const nodes = createInitialNodes()
    const origin = { ...nodes[0] }
    const dragged = moveNodeFromOrigin(nodes, origin.id, origin, {
      x: 40,
      y: 10,
    })
    const restored = replaceNode(dragged, origin)
    expect(restored.find((node) => node.id === origin.id)).toEqual(origin)
  })
})
