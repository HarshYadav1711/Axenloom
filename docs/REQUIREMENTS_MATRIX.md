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
| REQ-06 | Create shapes | Employer | 5 | Manual create; document node count increases; undoable later | verified |
| REQ-07 | Select shapes | Employer | 2 | Manual click selection; selection chrome visible | verified |
| REQ-08 | Move shapes | Employer | 2 | Manual drag at multiple zoom levels; world delta correct | verified |
| REQ-09 | Resize shapes | Employer | 3 | Manual handle drag; min size; correct under zoom | verified |
| REQ-10 | Marquee selection (rect intersection) | Employer | 4 | Manual four-direction marquee; partial overlap selects | verified |
| REQ-11 | Real-time marquee highlighting | Employer | 4 | Highlight updates during drag before pointerup | verified |
| REQ-12 | Undo/redo for editing operations | Employer | 6 | Manual + unit: create/move/resize/delete; redo cleared after new edit | verified |
| REQ-13 | Correct behavior under pan + zoom | Employer | 1–7 | Cross-cutting manual suite at varied viewport states | pending |
| REQ-14 | Native SVG only (no graphics libs) | Employer | 0 | Dependency review of `package.json` / lockfile | verified |
| INT-01 | Hand vs Select mode policy | Internal | 4–5 | Manual mode switching; documented in Architecture | verified |
| INT-02 | Viewport excluded from undo history | Internal | 6 | Undo/redo leaves viewport unchanged | verified |
| INT-03 | Snapshot history at action boundaries | Internal | 6 | Continuous drag = one undo step | verified |
| INT-04 | Design token system + restrained chrome | Internal | 0 / 7 | Design review checklist; Phase 0 shell tokens present | verified |
| INT-05 | Strict TS, ESLint, Vitest tooling | Internal | 0 | `npm run typecheck`, `lint`, `test`, `build` | verified |
| INT-06 | Governance docs + requirements traceability | Internal | 0 | Files exist and hierarchy referenced from `AGENTS.md` | verified |

## Phase notes

Phase 0 verification (2026-10-09): REQ-14 / INT-04 / INT-05 / INT-06 marked `verified` after dependency review, shell/token inspection, tooling commands, and authority-document presence.

Phase 1 verification (2026-10-09): REQ-01–REQ-05 marked `verified` after geometry unit tests plus browser pan/zoom checks.

Phase 2 verification (2026-10-09): REQ-07–REQ-08 marked `verified` after document/drag unit tests plus browser selection/drag checks.

Phase 3 verification (2026-10-09): REQ-09 marked `verified` after resize geometry/document tests plus browser corner-handle checks.

Phase 4 verification (2026-10-09): REQ-10–REQ-11 and INT-01 marked `verified` after rectangle/marquee unit tests plus browser Hand/Select and live-highlight checks. REQ-13 remains `pending` for broader hardening. REQ-06 and REQ-12 remain `pending`.

Phase 5 verification (2026-10-09): REQ-06 marked `verified` after create/delete unit tests plus browser Add Rectangle / Delete Selection / keyboard checks. Deletion of selection is covered with REQ-06 verification (no separate employer REQ id). REQ-12 remains `pending` for Phase 6. REQ-13 remains `pending` for broader hardening.

Phase 6 verification (2026-10-09): REQ-12, INT-02, and INT-03 marked `verified` after snapshot history unit tests plus browser Undo/Redo toolbar and shortcut checks. Viewport/tool mode remain outside history. REQ-13 remains `pending` for Phase 7 hardening.

Phase 7 verification (2026-10-09): Hardening shipped (capture abort, lost-capture race guard, epsilon no-op restore, clamped handles, narrow chrome). REQ-13 remains `pending` until the manual cross-zoom pointer checklist in `docs/PHASE7_VERIFICATION.md` is completed by a human (SVG continuous drag/pan/marquee **BLOCKED** in current automation).

**Missing source evidence:** `Legman_AI_Infinite_Canvas_Assignment_Handoff.pdf` is not present in the repository; phases follow `docs/PRD.md` / `docs/REQUIREMENTS_MATRIX.md`.
