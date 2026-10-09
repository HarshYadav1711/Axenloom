import { describe, expect, it } from 'vitest'
import type { CanvasNode } from '../types/editor'
import { createInitialNodes } from './document'
import { resolveCompletedNodeEdit } from './gestureCommit'
import { GEOMETRY_EPSILON } from './history'

function node(
  id: string,
  overrides: Partial<CanvasNode> = {},
): CanvasNode {
  return {
    id,
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    ...overrides,
  }
}

describe('resolveCompletedNodeEdit', () => {
  it('commits when geometry changes above epsilon', () => {
    const origin = node('a', { x: 10, y: 20 })
    const finalNode = { ...origin, x: 40, y: 20 }
    const result = resolveCompletedNodeEdit({
      nodes: [finalNode, node('b')],
      originNode: origin,
      finalNode,
    })
    expect(result.shouldCommitHistory).toBe(true)
    expect(result.nodes[0].x).toBe(40)
  })

  it('restores origin and skips history for sub-epsilon deltas', () => {
    const nodes = createInitialNodes()
    const origin = { ...nodes[0] }
    const tiny = {
      ...origin,
      x: origin.x + GEOMETRY_EPSILON / 10,
      y: origin.y - GEOMETRY_EPSILON / 10,
    }
    const dirty = nodes.map((n) => (n.id === origin.id ? tiny : n))
    const result = resolveCompletedNodeEdit({
      nodes: dirty,
      originNode: origin,
      finalNode: tiny,
    })
    expect(result.shouldCommitHistory).toBe(false)
    expect(result.nodes[0]).toEqual(origin)
    expect(result.nodes[0].x).not.toBe(tiny.x)
  })

  it('exact origin match is a no-op without history', () => {
    const origin = node('n', { x: 5, y: 6, width: 40, height: 40 })
    const result = resolveCompletedNodeEdit({
      nodes: [origin],
      originNode: origin,
      finalNode: { ...origin },
    })
    expect(result.shouldCommitHistory).toBe(false)
    expect(result.nodes[0]).toEqual(origin)
  })

  it('missing final node does not commit', () => {
    const origin = node('gone')
    const result = resolveCompletedNodeEdit({
      nodes: [node('other')],
      originNode: origin,
      finalNode: undefined,
    })
    expect(result.shouldCommitHistory).toBe(false)
  })
})
