---
slug: bauhaus
title: Bauhaus
aliases: [bauhaus revival, geometric modernism]
status: ready
summary: Primary colours and pure geometry — circle, square, triangle — assembled on a strict grid with sturdy grotesque type.
best_for: [cultural institutions, design studios, education, product marketing, event branding]
avoid_for: [luxury, anything needing softness or realism]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#F2EFE6" }
      - { name: ink, value: "#121212" }
      - { name: red, value: "#D62828" }
      - { name: blue, value: "#1D4ED8" }
      - { name: yellow, value: "#F4C300" }
      - { name: muted, value: "#6F6A5E" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Futura, Jost, Century Gothic, sans-serif", weights: [400, 700] }
    heading_tracking_em: 0
    heading_line_height: 1.0
    heading_case: lowercase
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: grid
    density: comfortable
    columns: 12
    gutter_px: 24
    max_width_px: 1280
    section_spacing_px: [48, 96, 144]
    composition: geometric blocks, diagonals allowed at 45 degrees
  shape:
    radius_px: 0
    circle_allowed: true
    border_px: 2
    shadow: none
  motion:
    duration_ms: 200
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [transform, opacity]
    intensity: mechanical
  imagery:
    treatment: [geometric composition, primary-colour blocks, constructed photography]
    illustration: circle-square-triangle assemblies
    icons: geometric, 2px, built from primitives
checks:
  - { id: bau.color.primaries, rule: "accent colours are limited to the red, blue and yellow tokens", kind: deterministic }
  - { id: bau.color.no-gradient, rule: "no gradients; colour is flat everywhere", kind: deterministic }
  - { id: bau.type.geometric-sans, rule: "one geometric sans family, weights 400 and 700 only", kind: deterministic }
  - { id: bau.type.lowercase-display, rule: "display headings are lowercase", kind: deterministic }
  - { id: bau.shape.primitives, rule: "decorative elements are circles, squares or triangles; no organic shapes", kind: deterministic }
  - { id: bau.shape.square-corners, rule: "rectangular elements have 0px radius; circles are fully round", kind: deterministic }
  - { id: bau.layout.grid-snap, rule: "blocks align to the 12-column grid", kind: deterministic }
  - { id: bau.layout.angles, rule: "rotations are 0, 45 or 90 degrees only", kind: deterministic }
  - { id: bau.feel.composition, rule: "the page reads as a constructed geometric composition, not decorated boxes", kind: judged }
---

# Bauhaus

## The look in one paragraph

Form follows function, rendered in primary colours and three shapes. Big flat blocks of red,
blue and yellow sit on a warm off-white ground, arranged on a visible grid, with a geometric
sans set lowercase. Diagonals appear at 45°, circles are true circles, and nothing is softened
or shaded.

## Layout

- 12-column grid, 24px gutters, 1280px. Blocks occupy whole column spans, never arbitrary widths.
- Compose with weight: a large colour block balanced by a smaller one and a field of empty ground.
- Diagonals and rotations are permitted at 45° and 90°, which keeps the geometry honest.

## Typography

- One geometric sans (Futura, Jost), regular and bold only.
- Display headings lowercase, `1.0` line height, no tracking adjustment — the letterforms are
  the design.
- Body 17px at `1.55`. Labels may be uppercase with wide tracking for contrast.

## Colour

Off-white ground, near-black ink, and the three primaries used flat and at full strength. Two
primaries per screen is usually right; all three at once is a statement, not a default. No
tints, no gradients, no shading.

## Surface and depth

Completely flat. Overlap communicates depth: a yellow circle passing behind a black rule, a
red square clipping a photo. Borders are 2px ink when needed.

## Motion

Mechanical: 200ms, linear-ish easing, rotations and translations that respect the same 45°
geometry. Elements move like parts of a machine, not like living things.

## Imagery

Constructed compositions rather than atmospheric photography: shapes assembled into figures,
duotone or hard-cropped photos placed inside geometric masks.

## Components

- **Buttons** — square or pill-from-a-circle, flat primary fill, bold lowercase label.
- **Nav** — a single ink rule with lowercase links, one primary block marking the active item.
- **Cards** — flat colour blocks; the shape is the container, with no border or shadow.
- **Forms** — 2px ink boxes, square corners, primary fill on the submit control.
- **Section markers** — a circle, square or triangle used consistently per section type.

## Do

- Build decoration from the three primitives only.
- Keep colour flat and full strength.
- Let a big empty ground carry the composition.
- Align every block to the grid.

## Don't

- Don't tint, shade or gradient the primaries.
- Don't introduce organic or blobby shapes.
- Don't rotate at arbitrary angles.
- Don't mix in a second typeface.

## How Weave verifies it

Deterministic checks sample painted colours against the primary tokens, look for gradient
declarations, read the font stack and weights, confirm rectangular elements have zero radius
while decorative circles are fully round, check rotation transforms are multiples of 45°, and
test block alignment against the grid. The judged check asks whether the result is a composed
geometric arrangement or ordinary boxes wearing primary colours.

Reference pictures: `demo-design/bauhaus/`.
