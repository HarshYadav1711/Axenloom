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
  cloneSelection,
  formatZoomPercent,
  hasExceededDragThreshold,
  normalizeRectangle,
  panFromOrigin,
  resizeRect,
  screenToWorld,
  selectIntersectingNodes,
  viewportWorldTransform,
  wheelEventToZoomFactor,
  worldDeltaBetween,
  worldToScreen,
  zoomAtCursor,
  type ResizeHandle,
} from '../geometry'
import type { Point } from '../geometry/point'
import {
  createInitialNodes,
  emptySelection,
  moveNodeFromOrigin,
  replaceNode,
  resizeNodeFromOrigin,
  selectOnly,
} from '../state/document'
import {
  DEFAULT_TOOL,
  DEFAULT_VIEWPORT,
  type CanvasNode,
  type EditorTool,
  type Selection,
  type Viewport,
} from '../types/editor'
import {
  IDLE_INTERACTION,
  type InteractionState,
} from '../types/interaction'
import styles from './CanvasWorkspace.module.css'
import Marquee from './Marquee'
import NodeShape from './NodeShape'
import ResizeHandles from './ResizeHandles'

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

function isNodeOrHandleTarget(target: EventTarget | null): boolean {
  const element = target as Element | null
  return Boolean(
    element?.closest?.('[data-node-id], [data-resize-handle]'),
  )
}

type CanvasWorkspaceProps = {
  tool?: EditorTool
  onInteractionActiveChange?: (active: boolean) => void
}

/**
 * Interactive SVG workspace.
 * Phase 4: Hand/Select modes, marquee selection with live intersection preview.
 *
 * Coordinate assumption: SVG has no viewBox; user units = CSS pixels.
 *
 * Wheel zoom is ignored during node drag, resize, and marquee.
 * Resize handles appear only when exactly one node is selected (internal).
 *
 * Marquee cancel restores `previousSelection`. Successful release commits
 * intersecting IDs (or clears on a background click under threshold).
 */
