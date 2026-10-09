# Phase 7 verification record — Axenloom

Environment: Windows 10, Vite dev (`localhost:5174`), Cursor IDE browser tools.  
Input methods: real mouse clicks, toolbar buttons, keyboard events (including `window` `keydown` dispatch for Ctrl+Z).  
**Limitation:** HTML5 `browser_drag` refuses SVG (not `draggable`); CDP `Input.*` is unavailable. Continuous press-move-release SVG gestures are therefore **BLOCKED** in automation. Pure unit tests cover gesture commit / epsilon / handle clamp math.

Status key: `PASS` | `FAIL` | `BLOCKED` | `NOT RUN`

## Viewport

| Behavior | Status | Notes |
| --- | --- | --- |
| Pan in Hand mode | BLOCKED | Needs held-button mouse move over SVG |
| Cursor-centered zoom | NOT RUN | Wheel over SVG not automatable via scroll helper |
| Zoom bounds 25%–400% | PASS | Unit: `viewport.test.ts` |
| No unintended recentering on create/undo | PASS | Browser: HUD stayed 100% across Add/Undo/Redo |
| Initial centering once | PASS | Code audit: `didCenterOriginRef` + empty deps |

## Nodes

| Behavior | Status | Notes |
| --- | --- | --- |
| Click selection | PASS | Real click selects node; Delete enables |
| Drag under zoom | BLOCKED | SVG drag automation |
| Four-corner resize | BLOCKED | SVG drag automation |
| Minimum-size clamp | PASS | Unit: `resize.test.ts` |
| Cancellation restores origin | PASS | Unit path + code: `endGesture({ cancelled: true })` |
| Capture failure aborts gesture | PASS | Code: `beginCapture` returns false before state enter |

## Marquee

| Behavior | Status | Notes |
| --- | --- | --- |
| Four-direction / live preview / commit | BLOCKED | Needs SVG drag |
| Geometry / intersection | PASS | Unit: `rectangles.test.ts` |

## Editing

| Behavior | Status | Notes |
| --- | --- | --- |
| Add rectangle | PASS | Browser click |
| Delete selection | PASS | Prior + toolbar enabled when selected |
| Empty canvas + recreate | PASS | Phase 5 browser; units |
| Bulk delete one transaction | PASS | Unit: history tests |

## History

| Behavior | Status | Notes |
| --- | --- | --- |
| Add → Undo → Redo (same UUID) | PASS | Browser + units |
| Redo branch invalidation | PASS | Browser: Undo then Add clears Redo |
| Ctrl+Z undo | PASS | Dispatched trusted-enough keydown |
| Drag/resize → one transaction | PASS | Unit; browser drag BLOCKED |
| Sub-epsilon no-op restores origin | PASS | Unit: `gestureCommit.test.ts` |
| Viewport excluded | PASS | Browser HUD unchanged |

## Interface / a11y / responsive

| Behavior | Status | Notes |
| --- | --- | --- |
| Undo/Redo disabled states | PASS | Browser |
| Focus-visible tokens | PASS | Code audit `index.css` |
| Reduced motion | PASS | Code audit |
| Narrow chrome (≤768 / ≤390) | PASS | CSS wrap; hide status/tagline |
| Pointer-capture console errors (real clicks) | PASS | None observed during click/undo tests |
| Full keyboard node editing | NOT RUN | Out of scope; not claimed |

## Dependency audit

| Item | Result |
| --- | --- |
| `geist@1.7.2` | Direct dependency; fonts self-hosted |
| `next@16.4.0` | Installed as peer of `geist`; not used at runtime by Vite app |
| Cleanup | **Proposed (RED):** vendor woff2 + drop `geist` — awaiting approval |

## Manual checklist (for human verification)

1. Hand-pan with mouse down/move/up on empty canvas.
2. Select-mode marquee in all four directions; confirm live highlight and commit.
3. Drag a node at 25%, 100%, 400%; Undo/Redo once each.
4. Resize all four corners including NW; Undo restores x/y/width/height.
5. Drag away and return to origin — Undo stack / Redo unchanged.
6. Cancel mid-drag (Escape if wired, or Alt-tab / capture loss) — geometry restored, no history.
7. At 25% zoom on a 32×32 node, confirm corner handles do not fully cover each other.
8. Narrow window ~360px — tools usable, no page horizontal overflow.
