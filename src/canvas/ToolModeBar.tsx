import type { EditorTool } from '../types/editor'
import styles from './ToolModeBar.module.css'

type ToolModeBarProps = {
  tool: EditorTool
  disabled?: boolean
  onToolChange: (tool: EditorTool) => void
}

/**
 * Compact Hand / Select mode switch.
 * Mode changes are ignored while `disabled` (active pointer gesture).
 */
export default function ToolModeBar({
  tool,
  disabled = false,
  onToolChange,
}: ToolModeBarProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Editor mode">
      <button
        type="button"
        className={`${styles.button}${tool === 'hand' ? ` ${styles.buttonActive}` : ''}`}
        aria-pressed={tool === 'hand'}
        aria-label="Hand mode"
        disabled={disabled}
        onClick={() => onToolChange('hand')}
      >
        Hand
      </button>
      <button
        type="button"
        className={`${styles.button}${tool === 'select' ? ` ${styles.buttonActive}` : ''}`}
        aria-pressed={tool === 'select'}
        aria-label="Select mode"
        disabled={disabled}
        onClick={() => onToolChange('select')}
      >
        Select
      </button>
    </div>
  )
}
