# Axenloom

**Shape ideas without boundaries.**

Axenloom is an infinite canvas editor built for the **Legman AI** take-home engineering assignment. It demonstrates coordinate-correct viewport math, explicit interaction ownership, transactional undo/redo, and a restrained technical visual system — using **native SVG** only (no React Flow, Fabric, Konva, Pixi, or Canvas API for the workspace).

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript (strict) |
| Bundler | Vite 8 |
| Graphics | Native SVG |
| Styles | CSS modules + design tokens |
| Fonts | Self-hosted Geist Sans / Mono (SIL OFL 1.1) |
| Tests | Vitest |
| Lint | ESLint |
| Package manager | npm (single lockfile) |

## Prerequisites

- **Node.js 24+** recommended (verified on Node 24)
- **npm 10+**

## Fresh install

```bash
npm ci
npm run dev
```

Vite prints the local URL (commonly `http://localhost:5173/`; another port is used if that one is busy).

For a first-time clone without a prior lockfile sync, `npm install` also works; prefer `npm ci` for reproducible installs.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Optional production preview:

```bash
npm run preview
```

## Editor controls

| Input | Behavior |
| --- | --- |
| Hand / Select | Switch editor mode (`aria-pressed`; disabled mid-gesture) |
| Drag empty background (Hand) | Pan viewport; clears selection |
| Drag empty background (Select) | World-space marquee with live intersection highlight |
| Click empty background (Select) | Clear selection |
| Click / drag a node | Select and move (both modes) |
| Drag a corner handle | Resize when exactly one node is selected |
| Mouse wheel over workspace | Cursor-centered zoom (ignored during drag/resize/marquee) |
| Add | Create a 160×100 world-unit rectangle near the visible SVG center |
| Delete | Remove all selected nodes |
| Undo / Redo | Document history |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z or Ctrl+Y | Redo |
| Delete / Backspace | Delete selection (idle, not in a text field) |

Zoom is clamped to **25%–400%**. Marquee uses strict positive-area overlap. History capacity is **100** edits. Viewport pan/zoom and tool mode are **not** in undo history.

## Architecture (brief)

- **Why SVG:** Assignment-scale document with inspectable DOM nodes; no graphics library required.
- **World model:** Nodes store `x`, `y`, `width`, `height` in world units. Viewport holds screen translation + scale: `screen = world * scale + translation`.
- **Cursor-centered zoom:** Adjusts translation so the world point under the cursor stays fixed in screen space.
- **Interaction state machine:** Exclusive modes — `idle`, `pan`, `nodeDrag`, `nodeResize`, `marquee`.
- **Marquee:** Normalize rectangle → positive-area intersection → live preview IDs → commit on release.
- **History:** Immutable document snapshots at action boundaries (one create / delete / completed drag / completed resize = one undo step).

See `docs/Architecture.md` for detail. Traceability: `docs/REQUIREMENTS_MATRIX.md`.

## Assumptions and tradeoffs

- Pan and zoom are excluded from undo/redo (internal assumption).
- No persistence, backend, collaboration, or auth.
- Snapshot history suited to a small node document (not command/event sourcing).
- No group transforms, rotation, snapping, connectors, or text editing.
- Toolbar and shortcuts are keyboard-accessible; **full keyboard manipulation of SVG shapes is not implemented** (pointer-centric editor).
- Continuous SVG pan/drag/resize/marquee acceptance requires **human pointer verification** — see `docs/FINAL_ACCEPTANCE.md`. Cursor IDE automation cannot HTML5-drag SVG.

## Design

**Spatial clarity with technical precision** — charcoal chrome, paper workspace, selective cyan accent, Geist typography. Details: `docs/Design.md`.

## Fonts & license

Geist Sans and Geist Mono variable fonts are vendored under `src/assets/fonts/` with the SIL Open Font License text in `src/assets/fonts/LICENSE.txt`. Copyright © 2023 Vercel, in collaboration with basement.studio.

## Project docs

| Document | Role |
| --- | --- |
| `AGENTS.md` | Agent workflow and hard constraints |
| `docs/PRD.md` | Product requirements |
| `docs/Architecture.md` | Technical architecture |
| `docs/Design.md` | Design system |
| `docs/phases.md` | Phase plan and status |
| `docs/REQUIREMENTS_MATRIX.md` | Requirement traceability |
| `docs/PHASE7_VERIFICATION.md` | Phase 7 evidence matrix |
| `docs/FINAL_ACCEPTANCE.md` | Final gates and manual checklist |

## Authority

1. Employer assignment / handoff (when available)
2. User-approved phase decisions
3. `docs/rules.md` → PRD → Architecture → Design → phases → REQUIREMENTS_MATRIX

**Note:** The original Legman AI handoff PDF was not present in this repository during development; requirements follow `docs/PRD.md` and the matrix.
