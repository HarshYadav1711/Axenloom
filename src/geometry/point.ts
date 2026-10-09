/** 2D point in either screen or world space (caller-defined). */
export type Point = {
  x: number
  y: number
}

/** Approximate equality for floating-point geometry assertions and clamps. */
export function approximatelyEqual(
  a: number,
  b: number,
  epsilon = 1e-9,
): boolean {
  return Math.abs(a - b) <= epsilon
}

export function pointsApproximatelyEqual(
  a: Point,
  b: Point,
  epsilon = 1e-9,
): boolean {
  return (
    approximatelyEqual(a.x, b.x, epsilon) &&
    approximatelyEqual(a.y, b.y, epsilon)
  )
}
