# AGENTS.md — Axenloom coding agents

Read this before editing. Stop at phase boundaries.

## Authority hierarchy (highest first)

1. Legman AI assignment instructions and screenshots (when available)
2. `Legman_AI_Infinite_Canvas_Assignment_Handoff.pdf` (when available)
3. Explicit user-approved decisions (including the active phase prompt)
4. `docs/rules.md`
5. `docs/PRD.md`
6. `docs/Architecture.md`
7. `docs/Design.md`
8. `docs/phases.md`
9. `docs/REQUIREMENTS_MATRIX.md`

Employer requirements override internal design preferences. Distinguish assignment requirements from internal assumptions.

## Required workflow

1. **Read authority documents** listed above for the task.
2. **Inspect repository state** (files, scripts, lockfile, branch) before changing code.
3. **Establish context lock**: product, phase, stack, exclusions, acceptance criteria.
4. **Work only on the approved phase** in `docs/phases.md`. Do not start the next phase.
5. **Classify changes** as GREEN / YELLOW / RED per `docs/rules.md`. Stop for RED unless approved.
6. **Respect design and architecture locks** in `docs/Design.md` and `docs/Architecture.md`.
7. **Run verification** commands for the phase; fix failures within phase scope.
8. **Report actual results** — never claim unexecuted checks as passed; never mark pending requirements complete.
9. **Do not commit or push** unless the user explicitly requests it.
10. **Stop** when the phase acceptance criteria are met. Propose a commit message only.

## Hard constraints

- Native SVG only — no React Flow, Fabric, Konva, Pixi, or Canvas API for the workspace.
- No unapproved runtime dependencies (no Redux, Zustand, animation/UI kits).
- No fake interactive controls.
- No backend, auth, collaboration, or persistence unless explicitly approved.
- Prefer small, explainable functions and explicit state transitions.

## Phase gate

Current approved phase is defined in `docs/phases.md`. If work would enter a later phase, stop and wait for approval.
