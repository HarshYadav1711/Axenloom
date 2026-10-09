function isElementLike(
  target: EventTarget | null,
): target is Element {
  return (
    typeof target === 'object' &&
    target !== null &&
    typeof (target as Element).closest === 'function'
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

  if (!isElementLike(event.target)) {
    return true
  }

  return !event.target.closest(
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
  )
}
