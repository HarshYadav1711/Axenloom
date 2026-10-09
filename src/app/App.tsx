import { useCallback, useState } from 'react'
import CanvasWorkspace from '../canvas/CanvasWorkspace'
import ToolModeBar from '../canvas/ToolModeBar'
import {
  DEFAULT_TOOL,
  type EditorTool,
} from '../types/editor'
import styles from './App.module.css'

/**
 * Application shell. Phase 4: Hand/Select modes and marquee selection.
 */
export default function App() {
  const [tool, setTool] = useState<EditorTool>(DEFAULT_TOOL)
  const [gestureActive, setGestureActive] = useState(false)

  const onToolChange = useCallback(
    (next: EditorTool) => {
      // Do not switch tools mid-gesture (deterministic ownership).
      if (gestureActive) {
        return
      }
      setTool(next)
    },
    [gestureActive],
  )

  return (
    <div className={styles.shell}>
      <header className={styles.chrome}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.name}>Axenloom</h1>
          <p className={styles.tagline}>Shape ideas without boundaries.</p>
        </div>

        <ToolModeBar
          tool={tool}
          disabled={gestureActive}
          onToolChange={onToolChange}
        />

        <p className={styles.status}>Phase 4 · marquee</p>
      </header>

      <main className={styles.workspace} aria-label="Canvas workspace">
        <CanvasWorkspace
          tool={tool}
          onInteractionActiveChange={setGestureActive}
        />
      </main>
    </div>
  )
}
