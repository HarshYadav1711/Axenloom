# Engineering rules — Axenloom

Operational governance for humans and coding agents. Prefer this file over improvisation.

## 1. Authority hierarchy

1. Legman AI assignment instructions / screenshots (when available)
2. Assignment handoff PDF (when available)
3. Explicit user-approved decisions
4. This file (`docs/rules.md`)
5. `docs/PRD.md`
6. `docs/Architecture.md`
7. `docs/Design.md`
8. `docs/phases.md`
9. `docs/REQUIREMENTS_MATRIX.md`

Never override employer requirements with internal taste. Label internal decisions as assumptions.

## 2. Context lock (before any edit)

1. Understand the assignment and active phase.
2. Read authority documents relevant to the change.
3. Inspect the repository (scaffold, deps, existing code).
4. Identify already-implemented work; do not overwrite without cause.
5. List files the phase may change.
6. Note unresolved decisions; request approval when consequential.
7. Define acceptance criteria from `docs/phases.md`.
8. Implement only after the above.

Missing context is not permission to invent scope.

## 3. Change classification

### GREEN — permitted within the active phase

- Approved phase features
- Bug fixes, TypeScript/lint fixes
- Accessibility fixes that do not change requirements
- Applying existing design tokens
- Small refactors of duplicated logic without architecture change

### YELLOW — phase-relevant; report in the phase summary

- Minor spacing/token application tweaks
- Extracting a genuinely reused helper
- Small visual consistency fixes within the design system
- Wording clarifications
- Render optimizations that preserve observable behavior

### RED — explicit user approval required

- New/removed unapproved dependencies
- Canvas API instead of SVG; React Flow / Fabric / Konva / Pixi / equivalents
- Global state libraries; major state-architecture replacement
- Backend, database, persistence, auth, collaboration, analytics
- Design-token replacement or major visual redesign
- Unapproved major features or phase-plan changes
- Paid services or credentialed third-party APIs

When RED is needed: document options, stop, wait.

## 4. Dependency policy

- Baseline: React, TypeScript (strict), Vite, native SVG, CSS tokens, Vitest, ESLint, npm.
- Every dependency must solve a current problem.
- Evaluate necessity, compatibility, maintenance, stability, license, performance, security, infrastructure, tracking, and whether a platform API suffices.
- Additional **runtime** dependencies require approval.
- One package manager and one lockfile (`package-lock.json`).
- Do not force-install or delete the lockfile without root-cause analysis.
- Prefer Node.js 24 LTS when available.
- Use current stable releases; avoid alpha/beta/canary/RC/experimental/deprecated packages.
- Local development must not require paid services or credentials.

## 5. Stable-version policy

- Do not pin outdated versions from other projects without checking compatibility.
- If versions cannot be verified, report the limitation.
- Do not upgrade unrelated packages to “fix” a single failure.

## 6. Design lock

- Follow `docs/Design.md`.
- Guiding idea: **spatial clarity with technical precision**.
- Canvas is the primary visual surface; chrome is subordinate.
- No fake functionality; no decorative dashboard clutter.
- Subjective redesigns are not automatic — classify and request approval if they conflict with the design system.

## 7. No arbitrary decisions

Do not change frameworks, rendering architecture, state libraries, tokens, folder structure, or product capabilities because they seem impressive. Prefer documented decisions.

## 8. No fake functionality

Controls that look operational must be operational. Phase shells may show brand, static status, and non-interactive placeholders only.

## 9. No unnecessary file changes

- Change only files justified by the active phase.
- Do not pre-create empty future abstractions.
- Do not rewrite unrelated modules.
- Prefer focused, reviewable diffs.

## 10. Error-handling protocol

On failure:

1. Capture the exact error.
2. Identify probable root cause.
3. Investigate the relevant file/config.
4. Apply the smallest in-phase fix.
5. Rerun the failed check.
6. Report the result.

Do not disable ESLint/strict TypeScript, paper over types with `any`, force-install without cause, or silently ignore failures. If the fix needs a RED decision, stop.

## 11. Performance rules

- Small dependency surface; efficient SVG; pure geometry helpers.
- Appropriate React ownership; avoid unnecessary global re-renders.
- No premature virtualization/spatial indexes.
- Measure before complex optimization.

## 12. Accessibility rules

- Semantic structure; native buttons for actions; accessible names for icon-only controls.
- Visible focus; sufficient contrast; predictable keyboard behavior.
- Respect `prefers-reduced-motion` for nonessential motion.
- Document SVG/keyboard editing gaps honestly until implemented.

## 13. Security rules

- No secrets, tracking, remote scripts, `eval`, or unsafe HTML.
- No unapproved external APIs or hidden network calls.
- No unnecessary `localStorage`.
- Do not suppress type/security errors to force a green build.

## 14. Documentation-change protocol

- Phase 0 may create authority documents.
- After approval, do not silently rewrite them.
- Propose conflicts; wait for approval.
- Keep `docs/REQUIREMENTS_MATRIX.md` honest: pending stays pending until verified.

## 15. Phase gates

- Implement only the approved phase in `docs/phases.md`.
- Meet acceptance criteria, verify, report, stop.
- Do not begin the next phase without explicit approval.

## 16. Git policy

Agents must **not** run `git add`, `git commit`, or `git push` unless the user explicitly requests it.

Also forbidden without explicit request: creating branches, rebase, cherry-pick, reset, force checkout, discarding user changes, staging on the user’s behalf.

Read-only inspection (`status`, `log`, `diff`) is allowed. Propose commit messages; the user commits manually.

## 17. Agent stop conditions

Stop when:

- Phase acceptance criteria are met.
- A RED change is required.
- An unresolved consequential decision blocks progress.
- Continuing would enter a later phase.

After stopping: deliver the phase report and wait.
