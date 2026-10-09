# Final acceptance — Axenloom (Phase 8)

**Release decision:** RELEASE CANDIDATE — MANUAL SIGN-OFF REQUIRED

Environment for automated/engineering checks: Windows 10, Node `v24.19.0`, npm `11.17.0`.  
Application: Vite production build / `npm run dev` (port may vary).

Status key: `PASS` | `FAIL` | `BLOCKED` | `PENDING` | `NOT RUN`

---

## Gate summary

| Gate | Result | Notes |
| --- | --- | --- |
| **A — Engineering verification** | **PASS** | typecheck, lint, 8×92 tests, production build, Geist/Next removed, clean `npm ci` |
| **B — Real-pointer acceptance** | **BLOCKED** | Continuous SVG pan/drag/resize/marquee not executable in Cursor browser tools (HTML5 drag ≠ SVG pointer; CDP Input denied) |
| **C — Submission readiness** | **PENDING** | Blocked on Gate B; packaging prepared as release candidate |

---

## Gate A evidence

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 8 files, 92 tests |
| `npm run build` | PASS — JS ~238.55 kB / 74.61 kB gzip; CSS ~7.01 kB / 2.10 kB gzip; fonts ~69.65 + 71.36 kB |
| `npm audit` | 0 vulnerabilities reported |
| Runtime deps | `react`, `react-dom` only (no `geist`, no `next`) |
| Fonts | Self-hosted under `src/assets/fonts/` + OFL `LICENSE.txt` |
| Clean install | `npm ci` + gates in isolated temp copy — see Phase 8 report |

---

## Gate B — manual pointer checklist (user)

Complete in a desktop browser with a real mouse. Record browser/version, OS, viewport size, and result for each scenario.

### A — Background panning
Hand mode → press empty canvas → drag → release. Repeat after zoom.  
Expect: world moves together; node world coords unchanged; no stuck state; no capture exception.

### B — Cursor-centered zoom
Cursor over a known world point → zoom in/out; try near corners.  
Expect: point stays under cursor; scale 25–400%; no geometry mutation.

### C — Node dragging
Select → drag ~100 px → release → Undo → Redo. Repeat at 25%, 100%, 400%.  
Expect: one undo step; viewport unchanged; exact restore.

### D — Node resizing
All four corners, especially NW. Undo/Redo.  
Expect: anchored opposite edge; min size; one undo step; x/y/width/height restored.

### E — Marquee selection
Select mode → drag across nodes → observe live highlight → release; reverse direction; after pan/zoom.  
Expect: positive-area preview; commit on release; no pan.

### F — Bulk deletion
Marquee multi-select → Delete → Undo → Redo.  
Expect: one delete transaction; full restore/re-delete.

### G — Full editing sequence
Create → Move → Resize → Delete → Undo×4 → Redo×4 → Undo → new edit.  
Expect: exact states; redo cleared after branch edit; viewport outside history.

### H — Cancellation and no-ops
Click without drag; drag/return; resize/return; cancel if possible; commands mid-gesture.  
Expect: no bogus history; idle after cancel; redo preserved after no-ops.

**Sign-off:** ________________  Date: ________  Browser: ________

---

## Requirements snapshot

See `docs/REQUIREMENTS_MATRIX.md` for full rows. Summary:

| Area | Engineering | Pointer acceptance |
| --- | --- | --- |
| World/screen math | Unit verified | n/a |
| Create / delete / toolbar undo | Browser + unit verified | Pass for discrete actions |
| Pan / drag / resize / marquee continuous | Code + units | **Awaiting Gate B** |
| Cross-zoom suite (REQ-13) | Partial | **Awaiting Gate B** |
| Native SVG / no graphics libs | Dependency audit pass | n/a |

**Employer handoff PDF:** not present in repository; matrix follows `docs/PRD.md`.

---

## Accessibility limits (honest)

- Toolbar buttons: native, named, focus-visible, correct disabled/`aria-pressed`.
- Shortcuts guarded against editable focus and active gestures.
- **Not implemented:** keyboard move/resize/marquee of SVG shapes.

---

## Submission artifact

Release candidate ZIP (when generated): `Axenloom_LegmanAI_ReleaseCandidate.zip`  
Includes source, configs, lockfile, fonts+license, docs, tests. Excludes `node_modules`, `.git`, `dist`.

**Not submitted.** Upload/submit only after Gate B sign-off and user approval.
