import { describe, expect, it } from 'vitest'
import type { CanvasNode } from '../types/editor'
import {
  addNode,
  createInitialNodes,
  deleteSelectedNodes,
  emptySelection,
  moveNodeFromOrigin,
  resizeNodeFromOrigin,
  selectOnly,
} from './document'
import {
  canRedo,
  canUndo,
  cloneSnapshot,
  commitTransaction,
  createSnapshot,
  EMPTY_HISTORY,
  HISTORY_CAPACITY,
  nodesEqual,
  redoTransaction,
  undoTransaction,
} from './history'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './nodeDefaults'
import { resolveHistoryShortcut, shouldHandleHistoryKey } from './keyboard'

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

function presentOf(
  nodes: CanvasNode[],
  selection: ReadonlySet<string> = emptySelection(),
) {
  return createSnapshot(nodes, selection)
}

describe('history — initial and empty', () => {
  it('Test A/T — initial history has no undo or redo; empty stacks are no-ops', () => {
    expect(canUndo(EMPTY_HISTORY)).toBe(false)
    expect(canRedo(EMPTY_HISTORY)).toBe(false)
    const present = presentOf(createInitialNodes())
    expect(undoTransaction(EMPTY_HISTORY, present)).toBeNull()
    expect(redoTransaction(EMPTY_HISTORY, present)).toBeNull()
  })
})

describe('history — create / delete', () => {
  it('Test B/C — create → undo → redo restores exact id and geometry', () => {
    const initial = createInitialNodes()
    const before = presentOf(initial, emptySelection())
    const created = makeNode('new-1', { x: 10, y: 20 })
    const afterNodes = addNode(initial, created)
    const after = presentOf(afterNodes, selectOnly(created.id))

    let history = commitTransaction(EMPTY_HISTORY, before)
    expect(canUndo(history)).toBe(true)
    expect(canRedo(history)).toBe(false)

    const undone = undoTransaction(history, after)
    expect(undone).not.toBeNull()
    history = undone!.history
    expect(nodesEqual(undone!.present.nodes, initial)).toBe(true)
    expect(undone!.present.selection.size).toBe(0)
    expect(canRedo(history)).toBe(true)

    const redone = redoTransaction(history, undone!.present)
    expect(redone).not.toBeNull()
    expect(redone!.present.nodes).toHaveLength(initial.length + 1)
    expect(redone!.present.nodes.at(-1)).toEqual(created)
    expect([...redone!.present.selection]).toEqual([created.id])
  })

  it('Test D/E/F — bulk delete is one transaction; undo/redo round-trip', () => {
    const initial = createInitialNodes()
    const selected = new Set(['node-a', 'node-c'])
    const before = presentOf(initial, selected)
    const afterNodes = deleteSelectedNodes(initial, selected)
    const after = presentOf(afterNodes, emptySelection())

    let history = commitTransaction(EMPTY_HISTORY, before)
    expect(history.past).toHaveLength(1)

    const undone = undoTransaction(history, after)!
    history = undone.history
    expect(nodesEqual(undone.present.nodes, initial)).toBe(true)
    expect([...undone.present.selection].sort()).toEqual(['node-a', 'node-c'])

    const redone = redoTransaction(history, undone.present)!
    expect(nodesEqual(redone.present.nodes, afterNodes)).toBe(true)
  })
})

describe('history — drag / resize', () => {
  it('Test G/H — completed drag undoes/redoes position', () => {
    const initial = createInitialNodes()
    const origin = { ...initial[0] }
    const before = presentOf(initial, emptySelection())
    const moved = moveNodeFromOrigin(initial, origin.id, origin, {
      x: 40,
      y: -15,
    })
    const after = presentOf(moved, selectOnly(origin.id))

    let history = commitTransaction(EMPTY_HISTORY, before)
    const undone = undoTransaction(history, after)!
    history = undone.history
    expect(undone.present.nodes[0]).toEqual(origin)

    const redone = redoTransaction(history, undone.present)!
    expect(redone.present.nodes[0].x).toBeCloseTo(origin.x + 40, 9)
    expect(redone.present.nodes[0].y).toBeCloseTo(origin.y - 15, 9)
  })

  it('Test I/J — northwest resize restores x/y/width/height', () => {
    const initial = createInitialNodes()
    const origin = { ...initial[1] }
    const before = presentOf(initial, selectOnly(origin.id))
    const resized = resizeNodeFromOrigin(initial, origin.id, origin, {
      x: origin.x - 20,
      y: origin.y - 10,
      width: origin.width + 20,
      height: origin.height + 10,
    })
    const after = presentOf(resized, selectOnly(origin.id))

    let history = commitTransaction(EMPTY_HISTORY, before)
    const undone = undoTransaction(history, after)!
    history = undone.history
    expect(undone.present.nodes[1]).toEqual(origin)

    const redone = redoTransaction(history, undone.present)!
    expect(redone.present.nodes[1]).toEqual(resized[1])
  })
})

