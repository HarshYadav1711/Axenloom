import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasNode } from '../types/editor'
import styles from './NodeShape.module.css'

type NodeShapeProps = {
  node: CanvasNode
  selected: boolean
  /** Live marquee intersection highlight (distinct from committed selection). */
  preview: boolean
  dragging: boolean
  onPointerDown: (
    event: ReactPointerEvent<SVGRectElement>,
    node: CanvasNode,
  ) => void
}

/**
 * World-space rectangle node. Geometry props are world units;
 * the parent viewport group supplies the screen transform.
 */
export default function NodeShape({
  node,
  selected,
  preview,
  dragging,
  onPointerDown,
}: NodeShapeProps) {
  const className = [
    styles.node,
    preview ? styles.nodePreview : selected ? styles.nodeSelected : '',
    dragging ? styles.nodeDragging : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <rect
      className={className}
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      rx={4}
      ry={4}
      data-node-id={node.id}
      aria-label={`Canvas node ${node.id}`}
      onPointerDown={(event) => onPointerDown(event, node)}
    />
  )
}
