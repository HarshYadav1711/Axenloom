import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  clientToSvgPoint,
  formatZoomPercent,
  hasExceededDragThreshold,
  panFromOrigin,
  screenToWorld,
  viewportWorldTransform,
  wheelEventToZoomFactor,
  worldDeltaBetween,
  worldToScreen,
  zoomAtCursor,
} from '../geometry'
import type { Point } from '../geometry/point'
import {
  createInitialNodes,
  emptySelection,
  moveNodeFromOrigin,
  replaceNode,
  selectOnly,
} from '../state/document'
import {
  DEFAULT_VIEWPORT,
  type CanvasNode,
  type Selection,
  type Viewport,
} from '../types/editor'
import {
  IDLE_INTERACTION,
  type InteractionState,
} from '../types/interaction'
import styles from './CanvasWorkspace.module.css'
import NodeShape from './NodeShape'

function readSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = svg.getBoundingClientRect()
  return clientToSvgPoint(
    { x: clientX, y: clientY },
    { left: rect.left, top: rect.top },
  )
}

/**
 * Interactive SVG workspace.
 * Phase 2: pan, cursor-centered zoom, node selection, world-space dragging.
 *
 * Coordinate assumption: this SVG has no viewBox; user units match CSS pixels
 * of the element’s bounding client rect.
 *
 * Internal decision: wheel zoom is ignored while a node drag is active so the
 * coordinate frame does not change mid-gesture.
 *
 * Cancellation policy: `pointercancel` / lost capture during an active drag
 * restores the node’s gesture-origin geometry. Normal `pointerup` keeps the
 * latest position.
 */
