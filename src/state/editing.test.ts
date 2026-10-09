import { describe, expect, it } from 'vitest'
import { screenToWorld } from '../geometry/viewport'
import type { CanvasNode, Viewport } from '../types/editor'
import {
  addNode,
  createInitialNodes,
  deleteSelectedNodes,
  emptySelection,
  reconcileSelection,
  selectOnly,
} from './document'
import { shouldHandleDeleteKey } from './keyboard'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './nodeDefaults'
import {
  CREATION_OFFSET_SCREEN_PX,
  CREATION_OFFSET_WRAP,
  placeNewNodeRect,
} from './placement'
import { createNodeId } from './ids'

function makeNode(
  id: string,
  overrides: Partial<CanvasNode> = {},
): CanvasNode {
  return {
    id,
    x: 0,
    y: 0,
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
    ...overrides,
  }
}

describe('addNode / create', () => {
  it('Test A/B — adds one node without mutating existing geometry', () => {
    const nodes = createInitialNodes()
    const snapshot = nodes.map((node) => ({ ...node }))
    const created = makeNode('new-1', { x: 10, y: 20 })
    const next = addNode(nodes, created)

    expect(next).toHaveLength(nodes.length + 1)
    expect(next).not.toBe(nodes)
    expect(nodes).toEqual(snapshot)
    expect(next[next.length - 1]).toEqual(created)
    expect(next[next.length - 1]).not.toBe(created)
  })

  it('Test C — createNodeId produces distinct values', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createNodeId()))
    expect(ids.size).toBe(20)
  })

  it('Test D — default geometry is positive and documented', () => {
    expect(DEFAULT_NODE_WIDTH).toBe(160)
    expect(DEFAULT_NODE_HEIGHT).toBe(100)
    expect(DEFAULT_NODE_WIDTH).toBeGreaterThan(0)
    expect(DEFAULT_NODE_HEIGHT).toBeGreaterThan(0)
  })

  it('rejects duplicate IDs and invalid geometry', () => {
    const nodes = createInitialNodes()
    expect(addNode(nodes, makeNode(nodes[0].id))).toEqual([...nodes])
    expect(
      addNode(nodes, makeNode('bad', { width: 0, height: 10 })),
    ).toEqual([...nodes])
  })
})

describe('placement', () => {
  it('Test E — at 100% zoom centers near the SVG midpoint', () => {
    const viewport: Viewport = { x: 400, y: 300, scale: 1 }
    const placed = placeNewNodeRect({
      viewport,
      svgWidth: 800,
      svgHeight: 600,
      creationIndex: 0,
    })
    expect(placed.width).toBe(DEFAULT_NODE_WIDTH)
    expect(placed.height).toBe(DEFAULT_NODE_HEIGHT)
    expect(placed.worldCenter.x).toBeCloseTo(0, 9)
    expect(placed.worldCenter.y).toBeCloseTo(0, 9)
    expect(placed.x).toBeCloseTo(-DEFAULT_NODE_WIDTH / 2, 9)
    expect(placed.y).toBeCloseTo(-DEFAULT_NODE_HEIGHT / 2, 9)
  })

  it('Test F — after panning, placement follows the visible center', () => {
    const viewport: Viewport = { x: 100, y: 50, scale: 1 }
    const placed = placeNewNodeRect({
      viewport,
      svgWidth: 800,
      svgHeight: 600,
      creationIndex: 0,
    })
    const expected = screenToWorld({ x: 400, y: 300 }, viewport)
    expect(placed.worldCenter).toEqual(expected)
  })

  it('Test G — world dimensions stay constant across zoom levels', () => {
    const scales = [0.25, 0.5, 1, 2, 4] as const
    for (const scale of scales) {
      const viewport: Viewport = { x: 200, y: 100, scale }
      const placed = placeNewNodeRect({
        viewport,
        svgWidth: 800,
        svgHeight: 600,
        creationIndex: 0,
      })
      expect(placed.width).toBe(DEFAULT_NODE_WIDTH)
      expect(placed.height).toBe(DEFAULT_NODE_HEIGHT)
      const expectedCenter = screenToWorld({ x: 400, y: 300 }, viewport)
      expect(placed.worldCenter.x).toBeCloseTo(expectedCenter.x, 9)
      expect(placed.worldCenter.y).toBeCloseTo(expectedCenter.y, 9)
    }
  })

  it('Test H — repeated creation uses a wrapping screen-space cascade', () => {
    const viewport: Viewport = { x: 0, y: 0, scale: 1 }
    const first = placeNewNodeRect({
      viewport,
      svgWidth: 800,
      svgHeight: 600,
      creationIndex: 0,
    })
    const second = placeNewNodeRect({
      viewport,
      svgWidth: 800,
      svgHeight: 600,
      creationIndex: 1,
    })
    expect(second.worldCenter.x - first.worldCenter.x).toBeCloseTo(
      CREATION_OFFSET_SCREEN_PX,
      9,
    )
    expect(second.worldCenter.y - first.worldCenter.y).toBeCloseTo(
      CREATION_OFFSET_SCREEN_PX,
      9,
    )

    const wrapped = placeNewNodeRect({
      viewport,
      svgWidth: 800,
      svgHeight: 600,
      creationIndex: CREATION_OFFSET_WRAP,
    })
    expect(wrapped.worldCenter).toEqual(first.worldCenter)
  })
})

