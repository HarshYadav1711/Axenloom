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

## Controls (Phase 1)

| Input | Behavior |
| --- | --- |
| Drag workspace background | Pan the viewport (Hand mode) |
| Mouse wheel / trackpad scroll over workspace | Zoom toward the cursor |
| Zoom HUD (bottom-right) | Live zoom percentage from `viewport.scale` |

Zoom is clamped to 25%–400% (internal engineering bounds).

## Current status (Phase 1)

**Implemented**

- Project scaffold, governance, design/architecture baselines
- Pure world ↔ screen conversion helpers
- SVG world transform group
- Background panning with pointer capture
- Cursor-centered wheel zoom with scale clamping
- Geometry unit tests
- Restrained workspace grid + origin marker + zoom HUD

**Not implemented yet**

- Nodes, selection, move, resize
- Marquee, create/delete tools
- Undo/redo

## Planned phases

0. Foundation and context lock — complete
1. Viewport foundations ← **current**
2. Node rendering and movement
3. Node resizing
4. Marquee selection
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