export default function CanvasWorkspace() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const capturedPointerIdRef = useRef<number | null>(null)
  const interactionRef = useRef<InteractionState>(IDLE_INTERACTION)
  const didCenterOriginRef = useRef(false)

  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [nodes, setNodes] = useState<CanvasNode[]>(() => createInitialNodes())
  const [selection, setSelection] = useState<Selection>(() => emptySelection())
  const [interaction, setInteraction] =
    useState<InteractionState>(IDLE_INTERACTION)

  const setInteractionState = useCallback((next: InteractionState) => {
    interactionRef.current = next
    setInteraction(next)
  }, [])

  const updateInteraction = useCallback(
    (updater: (current: InteractionState) => InteractionState) => {
      setInteraction((current) => {
        const next = updater(current)
        interactionRef.current = next
        return next
      })
    },
    [],
  )

  const releaseCapture = useCallback((pointerId: number) => {
    const svg = svgRef.current
    if (svg?.hasPointerCapture(pointerId)) {
      svg.releasePointerCapture(pointerId)
    }
    if (capturedPointerIdRef.current === pointerId) {
      capturedPointerIdRef.current = null
    }
  }, [])

  const endGesture = useCallback(
    (pointerId: number, options: { cancelled: boolean }) => {
      const current = interactionRef.current

      if (current.mode === 'nodeDrag' && current.pointerId === pointerId) {
        if (options.cancelled) {
          setNodes((nodesState) => replaceNode(nodesState, current.originNode))
        }
        setInteractionState(IDLE_INTERACTION)
        releaseCapture(pointerId)
        return
      }

      if (current.mode === 'pan' && current.pointerId === pointerId) {
        setInteractionState(IDLE_INTERACTION)
        releaseCapture(pointerId)
      }
    },
    [releaseCapture, setInteractionState],
  )

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || didCenterOriginRef.current) {
      return
    }

    const { width, height } = svg.getBoundingClientRect()
    if (width <= 0 || height <= 0) {
      return
    }

    // One-shot centering only — never re-run on node/selection updates.
    didCenterOriginRef.current = true
    setViewport({
      x: width / 2,
      y: height / 2,
      scale: 1,
    })
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      // Ignore zoom while dragging a node (internal Phase 2 policy).
      if (interactionRef.current.mode === 'nodeDrag') {
        return
      }
      const cursor = readSvgPoint(svg, event.clientX, event.clientY)
      const factor = wheelEventToZoomFactor(event.deltaY, event.deltaMode)
      setViewport((current) => zoomAtCursor(current, cursor, factor))
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      svg.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    return () => {
      const pointerId = capturedPointerIdRef.current
      if (pointerId !== null && svg?.hasPointerCapture(pointerId)) {
        svg.releasePointerCapture(pointerId)
      }
      capturedPointerIdRef.current = null
    }
  }, [])

  const beginCapture = (pointerId: number) => {
    const svg = svgRef.current
    if (!svg) {
      return
    }
    capturedPointerIdRef.current = pointerId
    svg.setPointerCapture(pointerId)
  }

  const onBackgroundPointerDown = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    if (event.button !== 0) {
      return
    }
    if (interaction.mode !== 'idle') {
      return
    }
    // Node handlers stop propagation; this path is empty workspace only.
    if (event.target !== event.currentTarget) {
      const target = event.target as Element | null
      if (target?.closest?.('[data-node-id]')) {
        return
      }
    }

    const svg = event.currentTarget
    const startPointer = readSvgPoint(svg, event.clientX, event.clientY)

    setSelection(emptySelection())
    setInteractionState({
      mode: 'pan',
      pointerId: event.pointerId,
      startPointer,
      originViewport: viewport,
    })
    beginCapture(event.pointerId)
  }

  const onNodePointerDown = (
    event: ReactPointerEvent<SVGRectElement>,
    node: CanvasNode,
  ) => {
    if (event.button !== 0) {
      return
    }
    if (interaction.mode !== 'idle') {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    const svg = svgRef.current
    if (!svg) {
      return
    }

    const startScreen = readSvgPoint(svg, event.clientX, event.clientY)
    const startWorld = screenToWorld(startScreen, viewport)
    const originNode = { ...node }

    setSelection(selectOnly(node.id))
    setInteractionState({
      mode: 'nodeDrag',
      pointerId: event.pointerId,
      nodeId: node.id,
      startScreen,
      startWorld,
      originNode,
      hasMoved: false,
    })
    beginCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = interaction
    if (current.mode === 'idle') {
      return
    }
    if (event.pointerId !== current.pointerId) {
      return
    }

    const svg = event.currentTarget
    const currentScreen = readSvgPoint(svg, event.clientX, event.clientY)

    if (current.mode === 'pan') {
      setViewport(
        panFromOrigin(
          current.originViewport,
          current.startPointer,
          currentScreen,
        ),
      )
      return
    }

    if (current.mode === 'nodeDrag') {
      const crossed =
        current.hasMoved ||
        hasExceededDragThreshold(current.startScreen, currentScreen)

      if (!crossed) {
        return
      }

      const currentWorld = screenToWorld(currentScreen, viewport)
      const deltaWorld = worldDeltaBetween(current.startWorld, currentWorld)

      setNodes((nodesState) =>
        moveNodeFromOrigin(
          nodesState,
          current.nodeId,
          current.originNode,
          deltaWorld,
        ),
      )

      if (!current.hasMoved) {
        updateInteraction((prev) =>
          prev.mode === 'nodeDrag' && prev.pointerId === current.pointerId
            ? { ...prev, hasMoved: true }
            : prev,
        )
      }
    }
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    endGesture(event.pointerId, { cancelled: false })
  }

  const onPointerCancel = (event: ReactPointerEvent<SVGSVGElement>) => {
    endGesture(event.pointerId, { cancelled: true })
  }

  const onLostPointerCapture = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    if (capturedPointerIdRef.current === event.pointerId) {
      capturedPointerIdRef.current = null
    }

    const current = interactionRef.current
    if (current.mode === 'idle' || current.pointerId !== event.pointerId) {
      return
    }

    // Treat unexpected capture loss as cancellation for in-flight node drags.
    if (current.mode === 'nodeDrag') {
      setNodes((nodesState) => replaceNode(nodesState, current.originNode))
    }
    setInteractionState(IDLE_INTERACTION)
  }

  const isPanning = interaction.mode === 'pan'
  const isDraggingNode = interaction.mode === 'nodeDrag' && interaction.hasMoved
  const draggingNodeId =
    interaction.mode === 'nodeDrag' ? interaction.nodeId : null
  const worldTransform = viewportWorldTransform(viewport)
  const originScreen = worldToScreen({ x: 0, y: 0 }, viewport)

  const canvasClassName = [
    styles.canvas,
    isPanning ? styles.canvasPanning : '',
    isDraggingNode ? styles.canvasDraggingNode : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.root}>
      <svg
        ref={svgRef}
        className={canvasClassName}
        role="application"
        aria-label="Infinite canvas workspace. Drag background to pan, scroll to zoom, drag nodes to move."
        tabIndex={0}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
      >
        <defs>
          <pattern
            id="axenloom-world-dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform={worldTransform}
          >
            <circle className={styles.gridDot} cx="1" cy="1" r="1" />
          </pattern>
        </defs>

        {/* Full-bleed hit target for background pan / deselect. */}
        <rect
          width="100%"
          height="100%"
          fill="var(--workspace-bg)"
          data-workspace-background="true"
        />
        <rect
          width="100%"
          height="100%"
          fill="url(#axenloom-world-dots)"
          pointerEvents="none"
        />

        <g transform={worldTransform}>
          <line
            className={styles.originArm}
            x1={-28}
            y1={0}
            x2={28}
            y2={0}
            pointerEvents="none"
          />
          <line
            className={styles.originArm}
            x1={0}
            y1={-28}
            x2={0}
            y2={28}
            pointerEvents="none"
          />
          <circle
            className={styles.originCore}
            cx={0}
            cy={0}
            r={3}
            pointerEvents="none"
          />

          {nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              selected={selection.has(node.id)}
              dragging={draggingNodeId === node.id && isDraggingNode}
              onPointerDown={onNodePointerDown}
            />
          ))}
        </g>

        <text
          className={styles.originLabel}
          x={originScreen.x + 8}
          y={originScreen.y - 8}
          pointerEvents="none"
        >
          (0,0)
        </text>
      </svg>

      <p className={styles.hud} aria-live="polite">
        {formatZoomPercent(viewport.scale)}
      </p>
    </div>
  )
}
