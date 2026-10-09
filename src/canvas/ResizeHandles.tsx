import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  clampedHandleWorldSize,
  cornerWorldPosition,
  resizeCursor,
  type ResizeHandle,
} from '../geometry/resize'
import type { CanvasNode } from '../types/editor'
import styles from './ResizeHandles.module.css'

const HANDLES: readonly ResizeHandle[] = ['nw', 'ne', 'sw', 'se']

type ResizeHandlesProps = {
  node: CanvasNode
  viewportScale: number
  onHandlePointerDown: (
    event: ReactPointerEvent<SVGRectElement>,
    node: CanvasNode,
    handle: ResizeHandle,
  ) => void
}

/**
 * Corner resize affordances for a selected node.
 * Handle size is compensated by viewport scale so CSS-pixel size stays ~constant.
 */
export default function ResizeHandles({
  node,
  viewportScale,
  onHandlePointerDown,
}: ResizeHandlesProps) {
  const size = clampedHandleWorldSize(node, viewportScale)
  const half = size / 2

  return (
    <g data-resize-handles={node.id} aria-hidden="true">
      {HANDLES.map((handle) => {
        const corner = cornerWorldPosition(node, handle)
        return (
          <rect
            key={handle}
            className={styles.handle}
            data-resize-handle={handle}
            data-node-id={node.id}
            x={corner.x - half}
            y={corner.y - half}
            width={size}
            height={size}
            style={{ cursor: resizeCursor(handle) }}
            onPointerDown={(event) =>
              onHandlePointerDown(event, node, handle)
            }
          />
        )
      })}
    </g>
  )
}
