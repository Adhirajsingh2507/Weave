---
slug: swiss-design
title: Swiss Design
aliases: [international typographic style, swiss style]
status: ready
summary: Grid-locked typographic clarity — white, black, one red, flush-left neo-grotesque, nothing decorative.
best_for: [marketing site, editorial, documentation, portfolio, conference site, design system]
avoid_for: [playful consumer apps, children's products, anything that needs warmth or whimsy]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFFFF" }
      - { name: foreground, value: "#111111" }
      - { name: accent, value: "#E3000F" }
      - { name: muted, value: "#737373" }
      - { name: rule, value: "#111111" }
      - { name: surface, value: "#F4F4F4" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Neue Haas Grotesk Display, Helvetica Neue, Inter, Arial", weights: [400, 700] }
    heading_tracking_em: -0.02
    heading_line_height: 1.05
    body_size_px: 17
    body_line_height: 1.55
    alignment: flush-left
    case: sentence
  layout:
    system: grid
    density: comfortable
    columns: 12
    gutter_px: 24
    max_width_px: 1280
    section_spacing_px: [48, 96, 144]
    asymmetry: within-grid
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 150
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [opacity, transform]
    intensity: minimal
  imagery:
    treatment: [black-and-white, documentary, full-bleed]
    illustration: none
    icons: line, 1px, geometric
checks:
  - { id: swiss.type.families-max, rule: "at most 2 font families in the built CSS", kind: deterministic }
  - { id: swiss.type.weights-max, rule: "at most 2 weights (400, 700); no light or italic display type", kind: deterministic }
  - { id: swiss.type.flush-left, rule: "no text-align justify or center on body copy", kind: deterministic }
  - { id: swiss.shape.radius-zero, rule: "every computed border-radius is 0px", kind: deterministic }
  - { id: swiss.shape.no-shadow, rule: "no box-shadow other than the focus indicator", kind: deterministic }
  - { id: swiss.color.palette-only, rule: "painted colours come from the palette; no gradients anywhere", kind: deterministic }
  - { id: swiss.color.accent-sparing, rule: "the accent red appears on at most 3 elements per viewport", kind: deterministic }
  - { id: swiss.layout.grid-snap, rule: "section left edges align to the same 12-column grid; no arbitrary offsets", kind: deterministic }
  - { id: swiss.layout.whitespace, rule: "section vertical spacing is one of the section_spacing_px values", kind: deterministic }
  - { id: swiss.feel.composition, rule: "the page reads as asymmetric but balanced, not centred-everything", kind: judged }
---

# Swiss Design

## The look in one paragraph

Content organised on a visible grid, set in one neo-grotesque, flush-left, with big empty
areas doing the work that decoration does elsewhere. Hierarchy comes from size, weight and
position only. There is exactly one accent colour, used like a warning light — rarely, and
always meaning something. If a page needs a shadow, a rounded corner or a second typeface to
look finished, the layout isn't finished.

## Layout

- 12 columns, 24px gutters, content capped at 1280px, with margins that stay generous at
  every breakpoint.
- Compose asymmetrically **inside** the grid: a headline spanning columns 1–7, body text in
  4–8, an image bleeding from 8 to the edge. Never centre everything.
- Horizontal 1px rules separate sections. They are structure, not decoration, so they run
  the full column span they belong to.
- Whitespace is the primary design element: pick spacing from the scale and let it be large.
  When in doubt, double it rather than adding a graphic.

## Typography

- One family. 400 for body, 700 for headings. No italics for display, no light weights.
- Headings set tight: `-0.02em` tracking, `1.05` line height, sentence case.
- Body at 17px, `1.55` line height, 60–75 characters per line.
- Numbers, labels and captions in the same family at small sizes, often uppercase with
  `0.08em` tracking — this is the one place letter-spacing opens up.
- No text shadows, no outlines, no gradient text.

## Colour

White background, near-black text, one red. Grey (`#737373`) carries secondary text, and a
single light grey surface (`#F4F4F4`) may separate a block. That is the whole palette.
Accent red marks one thing per screen: the primary action, a live indicator, a key number.

## Surface and depth

There is no depth. No shadows, no rounded corners, no layering effects. Separation is done
with rules, spacing and background swaps between white and `#F4F4F4`.

## Motion

Fast and nearly invisible: 150ms, opacity and small translations only. Hover changes colour
or underline, never scale or bounce. Nothing animates on scroll beyond content appearing.

## Imagery

Black-and-white documentary photography, full-bleed or grid-aligned, never inset with a
border. No stock illustration, no 3D, no gradients. Icons are 1px geometric line work.

## Components

- **Buttons** — square, 1px border, black on white or white on black; primary may be the red
  fill. Label is sentence case, no icon unless it carries meaning.
- **Nav** — a single row of text links, left-aligned with the grid, separated by space rather
  than dividers. Active state is weight or a 1px underline.
- **Cards** — a rule and spacing, not a box. If a container is truly needed, 1px border, no
  radius, no shadow.
- **Forms** — labels above inputs, 1px bottom border or full 1px box, square corners, red
  only for errors.
- **Footer** — a grid of text columns, one rule above it, nothing else.

## Do

- Let one headline dominate the viewport.
- Align everything to the grid, including images and captions.
- Use size and position, not colour, for hierarchy.
- Leave a whole column empty when it makes the composition breathe.

## Don't

- Don't add a second typeface "for personality".
- Don't round anything, shadow anything, or add a gradient.
- Don't centre body text, and don't justify it.
- Don't use the red for decoration, dividers, or more than a few elements at a time.

## How Weave verifies it

The deterministic checks read the built CSS and the rendered page: font families and weights
in use, every computed `border-radius` and `box-shadow`, colour values against the palette,
gradient declarations, section left edges against the grid, and vertical spacing against the
allowed steps. `swiss.feel.composition` is the only judged check — a screenshot goes to a
model with the question "is this composed asymmetrically within a grid, or is it centred
everything?". Everything in `_base.md` applies on top.

Reference pictures: `demo-design/swiss-design/`.
