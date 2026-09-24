---
slug: vector-art
title: Vector Art
aliases: [flat vector, geometric illustration, clean vector]
status: ready
summary: Crisp geometric illustration built from flat shapes and consistent stroke weights — scalable, precise and endlessly recolourable.
best_for: [SaaS marketing, explainer sections, documentation, onboarding, brand systems]
avoid_for: [luxury, photographic storytelling, anything wanting texture or warmth]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFFFF" }
      - { name: surface, value: "#F4F6F9" }
      - { name: ink, value: "#16202E" }
      - { name: muted, value: "#5A6678" }
      - { name: primary, value: "#2F6BFF" }
      - { name: secondary, value: "#12C2A0" }
      - { name: accent, value: "#FF7A45" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Geist, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [56, 96, 136]
  shape:
    radius_px: 12
    border_px: 1
    shadow: "0 6px 18px rgba(22, 32, 46, 0.08)"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [transform, opacity, stroke-dashoffset]
    intensity: precise
  imagery:
    treatment: [flat vector scenes, geometric shapes, consistent stroke weights]
    illustration: SVG built from a shared shape and stroke system
    icons: 1.5px stroke, 24px grid, rounded joins
checks:
  - { id: vec.format.svg, rule: "illustrations ship as SVG, not raster", kind: deterministic }
  - { id: vec.stroke.consistent, rule: "stroke widths across illustrations come from one scale (1, 1.5 or 2px equivalents)", kind: deterministic }
  - { id: vec.color.token-palette, rule: "illustration fills use interface palette tokens only", kind: deterministic }
  - { id: vec.geometry.aligned, rule: "shapes align to a consistent grid; no half-pixel edges at 1x", kind: deterministic }
  - { id: vec.icons.grid, rule: "icons come from one set with a shared size grid and join style", kind: deterministic }
  - { id: vec.a11y.svg-roles, rule: "informative SVGs have a title and role; decorative ones are hidden", kind: deterministic }
  - { id: vec.perf.optimised, rule: "SVGs are minified with no editor metadata; each under 40KB", kind: deterministic }
  - { id: vec.feel.system, rule: "illustrations read as one family rather than assorted clip art", kind: judged }
---

# Vector Art

## The look in one paragraph

Clean geometric illustration where every shape is deliberate: flat fills from the interface
palette, one stroke weight throughout, rounded joins, and forms built from circles, rectangles
and arcs. It scales to any size, recolours by token, and — done well — makes a product feel
carefully engineered.

## Layout

- Ordinary 12-column layout at 1200px. Illustration supports the content rather than driving it.
- Scenes sit beside text blocks at a consistent size; icons sit inside cards at a consistent grid.
- Spacing is regular; the style's appeal is order.

## Typography

- One sans at 400/600, matching the precision of the artwork.
- Headings `1.2`, body 17px at `1.6`.
- Nothing decorative — the illustration carries the personality.

## Colour

White and a light surface, ink text, and three illustration colours drawn from the same tokens
the interface uses. This is the rule that makes vector art look owned rather than bought.

## Surface and depth

Flat: 12px radii, hairline borders, soft small shadows. Illustrations themselves have no
gradients or shadows unless a single flat "cast shadow" shape is used consistently.

## Motion

Precise: 260ms, paths drawing themselves via `stroke-dashoffset`, shapes scaling from their
centre. Motion is exact rather than playful.

## Imagery

SVG scenes built from a shared shape system: same corner radii, same stroke weight, same angle
increments. Icons come from one family, on one grid.

## Components

- **Illustration block** — an SVG scene beside a text column, sized consistently across sections.
- **Icon card** — 24px icon, heading, one line of text.
- **Diagram** — flat shapes and arrows, using the same stroke scale.
- **Buttons and nav** — conventional, flat, token-coloured.
- **Empty states** — small vector scene plus one line and an action.

## Do

- Build every illustration from the same shape and stroke system.
- Recolour with palette tokens only.
- Align geometry to the pixel grid.
- Minify SVGs and strip editor metadata.

## Don't

- Don't mix illustration sources with different stroke weights.
- Don't add gradients or drop shadows inside the artwork.
- Don't ship raster exports of vector work.
- Don't leave informative diagrams without text descriptions.

## How Weave verifies it

Deterministic checks confirm illustrations are SVG, parse stroke widths and fill values against
the token palette and stroke scale, inspect path coordinates for grid alignment, check icon sets
for a shared grid, read SVG accessibility attributes, and measure file sizes and metadata. The
judged check asks whether the artwork reads as one family.

Reference pictures: `demo-design/vector-art/`.
