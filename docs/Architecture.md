# Architecture — Axenloom

## Stack decisions and tradeoffs

| Choice | Rationale |
| --- | --- |
| React + TypeScript (strict) | Explicit UI composition, interview-explainable components, compile-time safety for geometry types |
| Vite | Fast local DX and simple production build for a single SPA |
| Native SVG | Scene graph, CSS styling, pointer events on elements, and transforms map cleanly to a limited rectangle editor |
| CSS design tokens | Shared visual language without a component library |
| Vitest | Fast unit tests for pure geometry and reducers |
| ESLint | Baseline static checks aligned with the project governance |
| npm + lockfile | One package manager; reproducible installs |

**Not chosen:** Redux/Zustand (unnecessary for this scale), graphics frameworks (assignment-forbidden), Canvas API as the primary renderer (see below).

## Why native SVG (for this assignment)

For a small set of axis-aligned rectangles with selection handles and a marquee overlay, SVG is a strong fit:

- Each node can be a DOM element with natural hit-testing.
- Viewport pan/zoom can be a group `transform`.
- Selection chrome and marquee are ordinary SVG shapes.
- Styling uses the same design tokens as the chrome.

The HTML Canvas API would require manual redraw loops, custom hit-testing, and more bookkeeping for focus/accessibility affordances. That cost is hard to justify for this assignment’s scale.

This is **not** a claim that SVG is inherently superior for every infinite-canvas product (large scene graphs, particle-heavy drawing, WebGL effects, etc. often favor Canvas/WebGL). The decision is scoped to Legman AI’s constraints and the eight-hour take-home.

## Coordinate systems

All nodes live in **world space**.

```typescript
interface Viewport {
  x: number; // screen-space translation
  y: number;
  scale: number;
}

interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Transforms:

```text
screenX = worldX * scale + viewport.x
screenY = worldY * scale + viewport.y

worldX = (screenX - viewport.x) / scale
worldY = (screenY - viewport.y) / scale
```

Pointer positions are measured relative to the SVG viewport’s client bounds, then converted. Do not mix raw page coordinates with world coordinates.

Pure helpers live in `src/geometry/`:

- `worldToScreen` / `screenToWorld`
- `zoomAtCursor` (cursor-centered zoom + scale clamp)
- `panFromOrigin` (screen-space pan from gesture origin)
- `clientToSvgPoint` (client → SVG-local; assumes no `viewBox`, user units = CSS pixels)
- `viewportWorldTransform` → `translate(x y) scale(s)` (SVG applies right-to-left → scale then translate)

### Zoom invariant (Phase 1)

World point under the cursor stays fixed in screen space during wheel zoom. Scale is clamped to `[MIN_SCALE, MAX_SCALE]` (`0.25`–`4`, internal decision). Wheel handling uses a non-passive listener with `preventDefault` on the workspace SVG only; state updates are functional so rapid wheel events see the latest viewport.

## SVG rendering

- Outer SVG fills the workspace region (no `viewBox` in Phase 1).
- World content uses `transform="translate(x y) scale(s)"` matching `screen = world * scale + translation`.
- Dot grid uses an SVG pattern with the same `patternTransform` so the background pans/zooms with the world without thousands of DOM nodes.
- A small world-origin crosshair (plus screen-space `(0,0)` label) aids manual pan/zoom verification.
- Zoom percentage HUD derives from live `viewport.scale`.

## Interaction state machine (planned)

Use a discriminated union, not a pile of booleans:

- `idle`
- `pan`
- `nodeDrag`
- `resize`
- `marquee`

Each active state carries the initial pointer position and original geometry needed for deterministic updates on `pointermove` / `pointerup`.

## Editor modes (internal decision)

| Mode | Background drag | Node click | Node drag |
| --- | --- | --- | --- |
| Hand (default) | Pan viewport | — | — |
| Select | Start marquee | Select | Move |

Space-temporary Hand mode is a later enhancement with keyboard-focus safeguards.

## Selection geometry (planned)

- Normalize marquee rectangles so drag works in all four directions.
- Intersection tests include partial overlaps.
- Live highlight updates on pointer move, not only on release.
- Geometry functions are pure and tested independently of React.

## History strategy (planned)

- Snapshot history of document node arrays (and selection if needed for UX consistency — decide at Phase 6).
- Undoable: create, move, resize, delete.
- Commit at gesture/action boundaries, not every move event.
- New edit after undo clears the redo branch.
- **Viewport is excluded** from undo/redo (internal assumption unless assignment text says otherwise).

## State ownership

Keep separate:

1. **Document** — persistent node geometry
2. **Viewport** — pan + scale
3. **Selection** — selected ids
4. **Interaction** — ephemeral gesture state
5. **History** — undo/redo stacks

Prefer a small React state surface (local state / `useReducer`) over global stores. Avoid duplicated independent copies of node geometry.

## Component responsibilities (future layout)

```text
src/
  app/          # shell layout, chrome composition
  canvas/       # SVG workspace, nodes, overlays (as needed)
  geometry/     # pure math (conversion, intersection, clamp)
  hooks/        # pointer/viewport hooks when justified
  state/        # types, reducers, history
  styles/       # tokens and global CSS
  __tests__/    # vitest suites
```

Create files when the active phase needs them. Do not pre-create empty interaction hooks.

## Testing boundaries

- **Unit:** pure geometry, history reducers, normalization helpers.
- **Component:** thin rendering/selection wiring when valuable.
- **Manual:** pan/zoom feel, pointer edge cases, responsive chrome.
- Do not add vacuous tests solely to inflate pass counts.

## Performance considerations

- Keep nodes as simple SVG rects; avoid decorative filters that hurt drag fidelity.
- Prefer updating transform/geometry state without rebuilding unrelated trees.
- Defer virtualization/spatial indexes until measured need.
- Pointer-follow paths (pan/drag/resize/zoom) prioritize accuracy over decorative easing.
