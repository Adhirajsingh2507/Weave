---
slug: axonometric-cad
title: Axonometric / Technical CAD
aliases: [cad drawing, wireframe axonometric, technical 3d]
status: ready
summary: Precision drafting in three dimensions — wireframe geometry, construction lines, measured annotation and a monochrome sheet.
best_for: [hardware and robotics, architecture, industrial design, engineering docs, product teardown pages]
avoid_for: [consumer lifestyle, fashion, emotional storytelling]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: sheet, value: "#F7F7F4" }
      - { name: line, value: "#1A1A18" }
      - { name: construction, value: "#9A9A94" }
      - { name: hidden, value: "#C2C2BB" }
      - { name: highlight, value: "#0F62FE" }
      - { name: annotate, value: "#B03A1F" }
  typography:
    scale: default
    families:
      - { role: mono, family: "IBM Plex Mono, ui-monospace, monospace", weights: [400, 600] }
      - { role: sans, family: "Inter, Roboto Condensed, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.05
    heading_case: uppercase
    heading_line_height: 1.25
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1400
    section_spacing_px: [32, 64, 96]
    projection: axonometric, consistent axis angles across all drawings
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [stroke-dashoffset, transform, opacity]
    intensity: assembly
  imagery:
    treatment: [wireframe and hidden-line drawings, exploded assemblies, orthographic views]
    illustration: CAD-style geometry with construction lines
    icons: 1px technical, axis-aligned
checks:
  - { id: cad.projection.consistent, rule: "all drawings share the same axonometric axis angles", kind: deterministic }
  - { id: cad.line.hierarchy, rule: "line types are distinguished: solid for visible, dashed for hidden, thin for construction", kind: deterministic }
  - { id: cad.annotation.measured, rule: "drawings carry dimensions, part numbers or callouts in mono type", kind: deterministic }
  - { id: cad.palette.monochrome, rule: "drawings are monochrome apart from one highlight and one annotation colour", kind: deterministic }
  - { id: cad.explode.axis, rule: "exploded views separate parts along the projection axes, not arbitrary directions", kind: deterministic }
  - { id: cad.a11y.figure-desc, rule: "technical figures carry text descriptions of what they show", kind: deterministic }
  - { id: cad.motion.assembly, rule: "animation assembles or explodes along the axes and stops under prefers-reduced-motion", kind: deterministic }
  - { id: cad.feel.precision, rule: "drawings read as measured engineering output rather than stylised 3D illustration", kind: judged }
---

# Axonometric / Technical CAD

## The look in one paragraph

A drawing produced by an engineer rather than an illustrator: wireframe geometry projected
along consistent axes, hidden edges dashed, construction lines left visible, parts numbered and
dimensioned, all on a pale sheet. Where the isometric style makes friendly little worlds, this
one looks like it came out of a CAD package on purpose.

## Layout

- 12 columns at 1400px, compact and sheet-like, with 1px borders and corner registration marks.
- Drawings dominate; text sits beside them in narrow annotated columns.
- Multiple views of the same object — plan, elevation, axonometric — can share a section.

## Typography

- Mono for every annotation, dimension, part number and label, uppercase with open tracking.
- A condensed sans for prose at 16px.
- Numbering systems (`01`, `A-2`, `REV 3`) are part of the visual language.

## Colour

Near-white sheet, black line work, grey construction and hidden lines, one blue highlight for
the part under discussion, one red for annotations. No fills.

## Surface and depth

Depth is geometric, produced by the projection and by line hierarchy. No shading, no fills, no
shadows. Hidden edges are dashed rather than removed, which is what makes it read as CAD.

## Motion

Assembly: 600ms, parts sliding apart along the projection axes into an exploded view, lines
drawing themselves. The motion demonstrates construction, never decoration.

## Imagery

Wireframe and hidden-line drawings, exploded assemblies, orthographic view sets, section
hatching. Photographs, if needed, are placed in a bordered inset labelled as a reference.

## Components

- **Drawing figure** — SVG geometry with construction lines and dimensions.
- **Part list** — a mono table of numbered parts keyed to the drawing.
- **Callout** — a numbered circle with a leader line.
- **View switcher** — plan / elevation / axonometric toggle with mono labels.
- **Buttons** — 1px outlined rectangles with registration ticks.

## Do

- Keep one set of axis angles across every drawing.
- Distinguish visible, hidden and construction lines.
- Number and dimension parts.
- Explode along the axes.

## Don't

- Don't shade or fill geometry.
- Don't mix projection angles.
- Don't use proportional type for annotation.
- Don't leave figures without descriptions.

## How Weave verifies it

Deterministic checks measure SVG path angles for axis consistency across drawings, read
stroke-dasharray and widths to confirm the line hierarchy, look for dimension and callout groups
in mono type, sample colours for monochrome plus two accents, analyse exploded-view offsets for
axis alignment, check figure descriptions, and verify motion behaviour. The judged check asks
whether drawings read as engineering output.

Reference pictures: `demo-design/axonometric-cad/`.
