---
slug: art-nouveau
title: Art Nouveau
aliases: [jugendstil, mucha style, whiplash curve]
status: ready
summary: Nature drawn as line — whiplash curves, botanical arches, muted earth colours and hand-lettered organic type.
best_for: [botanical and herbal brands, perfume, galleries and theatres, boutique hotels, artisan food]
avoid_for: [tech products, dashboards, anything geometric or corporate]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: parchment, value: "#F1E9D8" }
      - { name: ink, value: "#2B2A20" }
      - { name: sage, value: "#8C9A6B" }
      - { name: terracotta, value: "#B4633F" }
      - { name: teal, value: "#39685F" }
      - { name: gold, value: "#BE9C46" }
      - { name: plum, value: "#6A3B52" }
  typography:
    scale: display
    families:
      - { role: display, family: "Cormorant Infant, Marcellus, Bellefair, serif", weights: [400, 600] }
      - { role: serif, family: "EB Garamond, Georgia, serif", weights: [400] }
    heading_tracking_em: 0.03
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.7
  layout:
    system: centered
    density: comfortable
    max_width_px: 1120
    section_spacing_px: [64, 104, 148]
    composition: arched frames, botanical borders, flowing dividers
  shape:
    radius_px: 0
    arch_radius: "999px 999px 0 0"
    border_px: 2
    shadow: none
  motion:
    duration_ms: 480
    easing: "cubic-bezier(0.37, 0, 0.35, 1)"
    properties: [opacity, transform, stroke-dashoffset]
    intensity: flowing
  imagery:
    treatment: [botanical illustration, flowing hair and drapery, stained glass, lithograph texture]
    illustration: whiplash line work, floral borders, peacock and lily motifs
    icons: thin flowing line, asymmetric
checks:
  - { id: nouveau.line.whiplash, rule: "flowing curved line ornament appears as borders or dividers, drawn in SVG", kind: deterministic }
  - { id: nouveau.shape.arch, rule: "imagery and key sections sit inside arched frames", kind: deterministic }
  - { id: nouveau.color.earth-muted, rule: "palette is muted earth and botanical tones; no bright or cool greys", kind: deterministic }
  - { id: nouveau.type.serif-tracked, rule: "display type is a humanist serif with open tracking, sentence or title case", kind: deterministic }
  - { id: nouveau.motif.botanical, rule: "botanical motifs (stems, leaves, florals) recur across at least 2 sections", kind: deterministic }
  - { id: nouveau.a11y.decorative, rule: "ornamental SVG is marked decorative and never conveys information alone", kind: deterministic }
  - { id: nouveau.a11y.contrast, rule: "ink on parchment and on the muted fills meets 4.5:1", kind: deterministic }
  - { id: nouveau.feel.organic, rule: "curves read as drawn from nature rather than as generic rounded corners", kind: judged }
---

# Art Nouveau

## The look in one paragraph

Everything is a line taken from a plant: stems curling around an arched frame, hair and drapery
flowing into the border, a peacock feather forming a divider. Muted parchment and botanical
colours, a humanist serif with open tracking, and no straight structural edges — the ornament
is the layout.

## Layout

- Centred at 1120px with arched frames for imagery — a rectangle with a fully rounded top.
- Borders are drawn: SVG stems and florals running along the edges of a section rather than a
  CSS border.
- Dividers flow: a curved line with a leaf or bud at its terminus.

## Typography

- A humanist serif with slightly flared strokes, set with open tracking (`0.03em`) and title
  case. Hand-lettered display is the historical reference; a well-chosen serif is the practical
  version.
- Body at 17px, `1.7` line height, in an old-style serif.
- Initial capitals may be enlarged and wrapped in a botanical flourish.

## Colour

Parchment ground, dark warm ink, and a muted botanical palette: sage, terracotta, teal, gold,
plum. All slightly greyed, as though printed by lithograph.

## Surface and depth

Flat lithograph. No shadows, no radius on containers except the arch. Depth is line weight and
overlap: ornament passing in front of and behind a frame.

## Motion

Flowing: 480ms, SVG lines drawing themselves via `stroke-dashoffset`, ornament fading in as
sections arrive. Motion follows the direction of the curve.

## Imagery

Botanical illustration, flowing figures and drapery, stained glass, lithographic texture.
Photography is tinted and textured to sit beside the illustration.

## Components

- **Arched frame** — the primary container for imagery, with ornament growing over its edge.
- **Buttons** — 2px ink or gold outline with a slight curve, title-case serif label.
- **Nav** — serif links separated by a small leaf glyph, with a flowing rule beneath.
- **Cards** — parchment with a drawn border on two sides rather than a full box.
- **Dividers** — an SVG whiplash curve with a floral terminus.

## Do

- Draw ornament as SVG so it can animate and scale.
- Use arches for imagery.
- Let ornament cross frame boundaries.
- Keep colour muted and botanical.

## Don't

- Don't use geometric or grotesque type.
- Don't add drop shadows or rounded rectangles.
- Don't let ornament carry meaning without text.
- Don't use bright, cool or neon colour.

## How Weave verifies it

Deterministic checks look for SVG path ornament with curved geometry, detect arch-shaped framing,
sample the palette for muted earth tones, read the type stack and tracking, count sections
containing botanical motifs, confirm decorative SVG carries `aria-hidden`, and measure contrast.
The judged check asks whether the curves read as drawn from nature.

Reference pictures: `demo-design/art-nouveau/`.