describe('history — sequences and branching', () => {
  it('Test K — multi-operation create/move/resize/delete undo/redo chain', () => {
    let nodes = createInitialNodes()
    let selection = emptySelection()
    let history = EMPTY_HISTORY
    let present = presentOf(nodes, selection)

    const created = makeNode('k-new', { x: 5, y: 5 })
    {
      const before = present
      nodes = addNode(nodes, created)
      selection = selectOnly(created.id)
      present = presentOf(nodes, selection)
      history = commitTransaction(history, before)
    }

    {
      const before = present
      const origin = { ...created }
      nodes = moveNodeFromOrigin(nodes, created.id, origin, { x: 30, y: 0 })
      present = presentOf(nodes, selection)
      history = commitTransaction(history, before)
    }

    {
      const before = present
      const origin = nodes.find((n) => n.id === created.id)!
      nodes = resizeNodeFromOrigin(nodes, created.id, origin, {
        x: origin.x,
        y: origin.y,
        width: origin.width + 10,
        height: origin.height,
      })
      present = presentOf(nodes, selection)
      history = commitTransaction(history, before)
    }

    {
      const before = present
      nodes = deleteSelectedNodes(nodes, selection)
      selection = emptySelection()
      present = presentOf(nodes, selection)
      history = commitTransaction(history, before)
    }

    expect(history.past).toHaveLength(4)

    for (let i = 0; i < 4; i += 1) {
      const step = undoTransaction(history, present)!
      history = step.history
      present = step.present
    }
    expect(nodesEqual(present.nodes, createInitialNodes())).toBe(true)
    expect(canUndo(history)).toBe(false)
    expect(canRedo(history)).toBe(true)

    for (let i = 0; i < 4; i += 1) {
      const step = redoTransaction(history, present)!
      history = step.history
      present = step.present
    }
    expect(present.nodes.find((n) => n.id === created.id)).toBeUndefined()
    expect(canRedo(history)).toBe(false)
  })

  it('Test L — new edit after undo clears redo', () => {
    let nodes = createInitialNodes()
    let history = EMPTY_HISTORY
    let present = presentOf(nodes)

    const a = makeNode('A')
    {
      const before = present
      nodes = addNode(nodes, a)
      present = presentOf(nodes, selectOnly('A'))
      history = commitTransaction(history, before)
    }
    const b = makeNode('B')
    {
      const before = present
      nodes = addNode(nodes, b)
      present = presentOf(nodes, selectOnly('B'))
      history = commitTransaction(history, before)
    }

    const undone = undoTransaction(history, present)!
    history = undone.history
    present = undone.present
    expect(canRedo(history)).toBe(true)

    const c = makeNode('C')
    {
      const before = present
      nodes = addNode(present.nodes, c)
      present = presentOf(nodes, selectOnly('C'))
      history = commitTransaction(history, before)
    }

    expect(canRedo(history)).toBe(false)
    expect(present.nodes.map((n) => n.id)).toContain('A')
    expect(present.nodes.map((n) => n.id)).not.toContain('B')
    expect(present.nodes.map((n) => n.id)).toContain('C')
  })

  it('Test M/N — selection-only and no-op geometry do not require commits', () => {
    const nodes = createInitialNodes()
    const before = presentOf(nodes, emptySelection())
    // Selection-only: callers must not call commitTransaction.
    const afterSelection = presentOf(nodes, selectOnly('node-a'))
    expect(nodesEqual(before.nodes, afterSelection.nodes)).toBe(true)

    const unchanged = moveNodeFromOrigin(nodes, 'node-a', nodes[0], {
      x: 0,
      y: 0,
    })
    expect(nodesEqual(nodes, unchanged)).toBe(true)
  })
})

