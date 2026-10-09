import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
  addNode,
  createInitialNodes,
  deleteSelectedNodes,
  emptySelection,
  findNode,
  moveNodeFromOrigin,
  reconcileSelection,
  replaceNode,
  resizeNodeFromOrigin,
  selectOnly,
} from '../state/document'
import { resolveCompletedNodeEdit } from '../state/gestureCommit'
import {
  canRedo,
  canUndo,
  commitTransaction,
  createSnapshot,
  EMPTY_HISTORY,
  nodesEqual,
  redoTransaction,
  undoTransaction,
  type DocumentSnapshot,
  type HistoryStacks,
} from '../state/history'
import { createNodeId } from '../state/ids'
import {
  resolveHistoryShortcut,
  shouldHandleDeleteKey,
  shouldHandleHistoryKey,
} from '../state/keyboard'
import { placeNewNodeRect } from '../state/placement'
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

export type CanvasEditorHandle = {
  /** Returns false when blocked (active gesture). */
  addRectangle: () => boolean
  /** Returns false when blocked or selection empty. */
  deleteSelection: () => boolean
  /** Returns false when blocked or past is empty. */
  undo: () => boolean
  /** Returns false when blocked or future is empty. */
  redo: () => boolean
}

export type HistoryAvailability = {
  canUndo: boolean
  canRedo: boolean
}

type CanvasWorkspaceProps = {
  tool?: EditorTool
  onInteractionActiveChange?: (active: boolean) => void
  onSelectionChange?: (count: number) => void
  onHistoryChange?: (availability: HistoryAvailability) => void
}

/**
 * Interactive SVG workspace.
 * Phase 6: snapshot undo/redo for create, delete, drag, and resize.
 *
 * Coordinate assumption: SVG has no viewBox; user units = CSS pixels.
 *
 * Document history is action-boundary only. Viewport, tool mode, marquee,
 * and selection-only actions are excluded from history stacks.
 */
