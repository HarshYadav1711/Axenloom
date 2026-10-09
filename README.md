# Axenloom

**Shape ideas without boundaries.**

Axenloom is an infinite canvas editor built for the **Legman AI** take-home engineering assignment. It demonstrates coordinate-correct viewport math, explicit interaction architecture, and a restrained technical visual system — without becoming an overengineered Figma clone.

## Stack

- React 19 + TypeScript (strict)
- Vite
- Native SVG (no external canvas/graphics libraries)
- CSS design tokens
- Vitest + ESLint
- npm (single lockfile)
- Node.js 24 LTS preferred

## Requirements

- Node.js 24+ recommended
- npm 10+

## Install

```bash
npm install
```

## Local development

```bash
npm run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | TypeScript project references check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch mode |
| `npm run preview` | Preview production build |

## Architecture overview

Nodes live in **world space**. The viewport stores screen-space translation (`x`, `y`) and `scale`.

```text
screen = world * scale + viewportTranslation
world  = (screen - viewportTranslation) / scale
```

Planned interaction modes use an explicit state machine (`idle`, `pan`, `nodeDrag`, `resize`, `marquee`). Document state, viewport, selection, interaction, and history remain separate. Undo/redo uses snapshots at action boundaries; the viewport is excluded from history (internal assumption).

See `docs/Architecture.md` for full detail.

## Controls (Phase 4)

| Input | Behavior |
| --- | --- |
| Hand / Select buttons | Switch editor mode (`aria-pressed`; disabled mid-gesture) |
| Drag empty background (Hand) | Pan viewport; clears selection |
| Drag empty background (Select) | World-space marquee with live intersection highlight |
| Click empty background (Select) | Clear selection (no meaningful drag) |
| Click / drag a node | Select and move (both modes) |
| Drag a corner handle | Resize when exactly one node is selected |
| Mouse wheel over workspace | Cursor-centered zoom (ignored during drag/resize/marquee) |
| Zoom HUD (bottom-right) | Live zoom percentage from `viewport.scale` |

Zoom is clamped to 25%–400% (internal engineering bounds). Marquee uses strict positive-area overlap (edge-only contact does not select). Multi-select does not enable group resize.

## Current status (Phase 4)

**Implemented**

- Viewport, nodes, selection, drag, and four-corner resize
- Hand / Select modes
- Real-time marquee selection with live highlighting
- Rectangle normalize/intersect tests

**Not implemented yet**

- Create/delete tools
- Undo/redo

## Planned phases

0. Foundation and context lock — complete
1. Viewport foundations — complete
2. Node rendering and movement — complete
3. Node resizing — complete
4. Marquee selection ← **current**
5. Editing tools
6. Undo/redo
7. Hardening and visual refinement
8. Final acceptance and submission

Details: `docs/phases.md`. Traceability: `docs/REQUIREMENTS_MATRIX.md`.

## Design and engineering principles

- **Spatial clarity with technical precision**
- Context lock before implementation
- GREEN / YELLOW / RED change classification
- No arbitrary dependencies or fake functionality
- Employer requirements outrank internal taste
- Agents follow `AGENTS.md` and must not auto-commit/push

## Key technical assumptions

- Hand mode (default) pans; Select mode marquees / selects / moves (internal policy)
- Native SVG over Canvas API for this assignment’s scale
- Snapshot history; viewport not undoable unless assignment text requires otherwise
- Geist fonts self-hosted from the `geist` package via `@font-face` (see dependency note in Phase reports regarding the `next` peer)

## Authority documents

1. Employer assignment / handoff (when available)
2. User-approved phase decisions
3. `docs/rules.md` → `PRD.md` → `Architecture.md` → `Design.md` → `phases.md` → `REQUIREMENTS_MATRIX.md`