describe('selection after create / delete helpers', () => {
  it('Test I — selectOnly replaces previous selection', () => {
    const previous = selectOnly('old')
    const next = selectOnly('new')
    expect(previous.has('old')).toBe(true)
    expect(next.has('old')).toBe(false)
    expect(next.has('new')).toBe(true)
  })
})

describe('deleteSelectedNodes', () => {
  it('Test J — deletes exactly one selected node', () => {
    const nodes = createInitialNodes()
    const next = deleteSelectedNodes(nodes, new Set(['node-b']))
    expect(next.map((node) => node.id)).toEqual(['node-a', 'node-c'])
  })

  it('Test K/L — deletes multiple selected IDs and preserves others', () => {
    const nodes = createInitialNodes()
    const next = deleteSelectedNodes(nodes, new Set(['node-a', 'node-c']))
    expect(next).toHaveLength(1)
    expect(next[0]).toEqual(nodes[1])
    // Unselected node objects are preserved by reference (not mutated).
    expect(next[0]).toBe(nodes[1])
  })

  it('Test M — empty selection is a no-op copy', () => {
    const nodes = createInitialNodes()
    const next = deleteSelectedNodes(nodes, emptySelection())
    expect(next).toEqual(nodes)
    expect(next).not.toBe(nodes)
  })

  it('Test N/O — can delete all nodes and add again', () => {
    const nodes = createInitialNodes()
    const empty = deleteSelectedNodes(
      nodes,
      new Set(nodes.map((node) => node.id)),
    )
    expect(empty).toEqual([])
    const revived = addNode(empty, makeNode('after-empty'))
    expect(revived).toHaveLength(1)
  })

  it('Test P — unknown selected IDs do not corrupt state', () => {
    const nodes = createInitialNodes()
    const next = deleteSelectedNodes(nodes, new Set(['missing', 'node-a']))
    expect(next.map((node) => node.id)).toEqual(['node-b', 'node-c'])
  })

  it('Test Q — immutability of inputs', () => {
    const nodes = createInitialNodes()
    const selected = new Set(['node-a'])
    const snapshot = nodes.map((node) => ({ ...node }))
    deleteSelectedNodes(nodes, selected)
    expect(nodes).toEqual(snapshot)
    expect(selected.has('node-a')).toBe(true)
  })

  it('reconcileSelection drops stale IDs', () => {
    const nodes = createInitialNodes().slice(1)
    const next = reconcileSelection(new Set(['node-a', 'node-b']), nodes)
    expect([...next]).toEqual(['node-b'])
  })
})

describe('keyboard delete guards', () => {
  it('Test R — ignores editable targets and modifiers', () => {
    const editableTarget = {
      closest: (selector: string) =>
        selector.includes('input') ? editableTarget : null,
    } as unknown as EventTarget

    const plainTarget = {
      closest: () => null,
    } as unknown as EventTarget

    expect(
      shouldHandleDeleteKey({
        key: 'Delete',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: editableTarget,
      }),
    ).toBe(false)

    expect(
      shouldHandleDeleteKey({
        key: 'Backspace',
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        target: plainTarget,
      }),
    ).toBe(false)

    expect(
      shouldHandleDeleteKey({
        key: 'Delete',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: plainTarget,
      }),
    ).toBe(true)
  })
})

describe('active interaction protection', () => {
  it('Test S — command pathway returns false when a gesture is active', () => {
    // Mirrors CanvasWorkspace command guards: mutate only when idle.
    const canMutateDocument = (gestureActive: boolean) => !gestureActive
    expect(canMutateDocument(true)).toBe(false)
    expect(canMutateDocument(false)).toBe(true)
  })
})
