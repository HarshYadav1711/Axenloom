import styles from './EditActionsBar.module.css'

type EditActionsBarProps = {
  selectionCount: number
  gestureActive: boolean
  onAddRectangle: () => void
  onDeleteSelection: () => void
}

/**
 * Minimal create/delete controls. Disabled while a pointer gesture is active.
 * Delete is also disabled when nothing is selected.
 */
export default function EditActionsBar({
  selectionCount,
  gestureActive,
  onAddRectangle,
  onDeleteSelection,
}: EditActionsBarProps) {
  const canAdd = !gestureActive
  const canDelete = !gestureActive && selectionCount > 0

  return (
    <div className={styles.bar} role="group" aria-label="Editing actions">
      <button
        type="button"
        className={`${styles.button} ${styles.buttonPrimary}`}
        aria-label="Add rectangle"
        disabled={!canAdd}
        onClick={onAddRectangle}
      >
        Add
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label="Delete selection"
        disabled={!canDelete}
        onClick={onDeleteSelection}
      >
        Delete{selectionCount > 0 ? ` (${selectionCount})` : ''}
      </button>
    </div>
  )
}
