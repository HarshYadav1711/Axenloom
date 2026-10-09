# Product requirements — Axenloom

## Product identity

| Field | Value |
| --- | --- |
| Name | Axenloom |
| Tagline | Shape ideas without boundaries. |
| Package / repository | `axenloom` |
| Purpose | Legman AI take-home: infinite canvas editor demonstrating engineering judgment, geometry correctness, clean interaction architecture, and restrained visual craft |

## Assignment objective

Build a focused infinite-canvas editor where users can pan/zoom a workspace, create and manipulate rectangular shapes, select via click and marquee, and undo/redo edits — implemented with React, TypeScript, Vite, and **native SVG** (no external canvas/graphics libraries).

Expected effort scale: approximately eight hours. This is not a Figma clone.

## Required features (employer)

1. Infinite workspace
2. Smooth viewport panning
3. Mouse-wheel zoom anchored at the cursor
4. Accurate world ↔ screen coordinate conversion
5. Creating shapes
6. Selecting shapes
7. Moving shapes
8. Resizing shapes
9. Marquee selection by rectangle intersection
10. Real-time highlighting during marquee drag
11. Undo/redo for canvas editing operations

All interactions must remain correct under arbitrary viewport translation and zoom.

## User interactions (planned)

| Interaction | Behavior summary |
| --- | --- |
| Pan | Drag empty workspace in Hand mode (and Space-temporary Hand in a later phase) |
| Zoom | Wheel zoom toward cursor; scale clamped |
| Select | Click node; marquee in Select mode |
| Move | Drag selected/hit node in Select mode |
| Resize | Drag resize handles |
| Create / delete | Explicit editing tools (Phase 5) |
| Undo / redo | Snapshot history for create/move/resize/delete |

## Employer constraints

- No external canvas/graphics libraries (React Flow, Fabric.js, Konva, Pixi, etc.)
- Native SVG + self-implemented geometry/interaction logic
- Correct math at any pan/zoom
- Scope appropriate to a take-home (not a full design suite)

## Internal design decisions (not employer requirements)

Documented as product assumptions:

- **Hand mode (default)** — background drag pans.
- **Select mode** — background drag starts marquee; node click selects; node drag moves.
- **Space** may temporarily activate Hand mode later (with focus safeguards).
- **Viewport excluded** from document undo/redo unless assignment text requires otherwise.
- **Snapshot history** committed at action boundaries (not every pointermove).
- Visual system and chrome layout defined in `docs/Design.md`.
- Brand name **Axenloom** and tagline are internal product packaging for the assignment.

## Assumptions

- Pointer-centric desktop/laptop usage is primary; comprehensive touch editing is out of scope.
- Rectangles only for nodes in the assignment scope.
- Single-user, in-memory document (no persistence backend).
- Handoff PDF / employer screenshots are authoritative when present; this repo may bootstrap docs first (Phase 0 exception).

## Non-goals

- Backend, database, authentication
- Collaboration / realtime
- Layers panel, text editing, connectors, arrows
- Minimap, rotation, freehand drawing, boolean ops
- Mobile-first touch gesture suite
- Plugin ecosystem, theming marketplace
- Analytics, tracking, paid services

## Acceptance criteria (product-level)

The product is submission-ready when:

- All employer-required features work under pan/zoom.
- Geometry tests cover conversion and zoom invariant.
- Lint, typecheck, tests, and production build pass.
- No banned graphics dependencies.
- README explains architecture and how to run.
- Requirements matrix statuses match verified reality.

Phase-level acceptance lives in `docs/phases.md`. Traceability lives in `docs/REQUIREMENTS_MATRIX.md`.
