---
slug: paper-cutout
title: Paper Cutout
aliases: [papercraft, layered paper, kirigami style]
status: ready
summary: Layered coloured paper with soft drop shadows — clean cut shapes stacked into depth, like a handmade pop-up book.
best_for: [children's products, education, craft and stationery, seasonal campaigns, storytelling sections]
avoid_for: [enterprise tools, data dashboards, luxury, dense content]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FCF7EF" }
      - { name: paper-1, value: "#F2D8A7" }
      - { name: paper-2, value: "#E8907C" }
      - { name: paper-3, value: "#7FB3A5" }
      - { name: paper-4, value: "#4A6B8A" }
      - { name: ink, value: "#2F2A26" }
      - { name: shadow, value: "rgba(47, 42, 38, 0.18)" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Poppins, Nunito, DM Sans, sans-serif", weights: [500, 700] }
    heading_tracking_em: -0.01
    heading_line_height: 1.15
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: centered
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [64, 104, 144]
    composition: stacked paper layers with wavy or cut edges between sections
  shape:
    radius_px: 16
    border_px: 0
    shadow: "0 6px 12px rgba(47, 42, 38, 0.18)"
  motion:
    duration_ms: 380
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: layered
  imagery:
    treatment: [cut paper shapes, subtle paper grain, soft shadows between layers]
    illustration: papercraft scenes built from 3-5 layers
    icons: cut paper shapes with shadows
checks:
  - { id: cut.layers.stack, rule: "scenes are built from at least 3 distinct paper layers with shadows between them", kind: deterministic }
  - { id: cut.shadow.soft-short, rule: "layer shadows are short and soft, suggesting a few millimetres of separation", kind: deterministic }
  - { id: cut.edges.cut, rule: "section boundaries use cut or wavy edges rather than straight lines", kind: deterministic }
  - { id: cut.texture.grain, rule: "paper grain texture is present at 3-8% opacity on coloured layers", kind: deterministic }
  - { id: cut.color.matte, rule: "fills are matte with no gradients or gloss", kind: deterministic }
  - { id: cut.a11y.contrast, rule: "ink on every paper colour meets 4.5:1", kind: deterministic }
  - { id: cut.motion.layered, rule: "layers move at slightly different rates on scroll and stop under prefers-reduced-motion", kind: deterministic }
  - { id: cut.feel.craft, rule: "the scene reads as physically cut paper rather than flat shapes with drop shadows", kind: judged }
---

# Paper Cutout

## The look in one paragraph

Coloured paper cut into shapes and stacked: a hill in front of a hill in front of a sky, each
layer casting a short soft shadow onto the one behind. Matte colours, visible paper grain,
wavy cut edges between sections, and an overall feeling of something made by hand on a table.

## Layout

- Centred at 1140px, composed in horizontal bands like a pop-up book spread.
- Section boundaries are cut edges — a wave, a torn arc, a scalloped line — in the next
  section's colour.
- Scenes have a clear foreground, middle and background layer.

## Typography

- A rounded sans at 500/700 to match the soft cut shapes.
- Headings at `1.15`; body 17px at `1.65` in a warm ink.
- Text sits on a clean paper layer, not across a busy scene.

## Colour

Warm off-white ground with a matte paper palette — sand, coral, sage, slate. Colours are chosen
as though from a pack of craft card: flat, slightly dusty, no shine.

## Surface and depth

Short soft shadows (`0 6px 12px` at ~18% opacity) between layers — enough to suggest a few
millimetres of paper, never enough to look like floating UI cards. Radii are modest and edges
are cut rather than rounded uniformly.

## Motion

Layered: 380ms, and on scroll the layers shift at slightly different rates so the depth reads.
Parallax is subtle and stops entirely under reduced-motion.

## Imagery

Papercraft scenes of 3–5 layers, with grain texture and consistent light direction. Photographs
can be masked into a cut-paper silhouette.

## Components

- **Scene band** — the layered illustration block spanning the section.
- **Cards** — single paper rectangles with a short shadow and a cut top edge.
- **Buttons** — paper chips with a shadow that shortens on press.
- **Section divider** — a cut wave in the next section's colour.
- **Badges** — small cut shapes, rotated slightly.

## Do

- Build scenes from three or more layers.
- Keep shadows short and soft.
- Use cut edges between sections.
- Keep colours matte with grain.

## Don't

- Don't use long blurred shadows — that's floating UI, not paper.
- Don't add gradients or gloss.
- Don't put text across a busy scene.
- Don't ship parallax without a reduced-motion stop.

## How Weave verifies it

Deterministic checks count layer elements per scene and read the shadow values between them,
detect cut or wavy section separators, measure grain texture opacity, look for gradient
declarations on paper fills, measure contrast, and confirm scroll parallax respects
reduced-motion. The judged check asks whether it reads as physically cut paper.

Reference pictures: `demo-design/paper-cutout/`.
