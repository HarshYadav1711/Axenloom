import styles from './EditActionsBar.module.css'

type EditActionsBarProps = {
  selectionCount: number
  gestureActive: boolean
  canUndo: boolean
  canRedo: boolean
  onAddRectangle: () => void
  onDeleteSelection: () => void
  onUndo: () => void
  onRedo: () => void
}

/**
 * Minimal create/delete/undo/redo controls.
 * Disabled while a pointer gesture is active.
 */
export default function EditActionsBar({
  selectionCount,
  gestureActive,
  canUndo,
  canRedo,
  onAddRectangle,
  onDeleteSelection,
  onUndo,
  onRedo,
}: EditActionsBarProps) {
  const canAdd = !gestureActive
  const canDelete = !gestureActive && selectionCount > 0
  const undoEnabled = !gestureActive && canUndo
  const redoEnabled = !gestureActive && canRedo

  return (
    <div className={styles.bar} role="group" aria-label="Editing actions">
      <button
        type="button"
        className={`${styles.button} ${styles.buttonPrimary}`}
        aria-label="Add rectangle"
        title="Add rectangle"
        disabled={!canAdd}
        onClick={onAddRectangle}
      >
        Add
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Delete selection"
        title="Delete selection"
        disabled={!canDelete}
        onClick={onDeleteSelection}
      >
        Delete{selectionCount > 0 ? ` (${selectionCount})` : ''}
      </button>
      <span className={styles.divider} aria-hidden="true" />
      <button
        type="button"
        className={styles.button}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        disabled={!undoEnabled}
        onClick={onUndo}
      >
        Undo
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!redoEnabled}
        onClick={onRedo}
      >
        Redo
      </button>
    </div>
  )
}
