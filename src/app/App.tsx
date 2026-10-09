import { useCallback, useRef, useState } from 'react'
import CanvasWorkspace, {
  type CanvasEditorHandle,
  type HistoryAvailability,
} from '../canvas/CanvasWorkspace'
import EditActionsBar from '../canvas/EditActionsBar'
import ToolModeBar from '../canvas/ToolModeBar'
import {
  DEFAULT_TOOL,
  type EditorTool,
} from '../types/editor'
import styles from './App.module.css'

/**
 * Application shell. Phase 6: undo/redo controls + create/delete + modes.
 */
export default function App() {
  const editorRef = useRef<CanvasEditorHandle>(null)
  const [tool, setTool] = useState<EditorTool>(DEFAULT_TOOL)
  const [gestureActive, setGestureActive] = useState(false)
  const [selectionCount, setSelectionCount] = useState(0)
  const [historyAvailability, setHistoryAvailability] =
    useState<HistoryAvailability>({ canUndo: false, canRedo: false })

  const onToolChange = useCallback(
    (next: EditorTool) => {
      if (gestureActive) {
        return
      }
      setTool(next)
    },
    [gestureActive],
  )

  const onAddRectangle = useCallback(() => {
    editorRef.current?.addRectangle()
  }, [])

  const onDeleteSelection = useCallback(() => {
    editorRef.current?.deleteSelection()
  }, [])

  const onUndo = useCallback(() => {
    editorRef.current?.undo()
  }, [])

  const onRedo = useCallback(() => {
    editorRef.current?.redo()
  }, [])

  return (
    <div className={styles.shell}>
      <header className={styles.chrome}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.name}>Axenloom</h1>
          <p className={styles.tagline}>Shape ideas without boundaries.</p>
        </div>

        <div className={styles.tools}>
          <ToolModeBar
            tool={tool}
            disabled={gestureActive}
            onToolChange={onToolChange}
          />
          <EditActionsBar
            selectionCount={selectionCount}
            gestureActive={gestureActive}
            canUndo={historyAvailability.canUndo}
            canRedo={historyAvailability.canRedo}
            onAddRectangle={onAddRectangle}
            onDeleteSelection={onDeleteSelection}
            onUndo={onUndo}
            onRedo={onRedo}
          />
        </div>

        <p className={styles.status}>Phase 6 · history</p>
      </header>

      <main className={styles.workspace} aria-label="Canvas workspace">
        <CanvasWorkspace
          ref={editorRef}
          tool={tool}
          onInteractionActiveChange={setGestureActive}
          onSelectionChange={setSelectionCount}
          onHistoryChange={setHistoryAvailability}
        />
      </main>
    </div>
  )
}
