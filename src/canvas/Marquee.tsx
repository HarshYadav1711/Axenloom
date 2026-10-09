import type { Rect } from '../geometry/resize'
import styles from './Marquee.module.css'

type MarqueeProps = {
  rect: Rect
}

/** World-space selection rectangle. Non-interactive overlay. */
export default function Marquee({ rect }: MarqueeProps) {
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }

  return (
    <rect
      className={styles.marquee}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      data-marquee="true"
      aria-hidden="true"
    />
  )
}
