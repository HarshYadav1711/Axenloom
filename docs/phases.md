# Implementation phases — Axenloom

Work **one approved phase at a time**. Meet acceptance criteria, verify, report, propose a commit message, and **stop**.

---

## Phase 0 — Foundation and context lock

**Status:** complete

### Scope

- Repository inspection
- Vite / React / TypeScript scaffold
- Engineering governance documents
- Architecture and design baselines
- Minimal shared types
- Minimal non-interactive application shell
- Tooling scripts and verification

### Expected files

- `AGENTS.md`, `README.md`
- `docs/rules.md`, `docs/PRD.md`, `docs/Architecture.md`, `docs/Design.md`, `docs/phases.md`, `docs/REQUIREMENTS_MATRIX.md`
- Vite/TS/ESLint/Vitest config
- `src/` shell, styles, minimal types

### Acceptance criteria

- Scaffold runs; SVG placeholder renders
- `typecheck`, `lint`, `build`, `test` configured and pass
- No banned graphics dependencies
- Authority docs coherent; one npm lockfile
- No canvas interactions; no commits/pushes by agents

### Verification

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run test
npm run dev
```

### Excluded

Pan, zoom, nodes, selection, resize, marquee, create/delete, history, fake toolbars

### Stopping conditions

Phase 0 report delivered; wait for review.

### Proposed commit message

`chore: establish Axenloom architecture and design foundation`

---

## Phase 1 — Viewport foundations

**Status:** complete

### Scope

SVG world-coordinate group; screen↔world conversion; background panning; cursor-centered zoom; scale clamping; geometry tests.

### Expected files

- `src/geometry/*` conversion helpers
- Canvas viewport group wiring
- Vitest coverage for conversion + zoom invariant

### Acceptance criteria

- Pan updates viewport translation smoothly
- Wheel zoom keeps world point under cursor fixed in screen space
- Scale clamps to documented min/max
- Tests prove conversion round-trips and zoom invariant

### Verification

`npm run typecheck && npm run lint && npm run test && npm run build`

### Excluded

Nodes, selection, tools, history

### Stopping conditions

Do not start Phase 2 without approval.

### Proposed commit message

`feat: implement viewport pan and cursor-centered zoom`

---

## Phase 2 — Node rendering and movement

**Status:** complete

### Scope

Render sample nodes; selection; dragging; zoom-independent movement; drag tests.

### Expected files

Node render components; selection state; drag interaction branch; tests

### Acceptance criteria

- Nodes render in world space under viewport transform
- Click selects; drag moves in world units correctly at any zoom
- Selection chrome visible and token-consistent

### Verification

Same core scripts + targeted tests

### Excluded

Resize, marquee, create/delete toolbar, history

### Stopping conditions

Stop after Phase 2 acceptance.

### Proposed commit message

`feat: render selectable nodes with world-space dragging`

---

## Phase 3 — Node resizing

**Status:** complete

### Scope

Resize handles; minimum dimensions; world-space resizing; tests

### Acceptance criteria

- Handles appear for selection
- Resize updates world geometry correctly under pan/zoom
- Minimum width/height enforced

### Excluded

Marquee, create tools, history

### Proposed commit message

`feat: add world-space node resizing with minimum bounds`

---

## Phase 4 — Marquee selection

**Status:** complete (pending user review)

### Scope

Tool-mode selection; marquee geometry; four-direction drag; intersection; live highlighting

### Acceptance criteria

- Select mode marquee works in all drag directions
- Partial overlaps select
- Highlights update during drag

### Excluded

Create/delete toolbar, history

### Proposed commit message

`feat: add marquee selection with live intersection highlighting`

---

## Phase 5 — Editing tools

**Status:** complete

### Scope

Create rectangles; delete selection; compact Add/Delete controls; keyboard Delete/Backspace when safe; placement at viewport center with cascade offset; immutable document helpers; focused tests.

### Expected files

- `src/state/document.ts` — `addNode`, `deleteSelectedNodes`, `reconcileSelection`
- `src/state/placement.ts`, `ids.ts`, `nodeDefaults.ts`, `keyboard.ts`
- `src/canvas/EditActionsBar.tsx`
- `src/state/editing.test.ts`
- App chrome wiring to `CanvasWorkspace` imperative handle

### Acceptance criteria

- Add Rectangle places a 160×100 world-unit node near the visible SVG center (screen-space cascade offset 24px, wrap every 8)
- New node gets a unique stable ID and replaces selection
- Delete Selection removes all selected nodes in one immutable update; disabled when empty
- Delete/Backspace delete when idle and not in editable fields (no Ctrl/Cmd/Alt)
- Create/delete refuse while a pointer gesture is active
- Viewport unchanged by create/delete
- Toolbar controls are real (no fakes); Hand/Select remain operational
- Tests cover create/delete/placement/keyboard guards; full regression green

### Verification

`npm run typecheck && npm run lint && npm run test && npm run build` plus browser create/delete checks.

### Excluded

Undo/redo, history stacks, copy/paste, duplicate, group transforms, persistence, new shape types, property inspector.

### Stopping conditions

Phase 5 report delivered; wait for approval before Phase 6.

### Proposed commit message

`feat: add viewport-aware shape creation and selection deletion`

---

## Phase 6 — Undo/redo

**Status:** complete

### Scope

Immutable snapshot history; action-boundary transactions for create/delete/drag/resize; Undo/Redo toolbar; Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y; redo invalidation; selection restoration; capacity 100; focused tests.

### Expected files

- `src/state/history.ts` — snapshot stacks, commit/undo/redo, equality helpers
- `src/state/history.test.ts`
- Keyboard history helpers in `src/state/keyboard.ts`
- `EditActionsBar` Undo/Redo controls
- `CanvasWorkspace` transaction integration

### Acceptance criteria

- One history transaction per completed meaningful create, delete (any count), drag, or resize
- Selection-only, pan, zoom, marquee, cancelled, and no-op gestures do not write history or clear redo
- Undo/Redo restore nodes (ids, order, geometry) and reconciled selection
- Viewport and tool mode unchanged by history
- New edit after undo clears future
- Toolbar and shortcuts reflect real availability; blocked mid-gesture and in editable fields
- Full regression suite green

### Verification

`npm run typecheck && npm run lint && npm run test && npm run build` plus browser undo/redo checks.

### Excluded

Persistence, collaboration, command frameworks, group transforms, copy/paste, history UI timelines.

### Stopping conditions

Phase 6 report delivered; wait for approval before Phase 7.

### Proposed commit message

`feat: implement transactional undo and redo for canvas edits`

---

## Phase 7 — Hardening and visual refinement

**Status:** complete (pending user commit)

### Scope

Genuine pointer verification where possible; capture/cancel hardening; epsilon no-op consistency; resize-handle overlap at extreme zoom; responsive chrome; a11y/focus review; Geist/Next audit; verification matrix; focused regression tests.

### Expected files

- `src/state/gestureCommit.ts` (+ tests)
- `clampedHandleWorldSize` in `src/geometry/resize.ts`
- `docs/PHASE7_VERIFICATION.md`
- Targeted CanvasWorkspace / CSS hardening

### Acceptance criteria

- Capture failure does not leave a stuck interaction
- `lostpointercapture` after commit does not cancel the edit
- Sub-epsilon drag/resize restores origin (no silent unrecorded mutation)
- Handles clamped so min-size nodes at 25% zoom do not fully overlap corners
- Responsive chrome usable at narrow widths without page overflow
- Verification matrix records PASS/FAIL/BLOCKED/NOT RUN honestly
- Full regression suite green; Geist cleanup proposed but not applied (RED)

### Verification

`npm run typecheck && npm run lint && npm run test && npm run build` plus `docs/PHASE7_VERIFICATION.md`.

### Excluded

New features, persistence, SVG renderer change, Geist package removal without approval.

### Stopping conditions

Phase 7 report delivered; wait for approval before Phase 8.

### Proposed commit message

`fix: harden canvas interactions history and accessibility`

---

## Phase 8 — Final acceptance and submission

### Scope

Full test/build; manual verification; README polish; architecture explanation; dependency review; submission prep; final git status review (user commits)

### Acceptance criteria

- Requirements matrix statuses accurate
- Submission artifacts complete
- No banned deps; scripts green

### Proposed commit message

`docs: finalize Axenloom submission materials`