const CanvasWorkspace = forwardRef<CanvasEditorHandle, CanvasWorkspaceProps>(
  function CanvasWorkspace(
    {
      tool = DEFAULT_TOOL,
      onInteractionActiveChange,
      onSelectionChange,
      onHistoryChange,
    },
    ref,
  ) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const capturedPointerIdRef = useRef<number | null>(null)
  const interactionRef = useRef<InteractionState>(IDLE_INTERACTION)
  const didCenterOriginRef = useRef(false)
  const nodesRef = useRef<CanvasNode[]>([])
  const selectionRef = useRef<Selection>(emptySelection())
  const viewportRef = useRef<Viewport>(DEFAULT_VIEWPORT)
  const historyRef = useRef<HistoryStacks>(EMPTY_HISTORY)
  const gestureBaselineRef = useRef<DocumentSnapshot | null>(null)
  /** Set while endGesture runs so lostpointercapture does not cancel a commit. */
  const closingPointerIdRef = useRef<number | null>(null)
  const creationIndexRef = useRef(0)

  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [nodes, setNodes] = useState<CanvasNode[]>(() => createInitialNodes())
  const [selection, setSelection] = useState<Selection>(() => emptySelection())
  const [history, setHistory] = useState<HistoryStacks>(EMPTY_HISTORY)
  const [interaction, setInteraction] =
    useState<InteractionState>(IDLE_INTERACTION)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    selectionRef.current = selection
    onSelectionChange?.(selection.size)
  }, [selection, onSelectionChange])

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  useEffect(() => {
    historyRef.current = history
    onHistoryChange?.({
      canUndo: canUndo(history),
      canRedo: canRedo(history),
    })
  }, [history, onHistoryChange])

  const applyPresent = useCallback((snapshot: DocumentSnapshot) => {
    nodesRef.current = snapshot.nodes
    selectionRef.current = snapshot.selection
    setNodes(snapshot.nodes)
    setSelection(snapshot.selection)
  }, [])

  const recordTransaction = useCallback((before: DocumentSnapshot) => {
    setHistory((current) => {
      const next = commitTransaction(current, before)
      historyRef.current = next
      return next
    })
  }, [])

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
      if (current.mode === 'idle') {
        return
      }
      if (
        'pointerId' in current &&
        current.pointerId !== pointerId
      ) {
        return
      }
      if (closingPointerIdRef.current === pointerId) {
        return
      }
      closingPointerIdRef.current = pointerId

      try {
        if (
          current.mode === 'nodeDrag' ||
          current.mode === 'nodeResize'
        ) {
          if (options.cancelled) {
            const restored = replaceNode(nodesRef.current, current.originNode)
            nodesRef.current = restored
            setNodes(restored)
            gestureBaselineRef.current = null
            return
          }

          const vp = viewportRef.current
          let nextNodes = nodesRef.current

          if (current.mode === 'nodeDrag') {
            if (options.endScreen) {
              const crossed =
                current.hasMoved ||
                hasExceededDragThreshold(
                  current.startScreen,
                  options.endScreen,
                )
              if (crossed) {
                const endWorld = screenToWorld(options.endScreen, vp)
                const deltaWorld = worldDeltaBetween(
                  current.startWorld,
                  endWorld,
                )
                nextNodes = moveNodeFromOrigin(
                  nodesRef.current,
                  current.nodeId,
                  current.originNode,
                  deltaWorld,
                )
              } else {
                nextNodes = replaceNode(nodesRef.current, current.originNode)
              }
            }
          } else if (options.endScreen) {
            const endWorld = screenToWorld(options.endScreen, vp)
            const deltaWorld = worldDeltaBetween(current.startWorld, endWorld)
            const nextRect = resizeRect(
              current.originNode,
              current.handle,
              deltaWorld,
            )
            nextNodes = resizeNodeFromOrigin(
              nodesRef.current,
              current.nodeId,
              current.originNode,
              nextRect,
            )
          }

          const baseline = gestureBaselineRef.current
          gestureBaselineRef.current = null
          const finalNode = findNode(nextNodes, current.nodeId)
          const resolved = resolveCompletedNodeEdit({
            nodes: nextNodes,
            originNode: current.originNode,
            finalNode,
          })
          nextNodes = resolved.nodes
          nodesRef.current = nextNodes
          setNodes(nextNodes)

          if (baseline && resolved.shouldCommitHistory) {
            recordTransaction(baseline)
          }
          return
        }

        if (current.mode === 'pan') {
          return
        }

        if (current.mode === 'marquee') {
          if (options.cancelled) {
            setSelection(cloneSelection(current.previousSelection))
          } else {
            const endWorld = options.endScreen
              ? screenToWorld(options.endScreen, viewportRef.current)
              : current.currentWorld
            const crossed =
              current.hasCrossedThreshold ||
              (options.endScreen
                ? hasExceededDragThreshold(
                    current.startScreen,
                    options.endScreen,
                  )
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
        }
      } finally {
        setInteractionState(IDLE_INTERACTION)
        releaseCapture(pointerId)
        closingPointerIdRef.current = null
      }
    },
    [recordTransaction, releaseCapture, setInteractionState],
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

  const beginCapture = (pointerId: number): boolean => {
    const svg = svgRef.current
    if (!svg) {
      return false
    }
    try {
      svg.setPointerCapture(pointerId)
      capturedPointerIdRef.current = pointerId
      return true
    } catch (error) {
      // Inactive pointer IDs (e.g. synthetic events) throw NotFoundError.
      // Do not leave a half-started gesture without capture ownership.
      console.warn('Pointer capture skipped for inactive pointer', error)
      return false
    }
  }

  const addRectangle = useCallback((): boolean => {
    if (interactionRef.current.mode !== 'idle') {
      return false
    }
    const svg = svgRef.current
    if (!svg) {
      return false
    }
    const { width: svgWidth, height: svgHeight } = svg.getBoundingClientRect()
    const placed = placeNewNodeRect({
      viewport: viewportRef.current,
      svgWidth,
      svgHeight,
      creationIndex: creationIndexRef.current,
    })
    creationIndexRef.current += 1

    const node: CanvasNode = {
      id: createNodeId(),
      x: placed.x,
      y: placed.y,
      width: placed.width,
      height: placed.height,
    }

    const before = createSnapshot(nodesRef.current, selectionRef.current)
    const nextNodes = addNode(nodesRef.current, node)
    if (nodesEqual(before.nodes, nextNodes)) {
      return false
    }
    const nextSelection = selectOnly(node.id)
    nodesRef.current = nextNodes
    selectionRef.current = nextSelection
    setNodes(nextNodes)
    setSelection(nextSelection)
    recordTransaction(before)
    return true
  }, [recordTransaction])

  const deleteSelection = useCallback((): boolean => {
    if (interactionRef.current.mode !== 'idle') {
      return false
    }
    const selected = selectionRef.current
    if (selected.size === 0) {
      return false
    }

    const before = createSnapshot(nodesRef.current, selected)
    const nextNodes = deleteSelectedNodes(nodesRef.current, selected)
    if (nodesEqual(before.nodes, nextNodes)) {
      return false
    }
    const nextSelection = reconcileSelection(selected, nextNodes)
    nodesRef.current = nextNodes
    selectionRef.current = nextSelection
    setNodes(nextNodes)
    setSelection(nextSelection)
    recordTransaction(before)
    return true
  }, [recordTransaction])

  const undo = useCallback((): boolean => {
    if (interactionRef.current.mode !== 'idle') {
      return false
    }
    const present = createSnapshot(nodesRef.current, selectionRef.current)
    const result = undoTransaction(historyRef.current, present)
    if (!result) {
      return false
    }
    historyRef.current = result.history
    setHistory(result.history)
    applyPresent(result.present)
    return true
  }, [applyPresent])

  const redo = useCallback((): boolean => {
    if (interactionRef.current.mode !== 'idle') {
      return false
    }
    const present = createSnapshot(nodesRef.current, selectionRef.current)
    const result = redoTransaction(historyRef.current, present)
    if (!result) {
      return false
    }
    historyRef.current = result.history
    setHistory(result.history)
    applyPresent(result.present)
    return true
  }, [applyPresent])

  useImperativeHandle(
    ref,
    () => ({
      addRectangle,
      deleteSelection,
      undo,
      redo,
    }),
    [addRectangle, deleteSelection, undo, redo],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldHandleHistoryKey(event)) {
        if (interactionRef.current.mode !== 'idle') {
          return
        }
        const action = resolveHistoryShortcut(event)
        if (action === 'undo') {
          if (undo()) {
            event.preventDefault()
          }
          return
        }
        if (action === 'redo') {
          if (redo()) {
            event.preventDefault()
          }
          return
        }
      }

      if (!shouldHandleDeleteKey(event)) {
        return
      }
      if (interactionRef.current.mode !== 'idle') {
        return
      }
      if (selectionRef.current.size === 0) {
        return
      }
      event.preventDefault()
      deleteSelection()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [deleteSelection, redo, undo])

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
      if (!beginCapture(event.pointerId)) {
        return
      }
      setSelection(emptySelection())
      setInteractionState({
        mode: 'pan',
        pointerId: event.pointerId,
        startPointer: startScreen,
        originViewport: viewport,
      })
      return
    }

    // Select mode: marquee candidate (do not clear selection until click/commit).
    if (!beginCapture(event.pointerId)) {
      return
    }
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

    if (!beginCapture(event.pointerId)) {
      return
    }

    const startScreen = readSvgPoint(svg, event.clientX, event.clientY)
    const startWorld = screenToWorld(startScreen, viewport)

    // Baseline is pre-selection so undo restores prior selection with origin geometry.
    gestureBaselineRef.current = createSnapshot(
      nodesRef.current,
      selectionRef.current,
    )
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

    if (!beginCapture(event.pointerId)) {
      return
    }

    const startScreen = readSvgPoint(svg, event.clientX, event.clientY)
    const startWorld = screenToWorld(startScreen, viewport)

    gestureBaselineRef.current = createSnapshot(
      nodesRef.current,
      selectionRef.current,
    )
    setSelection(selectOnly(node.id))
    setInteractionState({
      mode: 'nodeResize',
      pointerId: event.pointerId,
      nodeId: node.id,
      handle,
      startWorld,
      originNode: { ...node },
    })
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

    // Normal pointer-up already closed the gesture; ignore the follow-up event.
    if (closingPointerIdRef.current === event.pointerId) {
      return
    }

    const current = interactionRef.current
    if (current.mode === 'idle') {
      return
    }
    if (!('pointerId' in current) || current.pointerId !== event.pointerId) {
      return
    }

    // Unexpected capture loss — cancel without a history transaction.
    endGesture(event.pointerId, { cancelled: true })
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
  },
)

export default CanvasWorkspace
