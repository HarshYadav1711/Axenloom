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
  panFromOrigin,
  viewportWorldTransform,
  wheelEventToZoomFactor,
  worldToScreen,
  zoomAtCursor,
} from '../geometry'
import type { Point } from '../geometry/point'
import { DEFAULT_VIEWPORT, type Viewport } from '../types/editor'
import {
  IDLE_INTERACTION,
  type InteractionState,
} from '../types/interaction'
import styles from './CanvasWorkspace.module.css'

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
 * Phase 1 interactive SVG workspace: background pan + cursor-centered wheel zoom.
 * No nodes, selection, marquee, or history.
 *
 * Coordinate assumption: this SVG has no viewBox; user units match CSS pixels
 * of the element’s bounding client rect.
 */
export default function CanvasWorkspace() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const capturedPointerIdRef = useRef<number | null>(null)
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [interaction, setInteraction] =
    useState<InteractionState>(IDLE_INTERACTION)

  const releaseCapture = useCallback((pointerId: number) => {
    const svg = svgRef.current
    if (svg?.hasPointerCapture(pointerId)) {
      svg.releasePointerCapture(pointerId)
    }
    if (capturedPointerIdRef.current === pointerId) {
      capturedPointerIdRef.current = null
    }
  }, [])

  const endPan = useCallback(
    (pointerId: number) => {
      setInteraction((current) => {
        if (current.mode !== 'pan' || current.pointerId !== pointerId) {
          return current
        }
        return IDLE_INTERACTION
      })
      releaseCapture(pointerId)
    },
    [releaseCapture],
  )

  const didCenterOriginRef = useRef(false)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || didCenterOriginRef.current) {
      return
    }

    const { width, height } = svg.getBoundingClientRect()
    if (width <= 0 || height <= 0) {
      return
    }

    // Place world origin near the center so pan/zoom correctness is observable.
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

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return
    }
    if (interaction.mode !== 'idle') {
      return
    }

    const svg = event.currentTarget
    const startPointer = readSvgPoint(svg, event.clientX, event.clientY)

    setInteraction({
      mode: 'pan',
      pointerId: event.pointerId,
      startPointer,
      originViewport: viewport,
    })
    capturedPointerIdRef.current = event.pointerId
    svg.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (interaction.mode !== 'pan') {
      return
    }
    if (event.pointerId !== interaction.pointerId) {
      return
    }

    const currentPointer = readSvgPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    )
    setViewport(
      panFromOrigin(
        interaction.originViewport,
        interaction.startPointer,
        currentPointer,
      ),
    )
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    endPan(event.pointerId)
  }

  const onPointerCancel = (event: ReactPointerEvent<SVGSVGElement>) => {
    endPan(event.pointerId)
  }

  const onLostPointerCapture = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    if (capturedPointerIdRef.current === event.pointerId) {
      capturedPointerIdRef.current = null
    }
    setInteraction((current) => {
      if (current.mode !== 'pan' || current.pointerId !== event.pointerId) {
        return current
      }
      return IDLE_INTERACTION
    })
  }

  const isPanning = interaction.mode === 'pan'
  const worldTransform = viewportWorldTransform(viewport)
  const originScreen = worldToScreen({ x: 0, y: 0 }, viewport)

  return (
    <div className={styles.root}>
      <svg
        ref={svgRef}
        className={`${styles.canvas}${isPanning ? ` ${styles.canvasPanning}` : ''}`}
        role="application"
        aria-label="Infinite canvas workspace. Drag to pan. Scroll to zoom at the cursor."
        tabIndex={0}
        onPointerDown={onPointerDown}
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

        <rect width="100%" height="100%" fill="var(--workspace-bg)" />
        <rect width="100%" height="100%" fill="url(#axenloom-world-dots)" />

        <g transform={worldTransform}>
          <line
            className={styles.originArm}
            x1={-28}
            y1={0}
            x2={28}
            y2={0}
          />
          <line
            className={styles.originArm}
            x1={0}
            y1={-28}
            x2={0}
            y2={28}
          />
          <circle className={styles.originCore} cx={0} cy={0} r={3} />
        </g>

        {/* Screen-space label so zoom does not inflate the origin caption. */}
        <text
          className={styles.originLabel}
          x={originScreen.x + 8}
          y={originScreen.y - 8}
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