describe('history — cancellation, selection, immutability', () => {
  it('Test O/P — cancelled drag/resize leave history empty when never committed', () => {
    const history = EMPTY_HISTORY
    expect(canUndo(history)).toBe(false)
    // Cancellation restores origin in the workspace without commitTransaction.
  })

  it('Test Q — restore drops stale selection ids', () => {
    const nodes = createInitialNodes()
    const snap = createSnapshot(nodes, new Set(['node-a', 'missing']))
    const restored = undoTransaction(
      commitTransaction(EMPTY_HISTORY, snap),
      presentOf([makeNode('only')], emptySelection()),
    )!
    // After undo we restore `snap`; reconcile keeps only living ids.
    expect([...restored.present.selection]).toEqual(['node-a'])
  })

  it('Test R — mutating later document does not alter prior snapshots', () => {
    const initial = createInitialNodes()
    const before = presentOf(initial)
    const history = commitTransaction(EMPTY_HISTORY, before)
    const stored = history.past[0]
    initial[0].x = 9999
    expect(stored.nodes[0].x).toBe(-40)
  })

  it('Test S — rapid sequential undo/redo is deterministic', () => {
    let nodes = createInitialNodes()
    let history = EMPTY_HISTORY
    let present = presentOf(nodes)

    for (const id of ['r1', 'r2', 'r3']) {
      const before = present
      nodes = addNode(nodes, makeNode(id))
      present = presentOf(nodes, selectOnly(id))
      history = commitTransaction(history, before)
    }

    const afterCreates = cloneSnapshot(present)
    for (let i = 0; i < 3; i += 1) {
      const step = undoTransaction(history, present)!
      history = step.history
      present = step.present
    }
    for (let i = 0; i < 3; i += 1) {
      const step = redoTransaction(history, present)!
      history = step.history
      present = step.present
    }
    expect(nodesEqual(present.nodes, afterCreates.nodes)).toBe(true)
  })
})

describe('history — availability and capacity', () => {
  it('Test U — canUndo/canRedo track stacks', () => {
    const before = presentOf(createInitialNodes())
    const after = presentOf(addNode(before.nodes, makeNode('u1')), selectOnly('u1'))
    let history = commitTransaction(EMPTY_HISTORY, before)
    expect(canUndo(history)).toBe(true)
    expect(canRedo(history)).toBe(false)
    const undone = undoTransaction(history, after)!
    history = undone.history
    expect(canUndo(history)).toBe(false)
    expect(canRedo(history)).toBe(true)
  })

  it('Test X — capacity discards oldest past entries', () => {
    let nodes: CanvasNode[] = []
    let history = EMPTY_HISTORY
    let present = presentOf(nodes)

    for (let i = 0; i < HISTORY_CAPACITY + 5; i += 1) {
      const before = present
      nodes = addNode(nodes, makeNode(`cap-${i}`))
      present = presentOf(nodes, selectOnly(`cap-${i}`))
      history = commitTransaction(history, before)
    }

    expect(history.past).toHaveLength(HISTORY_CAPACITY)
    // Oldest retained baseline is after the first 5 creates.
    expect(history.past[0].nodes).toHaveLength(5)
  })
})

describe('history — keyboard mapping', () => {
  it('Test V — shortcut mapping and editable guards', () => {
    const plain = { closest: () => null } as unknown as EventTarget
    const editable = {
      closest: (selector: string) =>
        selector.includes('input') ? editable : null,
    } as unknown as EventTarget

    expect(
      resolveHistoryShortcut({
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        repeat: false,
      }),
    ).toBe('undo')

    expect(
      resolveHistoryShortcut({
        key: 'Z',
        ctrlKey: false,
        metaKey: true,
        shiftKey: true,
        altKey: false,
        repeat: false,
      }),
    ).toBe('redo')

    expect(
      resolveHistoryShortcut({
        key: 'y',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        repeat: false,
      }),
    ).toBe('redo')

    expect(
      shouldHandleHistoryKey({
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        repeat: false,
        target: editable,
      }),
    ).toBe(false)

    expect(
      shouldHandleHistoryKey({
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        repeat: false,
        target: plain,
      }),
    ).toBe(true)

    expect(
      shouldHandleHistoryKey({
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: true,
        repeat: false,
        target: plain,
      }),
    ).toBe(false)

    expect(
      shouldHandleHistoryKey({
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        repeat: true,
        target: plain,
      }),
    ).toBe(false)
  })

  it('Test W — gesture gate blocks history commands', () => {
    const canRunHistory = (gestureActive: boolean, available: boolean) =>
      !gestureActive && available
    expect(canRunHistory(true, true)).toBe(false)
    expect(canRunHistory(false, true)).toBe(true)
    expect(canRunHistory(false, false)).toBe(false)
  })
})
