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

**Status:** complete (pending user review)

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

### Scope

Create shapes; delete selected; compact editor toolbar; functional control states

### Acceptance criteria

- Create adds nodes; delete removes selection
- Toolbar controls are real (no fakes)
- Active tool state is visible

### Excluded

Undo/redo (unless trivial wiring only — prefer Phase 6)

### Proposed commit message

`feat: add create and delete editing tools`

---

## Phase 6 — Undo/redo

### Scope

Snapshot history; atomic transactions; shortcuts; redo invalidation; tests

### Acceptance criteria

- Undo/redo for create/move/resize/delete
- Commits at action boundaries
- New edit after undo clears redo
- Viewport not in history (per assumption)

### Proposed commit message

`feat: add snapshot undo and redo for document edits`

---

## Phase 7 — Hardening and visual refinement

### Scope

Pointer capture/cancel; zoom/drag edge cases; cursors; responsive review; a11y review; visual consistency; light performance checks

### Acceptance criteria

- Documented edge cases handled
- Focus/contrast/reduced-motion reviewed
- No page overflow at target widths

### Proposed commit message

`fix: harden pointer interactions and refine editor chrome`

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
