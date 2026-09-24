---
slug: _base
title: Base rules
status: ready
summary: The floor every style inherits. A style may go beyond these, never below them.
---

# Base rules

Every design guide inherits this file. Style is what changes between guides; the rules here
don't. When a style's instinct collides with a rule below, the rule wins and the style bends
around it — a Y2K page still has to be readable, a brutalist page still needs a focus ring.

These map onto the accessibility and performance packs, so the check ids are shared.

## Accessibility

- `base.a11y.contrast` — body text contrast ≥ 4.5:1, large text (≥ 24px, or ≥ 19px bold)
  ≥ 3:1, measured against what is actually behind the text, including gradients and images.
- `base.a11y.target-size` — interactive targets ≥ 24×24 CSS px, and ≥ 44×44 for primary
  actions and anything thumb-reachable on mobile.
- `base.a11y.focus-visible` — a visible focus indicator on every focusable element, with
  ≥ 3:1 contrast against its background. Never `outline: none` without a replacement.
- `base.a11y.semantics` — one `<h1>` per page, heading levels in order, landmarks used,
  every meaningful image has alt text, decorative images have empty alt.
- `base.a11y.reduced-motion` — under `prefers-reduced-motion: reduce`, non-essential motion
  stops. Parallax, autoplay, marquee and looping animation are off, not just faster.
- `base.a11y.forms` — every input has a real label; errors are announced in text, not by
  colour alone.

## Responsive

- `base.responsive.no-h-scroll` — no horizontal scrolling at 360px width.
- `base.responsive.reflow` — content reflows to a single column on small screens; nothing
  depends on hover to be reachable.
- `base.responsive.type` — body text ≥ 16px, line length 60–75 characters, line height ≥ 1.5.

## Performance

- `base.perf.fonts` — at most 2 font families and 4 weights total, self-hosted or
  preconnected, `font-display: swap`.
- `base.perf.images` — modern formats, explicit width/height, lazy below the fold, hero
  image ≤ 300 KB.
- `base.perf.budget` — mobile Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## Honesty

- `base.content.no-fabrication` — no invented testimonials, logos, metrics, awards or press
  quotes. Placeholder copy is labelled as placeholder.
- `base.content.one-idea` — one idea per section, and the body text supports the headline
  above it rather than repeating it.

All of the above are `deterministic` except `base.content.*`, which are `judged`.
