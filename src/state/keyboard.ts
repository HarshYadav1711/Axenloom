function isElementLike(
  target: EventTarget | null,
): target is Element {
  return (
    typeof target === 'object' &&
    target !== null &&
    typeof (target as Element).closest === 'function'
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!isElementLike(target)) {
    return false
  }
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
    ),
  )
}

/**
 * Whether Delete/Backspace should delete the canvas selection.
 * Pure decision helper — no DOM listeners here.
 */
export function shouldHandleDeleteKey(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  target: EventTarget | null
}): boolean {
  if (event.key !== 'Delete' && event.key !== 'Backspace') {
    return false
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }

  return !isEditableTarget(event.target)
}

export type HistoryShortcut = 'undo' | 'redo'

/**
 * Map a key event to undo/redo when modifiers match.
 * Uses lowercase key comparison so Shift+Z still works.
 */
export function resolveHistoryShortcut(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  repeat: boolean
}): HistoryShortcut | null {
  if (event.repeat || event.altKey) {
    return null
  }

  const mod = event.ctrlKey || event.metaKey
  if (!mod) {
    return null
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

  if (key === 'z' && !event.shiftKey) {
    return 'undo'
  }
  if (key === 'z' && event.shiftKey) {
    return 'redo'
  }
  if (key === 'y' && !event.shiftKey) {
    return 'redo'
  }

  return null
}

/** Whether the editor should handle a history shortcut (focus-safe). */
export function shouldHandleHistoryKey(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  repeat: boolean
  target: EventTarget | null
}): boolean {
  if (resolveHistoryShortcut(event) === null) {
    return false
  }
  return !isEditableTarget(event.target)
}
