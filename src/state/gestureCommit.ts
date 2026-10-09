import type { CanvasNode } from '../types/editor'
import { replaceNode } from './document'
import { nodeGeometryEqual } from './history'

/**
 * Finalize a completed node drag/resize against the gesture origin.
 *
 * If the final geometry is within epsilon of the origin, restore the exact
 * origin node so a history no-op cannot leave an unrecorded micro-edit.
 */
export function resolveCompletedNodeEdit(input: {
  nodes: readonly CanvasNode[]
  originNode: CanvasNode
  finalNode: CanvasNode | undefined
}): { nodes: CanvasNode[]; shouldCommitHistory: boolean } {
  const { originNode, finalNode } = input
  if (!finalNode || finalNode.id !== originNode.id) {
    return {
      nodes: [...input.nodes],
      shouldCommitHistory: false,
    }
  }

  if (nodeGeometryEqual(finalNode, originNode)) {
    return {
      nodes: replaceNode(input.nodes, originNode),
      shouldCommitHistory: false,
    }
  }

  return {
    nodes: [...input.nodes],
    shouldCommitHistory: true,
  }
}
