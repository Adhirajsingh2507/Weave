---
slug: blueprint
title: Blueprint
aliases: [technical drawing, cyanotype plan, schematic style]
status: ready
summary: White line on cyan ground — dimensioned drawings, grid paper, annotations and the visual language of engineering plans.
best_for: [engineering and hardware, architecture, developer docs, process explainers, manufacturing]
avoid_for: [lifestyle brands, emotional storytelling, anything needing photographic warmth]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: blueprint, value: "#0E3A6B" }
      - { name: blueprint-deep, value: "#0A2A4E" }
      - { name: line, value: "#E8F1FA" }
      - { name: line-dim, value: "#8FB4D9" }
      - { name: grid, value: "#1B4E85" }
      - { name: annotate, value: "#FFC43D" }
  typography:
    scale: default
    families:
      - { role: mono, family: "IBM Plex Mono, ui-monospace, monospace", weights: [400, 600] }
      - { role: sans, family: "Inter, Roboto Condensed, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.06
    heading_case: uppercase
    heading_line_height: 1.25
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1360
    section_spacing_px: [32, 64, 96]
    overlay: fine grid paper at low opacity, title block in a corner
  shape:
    radius_px: 0
    border_px: 1
    border_style: thin technical line with corner ticks
    shadow: none
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [stroke-dashoffset, opacity]
    intensity: drafting
  imagery:
    treatment: [line drawings, exploded views, dimension lines, section cuts]
    illustration: technical schematics in white line
    icons: 1px technical line with tick marks
checks:
  - { id: bp.ground.cyan, rule: "the page ground is a deep blue and drawings are light line work", kind: deterministic }
  - { id: bp.grid.paper, rule: "a fine grid overlay is present at 6-12% opacity", kind: deterministic }
  - { id: bp.line.weights, rule: "line work uses at most 3 weights, mapped to outline, detail and dimension", kind: deterministic }
  - { id: bp.annotation.dimensions, rule: "at least one drawing carries dimension lines with mono labels and units", kind: deterministic }
  - { id: bp.type.mono-technical, rule: "labels and annotations use the mono role, uppercase, with wide tracking", kind: deterministic }
  - { id: bp.titleblock.present, rule: "a title block with project, revision and scale appears on the page", kind: deterministic }
  - { id: bp.a11y.contrast, rule: "line and dim-line colours on the blueprint ground meet 4.5:1", kind: deterministic }
  - { id: bp.feel.drafted, rule: "the page reads as a real drawing sheet rather than a blue page with thin borders", kind: judged }
---

# Blueprint

## The look in one paragraph

An engineering drawing sheet: deep cyan ground, white line work, a fine grid behind everything,
dimension lines with measurements in mono, section cuts and exploded views, and a title block in
the corner listing project, scale and revision. Precise, informative and entirely unromantic.

## Layout

- 12 columns at 1360px, compact, organised like a drawing sheet with a border and corner ticks.
- A title block sits in one corner of the page or of each major section.
- Drawings are annotated in place; text columns sit beside them in plain blocks.

## Typography

- Mono for all annotation, dimensions and labels, uppercase with `0.06em` tracking.
- A condensed sans for prose at 16px.
- Numbers always carry units. Revision marks and scale notation are part of the type system.

## Colour

Deep blueprint blue with a darker variant for panels, near-white for primary line work, a dim
blue for secondary lines and grid, and one amber for annotations and callouts.

## Surface and depth

None. Everything is line on ground. Borders are 1px technical lines with tick marks at corners,
not decorative frames.

## Motion

Drafting: 500ms `stroke-dashoffset` so drawings appear to be drawn, and dimension lines
extending to their measurement. Stops under reduced-motion.

## Imagery

Technical schematics, exploded assemblies, section cuts, plan and elevation views. Photographs
are converted to line art or omitted.

## Components

- **Drawing** — white line SVG with dimensions and callouts.
- **Title block** — a bordered box with project, scale, revision, date.
- **Callout** — amber leader line with a mono label.
- **Buttons** — 1px outlined rectangles with corner ticks and mono labels.
- **Tables** — ruled technical tables with mono figures.

## Do

- Annotate drawings with real dimensions and units.
- Keep a title block visible.
- Use no more than three line weights.
- Draw in SVG so lines can animate and scale.

## Don't

- Don't add fills, shadows or gradients.
- Don't use proportional type for annotations.
- Don't include photography.
- Don't let dim line colours fall below the contrast floor.

## How Weave verifies it

Deterministic checks sample the ground colour and line colours, detect the grid overlay and its
opacity, count distinct stroke widths in SVG line work, look for dimension-line groups with mono
labels, confirm a title block exists, check annotation type and tracking, and measure contrast
for both line tones. The judged check asks whether it reads as a genuine drawing sheet.

Reference pictures: `demo-design/blueprint/`.
