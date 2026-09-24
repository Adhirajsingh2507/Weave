---
slug: industrial
title: Industrial
aliases: [factory style, utilitarian, warehouse]
status: ready
summary: Built for use, not for looking at — concrete and steel, stencil labels, hazard accents and structure left exposed.
best_for: [manufacturing and logistics, construction, workwear and tools, developer infrastructure, breweries]
avoid_for: [luxury, wellness, children's products, anything soft]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: concrete, value: "#2E2F31" }
      - { name: concrete-light, value: "#45474A" }
      - { name: steel, value: "#8A8F95" }
      - { name: bone, value: "#E4E2DD" }
      - { name: safety-orange, value: "#F05A22" }
      - { name: hazard-yellow, value: "#F2C000" }
      - { name: rust, value: "#8C4A2F" }
  typography:
    scale: display
    families:
      - { role: display, family: "Archivo, Roboto Condensed, Oswald, sans-serif", weights: [600, 800] }
      - { role: mono, family: "IBM Plex Mono, ui-monospace, monospace", weights: [400, 600] }
    heading_tracking_em: 0.02
    heading_case: uppercase
    heading_line_height: 1.0
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1400
    section_spacing_px: [32, 64, 96]
    structure: exposed grid lines, stencil section numbers, hazard stripe dividers
  shape:
    radius_px: 0
    border_px: 2
    shadow: none
  motion:
    duration_ms: 180
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [transform, opacity]
    intensity: utilitarian
  imagery:
    treatment: [concrete and metal textures, factory photography, high contrast, cool light]
    illustration: technical diagrams, stencil shapes
    icons: solid, heavy, stencil-cut
checks:
  - { id: ind.texture.concrete, rule: "concrete or brushed-metal texture appears on grounds or panels", kind: deterministic }
  - { id: ind.type.condensed-caps, rule: "headings are uppercase condensed; labels use mono", kind: deterministic }
  - { id: ind.color.safety, rule: "safety orange or hazard yellow is used only for actions, warnings and markers", kind: deterministic }
  - { id: ind.structure.exposed, rule: "grid lines, section numbers or rules are visibly exposed as structure", kind: deterministic }
  - { id: ind.shape.square, rule: "every border-radius is 0px", kind: deterministic }
  - { id: ind.a11y.contrast, rule: "bone on concrete and dark text on safety orange meet 4.5:1", kind: deterministic }
  - { id: ind.hazard.meaningful, rule: "hazard stripes mark warnings or boundaries, not decoration", kind: deterministic }
  - { id: ind.feel.utility, rule: "the page reads as built for work rather than styled to look industrial", kind: judged }
---

# Industrial

## The look in one paragraph

A workspace, not a showroom: concrete greys, brushed steel, stencilled uppercase labels,
exposed grid lines and section numbers, and safety orange reserved for things that actually
need attention. Nothing is rounded, nothing is decorative, and everything looks like it can
take a knock.

## Layout

- 12 columns at 1400px, compact, with the grid visibly exposed — hairlines between columns,
  numbered sections, ruled edges.
- Hazard stripes divide major sections or mark warnings.
- Content sits in square panels with 2px borders and generous internal padding.

## Typography

- A condensed grotesque, uppercase, at `1.0` line height for headings — stencil-adjacent, built
  for signage.
- Mono for labels, specifications, part numbers and data.
- Body at 16px; prose blocks are short and functional.

## Colour

Concrete greys and steel, bone for text, with safety orange and hazard yellow as functional
accents only. Rust appears as a texture accent. Nothing decorative is coloured.

## Surface and depth

Flat and square: 2px borders, no radius, no shadows. Depth is texture and rule weight.

## Motion

Utilitarian: 180ms, direct and linear, no easing flourishes. Things move because they need to.

## Imagery

Factory and workshop photography under cool light, concrete and metal textures, technical
diagrams, stencilled markings.

## Components

- **Panel** — square, 2px border, stencil number in the corner, mono label.
- **Buttons** — square, high-contrast, safety orange for primary actions.
- **Nav** — a concrete bar with uppercase condensed links and a hairline underneath.
- **Spec table** — mono rows with ruled dividers and unit columns.
- **Hazard divider** — diagonal stripe band marking a warning or a section change.

## Do

- Expose the grid and number the sections.
- Reserve safety colours for real meaning.
- Keep corners square everywhere.
- Label with mono, like equipment.

## Don't

- Don't use hazard stripes as decoration.
- Don't round or soften anything.
- Don't use warm ambient lighting in photography.
- Don't let bone-on-concrete contrast drift below the floor.

## How Weave verifies it

Deterministic checks detect concrete or metal texture layers, read heading case and font width
class plus mono usage for labels, locate safety-colour usage and confirm each instance is an
action or warning, look for exposed grid or numbering elements, assert zero radii, and measure
contrast. The judged check asks whether it reads as built for work.

Reference pictures: `demo-design/industrial/`.
