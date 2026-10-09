# Design system — Axenloom

## Visual personality

**Spatial clarity with technical precision.**

Axenloom should feel like a carefully designed engineering tool: precise, minimal, technical, restrained, modern, responsive, professional, and purposeful.

The **canvas is the product**. Toolbars and status chrome stay subordinate.

### Anti-patterns

Avoid excessive glassmorphism, giant blurred gradients, neon glows, random 3D décor, nested cards, pill overload, artificial whitespace, unnecessary animation, fake editing controls, generic dashboards, and decorations that compete with the workspace.

## Inherited principles (cybersecurity editorial project)

Reused **discipline**, not layout:

- Editorial clarity → spatial clarity
- Technical precision in typography and contrast
- Token-driven color system
- No arbitrary visual spectacle
- Accessibility and reduced-motion respect
- Explainable, reviewable UI decisions

**Not reused:** hero sections, article grids, 1280px content containers, marketing sectional rhythm.

## Semantic design tokens

### Foundations

```css
:root {
  --ink: #1c1c28;
  --ink-raised: #242433;
  --ink-soft: #2b2b3c;

  --paper: #f4f4f1;
  --paper-raised: #fafaf7;

  --text-on-dark: #f4f4f1;
  --text-on-light: #17171f;

  --muted-on-dark: #aaaab7;
  --muted-on-light: #666674;

  --border-dark: #343446;
  --border-dark-strong: #45455a;
  --border-light: #d8d8d1;

  --accent: #1ec1cb;
  --accent-hover: #27d2dc;
  --accent-soft: rgba(30, 193, 203, 0.12);
  --accent-ink: #12121a;
}
```

### Editor semantic aliases

| Alias | Role |
| --- | --- |
| `--chrome-bg` | Application bar / toolbar (`--ink`) |
| `--chrome-border` | Chrome dividers (`--border-dark`) |
| `--workspace-bg` | Infinite surface (`--paper`) |
| `--workspace-grid` | Subtle dots/lines (low-contrast on paper) |
| `--node-fill` | Default shape fill (`--paper-raised`) |
| `--node-stroke` | Default shape border (`--border-light` / ink-soft as needed) |
| `--node-selected-stroke` | Selection outline (`--accent`) |
| `--marquee-fill` | Marquee interior (`--accent-soft`) |
| `--marquee-stroke` | Marquee border (`--accent`) |
| `--handle-fill` | Resize handles (`--accent`) |
| `--focus-ring` | Keyboard focus (`--accent`) |

Cyan is selective: active tool, selection, handles, focus — not dominant chrome fill. Filled cyan buttons use `--accent-ink` text. Verify contrast; do not assume.

## Typography

- **Geist Sans** — application UI text (self-hosted from the `geist` package via `@font-face`; no third-party font CDN).
- **Geist Mono** — coordinates, zoom %, measurements, technical metadata.
- Fallbacks: `ui-sans-serif, system-ui, sans-serif` / `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- Do not set long prose in monospace.

## Editor layout (planned chrome)

- Compact top application bar (brand + minimal status)
- Small tool strip for editor tools (from Phase 5; **no fake buttons in Phase 0**)
- Workspace occupies nearly all remaining space
- Compact zoom/viewport readout (when live)
- No mandatory side panels
- Full available viewport — no marketing max-width container on the canvas

### Phase 0 shell (immediate)

- Brand mark + name + tagline in chrome
- Static “Phase 0 · foundation” status (non-interactive)
- Full-viewport non-interactive SVG workspace with restrained paper + subtle grid
- No operational Add / Delete / Undo / Redo / Pan / Zoom / Select controls

## Workspace background

Warm paper surface with a subtle low-contrast grid or dots. Grid must remain quiet so shapes and selection chrome read first.

## Toolbar philosophy (future)

- Compact, icon+label or accessible icon-only with names
- Clear active-tool state
- Disabled only when meaningful
- Never look clickable before implemented

## Node appearance (future)

- Neutral fills, thin borders, small corner radii
- Moderate padding/spacing consistency
- Minimal shadows (prefer stroke hierarchy)

## Selection feedback (future)

Distinguish:

- Default
- Hover (where applicable)
- Selected
- Active dragging
- Keyboard focus

## Marquee appearance (future)

Accent-soft fill + accent stroke; visible during drag; does not obscure workspace identity.

## Resize handles (future)

Small accent-filled handles; clear hover/active cursors; minimum node size enforced in logic.

## Motion principles

- Confirm interaction; do not decorate.
- Chrome transitions ≈ 120–200ms CSS when useful.
- Pan / drag / resize / zoom: prioritize pointer accuracy — no laggy easing on follow paths.
- Honor `prefers-reduced-motion` for nonessential motion.

## Accessibility

- Semantic landmarks for shell regions
- Native controls when actions exist
- Visible focus rings using accent tokens
- Sufficient contrast on chrome and workspace labels
- Document SVG keyboard-editing limits until implemented

## Responsive behavior

Targets: 1440, 1024, 768, 390, 360.

- Preserve workspace dominance
- Avoid horizontal page overflow
- Collapse or shorten chrome labels before crushing the canvas
- Pointer-centric assignment: do not invent full mobile touch editing requirements

## Design review checklist

1. Reason for every element?
2. Workspace dominant?
3. Hierarchy obvious?
4. Tokens consistent?
5. Cyan selective?
6. Borders/spacing intentional?
7. Any unnecessary decoration?
8. Generic dashboard smell?
9. Fits viewport without page overflow?
10. Coherent on narrow screens?

Classify proposed changes as correctness, subjective preference, or system conflict before implementing.
