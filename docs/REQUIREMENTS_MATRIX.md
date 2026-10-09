# Requirements matrix — Axenloom

Status values:

| Status | Meaning |
| --- | --- |
| `verified` | Implemented and evidenced (automated and/or observed browser input sufficient for that requirement) |
| `partial` | Implemented; mathematics/toolbar/code evidenced, but continuous real-pointer Gate B still required |
| `pending` | Not fully evidenced |
| `n/a` | Not applicable |

Never mark planned work as verified. Continuous SVG pan/drag/resize/marquee remain **BLOCKED** in Cursor automation — see `docs/FINAL_ACCEPTANCE.md`.

| ID | Description | Source | Phase | Implementation | Automated evidence | Browser / manual | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-01 | Infinite workspace | Employer | 1 | `CanvasWorkspace` viewport (no world clamp) | viewport tests | Prior pan checks; Gate B checklist | partial |
| REQ-02 | Smooth viewport panning | Employer | 1 | Hand-mode `pan` interaction | pan helpers | Gate B Scenario A | partial |
| REQ-03 | Cursor-anchored wheel zoom | Employer | 1 | `zoomAtCursor` + wheel listener | `viewport.test.ts` | Gate B Scenario B | partial |
| REQ-04 | World → screen | Employer | 1 | `worldToScreen` | `viewport.test.ts` | n/a (pure math) | verified |
| REQ-05 | Screen → world | Employer | 1 | `screenToWorld` | `viewport.test.ts` round-trip | n/a | verified |
| REQ-06 | Create shapes | Employer | 5 | Add + `placeNewNodeRect` / `addNode` | `editing.test.ts` | Real Add clicks | verified |
| REQ-07 | Select shapes | Employer | 2 | Click → `selectOnly` | document/selection tests | Real click selection | verified |
| REQ-08 | Move shapes | Employer | 2 | `nodeDrag` + world deltas | drag/history units | Gate B Scenario C | partial |
| REQ-09 | Resize shapes | Employer | 3 | Four corners + `resizeRect` | `resize.test.ts` | Gate B Scenario D | partial |
| REQ-10 | Marquee selection | Employer | 4 | Select-mode marquee | `rectangles.test.ts` | Gate B Scenario E | partial |
| REQ-11 | Real-time marquee highlight | Employer | 4 | Live preview IDs during drag | rectangle units + code | Gate B Scenario E | partial |
| REQ-12 | Undo/redo | Employer | 6 | Snapshot history | `history.test.ts` | Toolbar/keyboard create-delete; Gate B for drag/resize | partial |
| REQ-13 | Correct under pan + zoom | Employer | 1–7 | Shared coordinate model | zoom/drag/resize units | Gate B cross-zoom | pending |
| REQ-14 | Native SVG only | Employer | 0 | No graphics libs in deps | `package.json` / lockfile | n/a | verified |
| INT-01 | Hand vs Select policy | Internal | 4–5 | `EditorTool` + chrome | — | Mode buttons observed | verified |
| INT-02 | Viewport excluded from history | Internal | 6 | Snapshots omit viewport | history tests + HUD checks | Gate B confirm | verified |
| INT-03 | Action-boundary history | Internal | 6 | One commit per completed edit | `history.test.ts` / `gestureCommit` | Gate B C/D | partial |
| INT-04 | Design tokens + chrome | Internal | 0 / 7 | `tokens.css` + modules | — | Visual review | verified |
| INT-05 | Strict TS / ESLint / Vitest | Internal | 0 | Tooling scripts | gates green | n/a | verified |
| INT-06 | Governance + traceability | Internal | 0 | `AGENTS.md` + docs | files present | n/a | verified |

## Phase notes

Phase 0–7 notes retained in git history; Phase 7 detail: `docs/PHASE7_VERIFICATION.md`.

Phase 8 (2026-10-09): Geist package removed; fonts vendored under `src/assets/fonts/` (SIL OFL). Runtime deps are React only. Gate A engineering checks pass. Gate B real-pointer acceptance remains **BLOCKED** in automation — release candidate pending human checklist in `docs/FINAL_ACCEPTANCE.md`. REQ-13 stays `pending`.

**Missing source evidence:** `Legman_AI_Infinite_Canvas_Assignment_Handoff.pdf` is not in the repository; requirements follow `docs/PRD.md` / this matrix.
