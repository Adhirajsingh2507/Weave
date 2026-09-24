---
slug: graffiti
title: Graffiti
aliases: [street art, spray paint, wildstyle]
status: ready
summary: Spray-painted wall energy — overlapping tags, drips and overspray, bold outlined letterforms and concrete underneath.
best_for: [streetwear, music, skate and sport, youth campaigns, urban events]
avoid_for: [enterprise, finance, healthcare, luxury]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: concrete, value: "#2A2A28" }
      - { name: wall, value: "#3A3936" }
      - { name: spray-pink, value: "#FF2D78" }
      - { name: spray-cyan, value: "#22D3FF" }
      - { name: spray-yellow, value: "#FFE03D" }
      - { name: spray-green, value: "#3DFF88" }
      - { name: ink, value: "#0C0C0B" }
      - { name: chalk, value: "#F2F0EA" }
  typography:
    scale: display
    families:
      - { role: display, family: "Permanent Marker, Bangers, Anton, sans-serif", weights: [400, 700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_case: uppercase
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1400
    section_spacing_px: [32, 64, 96]
    composition: layered tags, elements rotated 2-6 degrees, content overlapping
  shape:
    radius_px: 0
    border_px: 4
    border_style: hand-drawn outline
    shadow: "6px 6px 0 #0C0C0B"
  motion:
    duration_ms: 180
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [transform, opacity, clip-path]
    intensity: punchy
  imagery:
    treatment: [concrete and brick textures, spray overspray, drips, stencil cutouts, photos taped to walls]
    illustration: marker and spray lettering, stencils
    icons: hand-drawn, thick outline
checks:
  - { id: graf.texture.wall, rule: "a concrete, brick or plaster texture backs the page at 10-25% opacity", kind: deterministic }
  - { id: graf.effect.spray, rule: "spray edges, overspray or drip elements appear on at least 2 pieces", kind: deterministic }
  - { id: graf.type.outlined, rule: "display headings carry a thick ink outline, in the marker or brush display face", kind: deterministic }
  - { id: graf.layout.layered, rule: "elements overlap and are rotated between 2 and 6 degrees, varying per element", kind: deterministic }
  - { id: graf.color.sprays, rule: "at least 3 saturated spray colours appear against the concrete ground", kind: deterministic }
  - { id: graf.a11y.readable-body, rule: "body copy sits on a solid painted panel, not on wall texture", kind: deterministic }
  - { id: graf.a11y.contrast, rule: "spray colours used for text meet 4.5:1 over their actual background", kind: deterministic }
  - { id: graf.feel.wall, rule: "the page reads as a painted wall with layers of history, not stickers on flat colour", kind: judged }
---

# Graffiti

## The look in one paragraph

A wall that has been painted over many times: concrete texture showing through, a big outlined
piece in three spray colours, tags layered on top of older tags, drips running from the letters
and overspray haloing the edges. Loud, layered and physical.

## Layout

- Wide and compact at 1400px, with elements overlapping and rotated 2–6° like pieces sprayed at
  different times.
- Depth is chronological: faded older tags underneath, fresh bright work on top.
- Content panels are painted rectangles — a solid block of colour rolled onto the wall — which
  is where text lives.

## Typography

- A marker or brush display face, uppercase, with a thick ink outline and often a second offset
  outline in a contrasting spray colour.
- Body copy in a plain sans on a painted panel at 17px.
- Tag-style signatures may appear as decorative SVG with alternative text.

## Colour

Concrete and wall greys as the ground, with saturated spray pink, cyan, yellow and green.
Ink black for outlines, chalk white for highlights. The ground stays neutral so the sprays
scream.

## Surface and depth

No radius, no soft shadows. Hard 6px ink offsets under painted panels, 4px hand-drawn outlines,
and spray-edge masks so shapes don't end in perfect straight lines.

## Motion

Punchy: 180ms, pieces snapping into place, `clip-path` reveals that look like a spray pass,
hover lifting a tag slightly. Ambient motion stops under reduced-motion.

## Imagery

Wall and concrete textures, spray overspray and drips, stencil cut-outs, photographs taped or
pasted onto the wall with visible edges.

## Components

- **Painted panel** — a solid rolled-paint rectangle holding text, slightly rotated.
- **Piece** — the hero lettering: outlined, filled, dripping, with overspray behind it.
- **Buttons** — outlined blocks with hard ink shadows and marker labels; clean rectangular hit
  areas behind the rough art.
- **Tag** — small decorative signature, rotated, `aria-hidden`.
- **Nav** — a painted strip with marker links and a spray-mark active state.

## Do

- Layer old and new work to suggest history.
- Put text on painted panels.
- Vary rotation per element.
- Let spray edges and drips break straight lines.

## Don't

- Don't set body copy directly on wall texture.
- Don't use uniform rotation or aligned rows.
- Don't rely on decorative tags to convey information.
- Don't use soft blurred shadows.

## How Weave verifies it

Deterministic checks detect the wall texture layer and its opacity, look for spray-edge masks
and drip elements, read heading outline treatments and font class, measure per-element rotation
variance and overlap, count saturated spray colours, confirm body copy sits on solid panels, and
measure contrast over real backgrounds. The judged check asks whether it reads as a painted wall.

Reference pictures: `demo-design/graffiti/`.
