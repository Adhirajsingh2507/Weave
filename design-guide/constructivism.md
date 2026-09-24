---
slug: constructivism
title: Constructivism
aliases: [russian constructivism, agitprop style]
status: ready
summary: Propaganda-poster energy — red and black on off-white, hard diagonals, photomontage and type that marches across the page.
best_for: [manifestos, activism, events, music, editorial campaigns, bold product launches]
avoid_for: [calm consumer products, luxury, anything requiring political neutrality]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: bone, value: "#EFEAE0" }
      - { name: black, value: "#111111" }
      - { name: red, value: "#CE1126" }
      - { name: grey, value: "#8B8B85" }
      - { name: ochre, value: "#D8A22A" }
  typography:
    scale: display
    families:
      - { role: display, family: "Druk, Alternate Gothic, Oswald, sans-serif", weights: [700] }
      - { role: sans, family: "Inter, Helvetica Neue, sans-serif", weights: [400, 700] }
    heading_tracking_em: 0.01
    heading_case: uppercase
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.5
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1360
    section_spacing_px: [32, 64, 96]
    composition: diagonal axes at 15 to 30 degrees, strong bars and wedges
  shape:
    radius_px: 0
    border_px: 4
    shadow: none
  motion:
    duration_ms: 220
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    properties: [transform, clip-path]
    intensity: forceful
  imagery:
    treatment: [photomontage, duotone red and black, hard cut-outs, halftone]
    illustration: geometric wedges, arrows, megaphones
    icons: heavy geometric, filled
checks:
  - { id: constr.color.duotone, rule: "palette is limited to bone, black, red plus at most one secondary", kind: deterministic }
  - { id: constr.layout.diagonal, rule: "at least one major element is rotated between 15 and 30 degrees", kind: deterministic }
  - { id: constr.type.uppercase-condensed, rule: "display headings are uppercase in a condensed face at 0.95 line height", kind: deterministic }
  - { id: constr.shape.bars, rule: "heavy bars or wedges are used as structural elements, 4px or thicker", kind: deterministic }
  - { id: constr.image.duotone, rule: "photography is duotone or halftone, not full colour", kind: deterministic }
  - { id: constr.shape.no-radius, rule: "every border-radius is 0px", kind: deterministic }
  - { id: constr.layout.no-overflow, rule: "rotated elements do not cause horizontal scrolling at 360px", kind: deterministic }
  - { id: constr.feel.force, rule: "the composition reads as dynamic and purposeful, with a clear diagonal axis", kind: judged }
---

# Constructivism

## The look in one paragraph

Type and image assembled like engineering: heavy condensed uppercase running along diagonals,
red and black bars cutting across an off-white ground, photomontage figures halftoned and
hard-cropped. Every element points somewhere. Nothing is decorative and everything is loud.

## Layout

- Wide (1360px), dense, organised around one dominant diagonal axis of 15–30°.
- Bars and wedges divide the page and carry text along their angle.
- Elements overlap: a red bar crossing a photograph, a headline running over a wedge.
- On mobile the diagonal flattens toward 10–15° so nothing overflows the viewport.

## Typography

- A condensed display face, uppercase, tight at `0.95` line height, often rotated with its bar.
- A plain sans for body copy, kept horizontal and readable.
- Headlines are allowed to be enormous and to break across lines mid-word when the composition
  calls for it.

## Colour

Bone ground, black structure, red as the active force. One secondary (ochre or grey) at most.
Red is never decorative — it marks the subject, the action, or the direction.

## Surface and depth

Flat. Depth comes from overlap and scale. Borders are thick (4px+) and read as beams rather
than outlines.

## Motion

Forceful: elements slide in along the diagonal axis at 220ms with a decisive ease-out, or are
revealed by an angled `clip-path` wipe. Motion always follows the composition's axis.

## Imagery

Photomontage: cut-out figures, machinery, crowds, halftoned and printed in red/black duotone.
Photographs are cropped hard and often rotated with the composition.

## Components

- **Buttons** — heavy rectangles, red fill or black outline, uppercase condensed label, sometimes
  angled.
- **Nav** — a black bar across the top with uppercase links; the active item is a red block.
- **Cards** — angled panels with thick borders and a duotone image.
- **Forms** — black-bordered rectangles, red submit, uppercase labels.
- **Dividers** — thick angled bars rather than rules.

## Do

- Commit to one diagonal axis and repeat it.
- Keep body copy horizontal and readable.
- Use halftone or duotone for every photograph.
- Let the headline dominate the first screen.

## Don't

- Don't use full-colour photography.
- Don't round corners or soften edges.
- Don't let rotation cause horizontal scroll.
- Don't scatter multiple conflicting diagonals.

## How Weave verifies it

Deterministic checks sample painted colours against the restricted palette, read rotation
transforms to confirm a dominant diagonal within range, check heading case, family width class
and line height, detect thick bar elements, inspect loaded images for duotone/halftone
characteristics, assert zero radii, and test 360px width for overflow. The judged check asks
whether the composition reads as a purposeful constructed axis or as randomly tilted boxes.

Reference pictures: `demo-design/constructivism/`.
