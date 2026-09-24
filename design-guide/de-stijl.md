---
slug: de-stijl
title: De Stijl
aliases: [neoplasticism, mondrian style]
status: ready
summary: Black rules dividing white space into rectangles, with red, blue and yellow filling a chosen few — no curves, no diagonals.
best_for: [art and culture sites, design studios, galleries, experimental landing pages]
avoid_for: [content-heavy products, anything needing warmth or photography]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: white, value: "#FFFFFF" }
      - { name: black, value: "#0B0B0B" }
      - { name: red, value: "#D0021B" }
      - { name: blue, value: "#0033A0" }
      - { name: yellow, value: "#FFD400" }
      - { name: grey, value: "#EDEDED" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Helvetica Neue, Inter, Arial, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.01
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1440
    rule_width_px: [6, 10, 14]
    section_spacing_px: [0, 24, 48]
    composition: rectangular subdivision, no gutters between fields
  shape:
    radius_px: 0
    border_px: 6
    shadow: none
  motion:
    duration_ms: 240
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [width, height, transform]
    intensity: structural
  imagery:
    treatment: [colour fields, no photography by default]
    illustration: none
    icons: built from rectangles
checks:
  - { id: stijl.color.palette-only, rule: "only white, black, red, blue, yellow and the grey token are painted", kind: deterministic }
  - { id: stijl.color.fill-ratio, rule: "coloured fields cover between 10% and 35% of the viewport; white dominates", kind: deterministic }
  - { id: stijl.shape.no-curves, rule: "every border-radius is 0px; no circular or organic elements", kind: deterministic }
  - { id: stijl.shape.no-diagonals, rule: "no rotation transforms; all edges are horizontal or vertical", kind: deterministic }
  - { id: stijl.layout.rules, rule: "dividing lines use the rule_width_px steps and run edge to edge of their field", kind: deterministic }
  - { id: stijl.layout.asymmetry, rule: "field sizes are unequal; no two adjacent fields share identical dimensions", kind: deterministic }
  - { id: stijl.type.single-family, rule: "one sans family, weights 400 and 700", kind: deterministic }
  - { id: stijl.a11y.text-fields, rule: "text sits on white or black fields, never on red, blue or yellow at small sizes", kind: deterministic }
  - { id: stijl.feel.composition, rule: "the page reads as an asymmetric rectangular composition, not a grid of coloured cards", kind: judged }
---

# De Stijl

## The look in one paragraph

The screen is divided by thick black lines into rectangles of unequal size. Most stay white.
A few are filled with pure red, blue or yellow. Nothing is rounded, nothing is diagonal,
nothing is shaded. The composition is the interface, and the balance between the fields is the
entire design decision.

## Layout

- Fields are divided edge to edge — there are no gutters, and nothing floats inside a margin.
- Sizes are deliberately unequal: a tall narrow field beside a wide short one.
- Content sits inside a field with generous internal padding, so the field reads as a plane,
  not as a padded card.
- On mobile the subdivision becomes vertical, and the rules stay just as thick.

## Typography

- One neo-grotesque, regular and bold. Headings at `1.0` line height.
- Text is left-aligned inside its field. Large headings may occupy an entire field alone.
- No uppercase display, no tracking games — the geometry does the talking.

## Colour

White dominates. Black exists as rules and text. The three primaries fill whole fields, never
gradients or tints, and never more than three coloured fields per viewport. A light grey field
is allowed when a section needs separation without colour.

## Surface and depth

There is no depth at all. The black rules are structural members, 6–14px thick, and they
always run the full width or height of the field they divide.

## Motion

Structural: fields resize, rules extend, at 240ms. Motion reveals the composition being built.
Nothing fades in place, nothing scales up from the centre.

## Imagery

By default there is none. If a photograph is required, it is hard-cropped to fill a field
completely, with no inset or caption overlay.

## Components

- **Buttons** — a filled primary field with a bold label; the whole rectangle is the target.
- **Nav** — a black rule along the top with links spaced inside a white field, active item shown
  by a coloured field behind it.
- **Cards** — are fields. No borders beyond the dividing rules, no shadows, no radius.
- **Forms** — inputs are white fields outlined by rules of the same weight as the layout.
- **Footer** — the last subdivision, often the one coloured field on the page.

## Do

- Keep field sizes unequal.
- Let white be the majority of every screen.
- Run rules edge to edge.
- Put text on white or black.

## Don't

- Don't round, rotate or shade anything.
- Don't use more than three coloured fields per viewport.
- Don't set small text on yellow or red.
- Don't add gutters between fields.

## How Weave verifies it

Deterministic checks sample painted colours against the palette, measure the proportion of the
viewport covered by coloured fields, assert zero radius and zero rotation across the DOM,
confirm rule thicknesses come from the token steps, compare adjacent field dimensions for
inequality, and check which fields carry small text. The judged check asks whether the result
is a composed subdivision or just coloured cards in a grid.

Reference pictures: `demo-design/de-stijl/`.