export default function CanvasWorkspace({
  tool = DEFAULT_TOOL,
  onInteractionActiveChange,
}: CanvasWorkspaceProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const capturedPointerIdRef = useRef<number | null>(null)
  const interactionRef = useRef<InteractionState>(IDLE_INTERACTION)
  const didCenterOriginRef = useRef(false)
  const nodesRef = useRef<CanvasNode[]>([])

  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [nodes, setNodes] = useState<CanvasNode[]>(() => createInitialNodes())
  const [selection, setSelection] = useState<Selection>(() => emptySelection())
  const [interaction, setInteraction] =
    useState<InteractionState>(IDLE_INTERACTION)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

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

  useEffect(() => {
    onInteractionActiveChange?.(interaction.mode !== 'idle')
  }, [interaction.mode, onInteractionActiveChange])

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
    (
      pointerId: number,
      options: { cancelled: boolean; endScreen?: Point },
    ) => {
      const current = interactionRef.current

      if (
        (current.mode === 'nodeDrag' || current.mode === 'nodeResize') &&
        current.pointerId === pointerId
      ) {
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
        return
      }

      if (current.mode === 'marquee' && current.pointerId === pointerId) {
        if (options.cancelled) {
          setSelection(cloneSelection(current.previousSelection))
        } else {
          const endWorld = options.endScreen
            ? screenToWorld(options.endScreen, viewport)
            : current.currentWorld
          const crossed =
            current.hasCrossedThreshold ||
            (options.endScreen
              ? hasExceededDragThreshold(current.startScreen, options.endScreen)
              : false)

          if (!crossed) {
            setSelection(emptySelection())
          } else {
            const marquee = normalizeRectangle(current.startWorld, endWorld)
            setSelection(
              selectIntersectingNodes(nodesRef.current, marquee),
            )
          }
        }
        setInteractionState(IDLE_INTERACTION)
        releaseCapture(pointerId)
      }
    },
    [releaseCapture, setInteractionState, viewport],
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
      const mode = interactionRef.current.mode
      if (
        mode === 'nodeDrag' ||
        mode === 'nodeResize' ||
        mode === 'marquee'
      ) {
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
    if (isNodeOrHandleTarget(event.target)) {
      return
    }

    const svg = event.currentTarget
    const startScreen = readSvgPoint(svg, event.clientX, event.clientY)

    if (tool === 'hand') {
      setSelection(emptySelection())
      setInteractionState({
        mode: 'pan',
        pointerId: event.pointerId,
        startPointer: startScreen,
        originViewport: viewport,
      })
      beginCapture(event.pointerId)
      return
    }

    // Select mode: marquee candidate (do not clear selection until click/commit).
    const startWorld = screenToWorld(startScreen, viewport)
    setInteractionState({
      mode: 'marquee',
      pointerId: event.pointerId,
      startScreen,
      startWorld,
      currentWorld: startWorld,
      previousSelection: cloneSelection(selection),
      hasCrossedThreshold: false,
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

    setSelection(selectOnly(node.id))
    setInteractionState({
      mode: 'nodeDrag',
      pointerId: event.pointerId,
      nodeId: node.id,
      startScreen,
      startWorld,
      originNode: { ...node },
      hasMoved: false,
    })
    beginCapture(event.pointerId)
  }

  const onHandlePointerDown = (
    event: ReactPointerEvent<SVGRectElement>,
    node: CanvasNode,
    handle: ResizeHandle,
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

    setSelection(selectOnly(node.id))
    setInteractionState({
      mode: 'nodeResize',
      pointerId: event.pointerId,
      nodeId: node.id,
      handle,
      startWorld,
      originNode: { ...node },
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
      return
    }

    if (current.mode === 'nodeResize') {
      const currentWorld = screenToWorld(currentScreen, viewport)
      const deltaWorld = worldDeltaBetween(current.startWorld, currentWorld)
      const nextRect = resizeRect(
        current.originNode,
        current.handle,
        deltaWorld,
      )

      setNodes((nodesState) =>
        resizeNodeFromOrigin(
          nodesState,
          current.nodeId,
          current.originNode,
          nextRect,
        ),
      )
      return
    }

    if (current.mode === 'marquee') {
      const currentWorld = screenToWorld(currentScreen, viewport)
      const crossed =
        current.hasCrossedThreshold ||
        hasExceededDragThreshold(current.startScreen, currentScreen)

      updateInteraction((prev) =>
        prev.mode === 'marquee' && prev.pointerId === current.pointerId
          ? {
              ...prev,
              currentWorld,
              hasCrossedThreshold: crossed,
            }
          : prev,
      )
    }
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const endScreen = readSvgPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )
    endGesture(event.pointerId, { cancelled: false, endScreen })
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

    if (current.mode === 'nodeDrag' || current.mode === 'nodeResize') {
      setNodes((nodesState) => replaceNode(nodesState, current.originNode))
    }
    if (current.mode === 'marquee') {
      setSelection(cloneSelection(current.previousSelection))
    }
    setInteractionState(IDLE_INTERACTION)
  }

  const isPanning = interaction.mode === 'pan'
  const isDraggingNode = interaction.mode === 'nodeDrag' && interaction.hasMoved
  const isResizing = interaction.mode === 'nodeResize'
  const isMarquee =
    interaction.mode === 'marquee' && interaction.hasCrossedThreshold
  const draggingNodeId =
    interaction.mode === 'nodeDrag' ? interaction.nodeId : null

  const marqueeRect =
    interaction.mode === 'marquee' && interaction.hasCrossedThreshold
      ? normalizeRectangle(interaction.startWorld, interaction.currentWorld)
      : null

  const previewIds =
    marqueeRect !== null
      ? selectIntersectingNodes(nodes, marqueeRect)
      : null

  const soleSelected =
    previewIds === null && selection.size === 1
      ? nodes.find((node) => selection.has(node.id))
      : undefined

  const worldTransform = viewportWorldTransform(viewport)
  const originScreen = worldToScreen({ x: 0, y: 0 }, viewport)

  const canvasClassName = [
    styles.canvas,
    tool === 'select' ? styles.canvasSelect : '',
    isPanning ? styles.canvasPanning : '',
    isDraggingNode || isResizing ? styles.canvasDraggingNode : '',
    isMarquee ? styles.canvasMarquee : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.root}>
      <svg
        ref={svgRef}
        className={canvasClassName}
        role="application"
        aria-label="Infinite canvas workspace. Use Hand to pan or Select for marquee selection. Scroll to zoom."
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

          {nodes.map((node) => {
            const preview = previewIds?.has(node.id) ?? false
            const selected = previewIds
              ? false
              : selection.has(node.id)
            return (
              <NodeShape
                key={node.id}
                node={node}
                selected={selected}
                preview={preview}
                dragging={draggingNodeId === node.id && isDraggingNode}
                onPointerDown={onNodePointerDown}
              />
            )
          })}

          {marqueeRect ? <Marquee rect={marqueeRect} /> : null}

          {soleSelected ? (
            <ResizeHandles
              node={soleSelected}
              viewportScale={viewport.scale}
              onHandlePointerDown={onHandlePointerDown}
            />
          ) : null}
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
