# Requirements matrix — Axenloom

Status values: `pending` | `in_progress` | `verified` | `n/a`

Never mark planned work as verified.

| ID | Description | Source | Phase | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| REQ-01 | Infinite workspace | Employer | 1 | Manual: pan beyond initial view; no hard world clamp in normal use | verified |
| REQ-02 | Smooth viewport panning | Employer | 1 | Manual pointer drag in Hand mode; no jump artifacts | verified |
| REQ-03 | Cursor-anchored mouse-wheel zoom | Employer | 1 | Manual + unit: world point under cursor fixed in screen space | verified |
| REQ-04 | World → screen conversion | Employer | 1 | Unit tests for known viewport/node fixtures | verified |
| REQ-05 | Screen → world conversion | Employer | 1 | Unit tests; round-trip with REQ-04 | verified |
| REQ-06 | Create shapes | Employer | 5 | Manual create; document node count increases; undoable later | pending |
| REQ-07 | Select shapes | Employer | 2 | Manual click selection; selection chrome visible | pending |
| REQ-08 | Move shapes | Employer | 2 | Manual drag at multiple zoom levels; world delta correct | pending |
| REQ-09 | Resize shapes | Employer | 3 | Manual handle drag; min size; correct under zoom | pending |
| REQ-10 | Marquee selection (rect intersection) | Employer | 4 | Manual four-direction marquee; partial overlap selects | pending |
| REQ-11 | Real-time marquee highlighting | Employer | 4 | Highlight updates during drag before pointerup | pending |
| REQ-12 | Undo/redo for editing operations | Employer | 6 | Manual + unit: create/move/resize/delete; redo cleared after new edit | pending |
| REQ-13 | Correct behavior under pan + zoom | Employer | 1–7 | Cross-cutting manual suite at varied viewport states | pending |
| REQ-14 | Native SVG only (no graphics libs) | Employer | 0 | Dependency review of `package.json` / lockfile | verified |
| INT-01 | Hand vs Select mode policy | Internal | 4–5 | Manual mode switching; documented in Architecture | pending |
| INT-02 | Viewport excluded from undo history | Internal | 6 | Undo/redo leaves viewport unchanged | pending |
| INT-03 | Snapshot history at action boundaries | Internal | 6 | Continuous drag = one undo step | pending |
| INT-04 | Design token system + restrained chrome | Internal | 0 / 7 | Design review checklist; Phase 0 shell tokens present | verified |
| INT-05 | Strict TS, ESLint, Vitest tooling | Internal | 0 | `npm run typecheck`, `lint`, `test`, `build` | verified |
| INT-06 | Governance docs + requirements traceability | Internal | 0 | Files exist and hierarchy referenced from `AGENTS.md` | verified |

## Phase notes

Phase 0 verification (2026-10-09): REQ-14 / INT-04 / INT-05 / INT-06 marked `verified` after dependency review, shell/token inspection, tooling commands, and authority-document presence.

Phase 1 verification (2026-10-09): REQ-01–REQ-05 marked `verified` after geometry unit tests plus browser pan/zoom checks. REQ-13 remains `pending` until later phases exercise nodes under pan/zoom. Employer feature requirements REQ-06–REQ-12 remain `pending`.

**Missing source evidence:** `Legman_AI_Infinite_Canvas_Assignment_Handoff.pdf` is not present in the repository; Phase 1 follows the documented requirements in `docs/PRD.md` / `docs/REQUIREMENTS_MATRIX.md`.
