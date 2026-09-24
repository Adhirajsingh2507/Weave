---
slug: collage-art
title: Collage Art
aliases: [cut and paste, mixed cutout, scrapbook collage]
status: ready
summary: Cut-out fragments layered by hand — torn magazine edges, mismatched scales, visible tape and a composition built from other people's images.
best_for: [music and culture, fashion editorials, campaigns, zines, arts organisations]
avoid_for: [enterprise software, data products, anything needing a calm reading experience]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#EFE9DF" }
      - { name: ink, value: "#141210" }
      - { name: kraft, value: "#C8A87C" }
      - { name: risoblue, value: "#2B4FD8" }
      - { name: risopink, value: "#FF48A0" }
      - { name: highlighter, value: "#D8FF3D" }
      - { name: tape, value: "#D9CFA8" }
  typography:
    scale: display
    families:
      - { role: display, family: "Anton, Archivo Black, Impact, sans-serif", weights: [400, 700] }
      - { role: serif, family: "Times New Roman, Georgia, serif", weights: [400, 700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1360
    section_spacing_px: [24, 56, 88]
    composition: overlapping cut-outs at varied scales, rotations 2-8 degrees
  shape:
    radius_px: 0
    border_px: 0
    border_style: torn and scissor-cut edges via masks
    shadow: "0 8px 18px rgba(20, 18, 16, 0.22)"
  motion:
    duration_ms: 200
    easing: "steps(2, end)"
    properties: [transform, opacity]
    intensity: snappy
  imagery:
    treatment: [magazine cut-outs, photocopied fragments, halftone textures, tape and staples]
    illustration: mixed sources, hand-cut edges
    icons: cut-out shapes, inconsistent by design
checks:
  - { id: coll.edges.cut, rule: "at least 3 images use torn or scissor-cut masks rather than rectangular crops", kind: deterministic }
  - { id: coll.scale.mismatch, rule: "fragment scales vary by at least 3x within a composition", kind: deterministic }
  - { id: coll.rotation.varied, rule: "pasted elements are rotated 2-8 degrees with varying values", kind: deterministic }
  - { id: coll.layer.depth, rule: "fragments overlap with visible shadows, creating a stacked paper effect", kind: deterministic }
  - { id: coll.a11y.readable-blocks, rule: "body copy sits on a clean paper fragment with 4.5:1 contrast", kind: deterministic }
  - { id: coll.a11y.image-alt, rule: "meaningful cut-outs carry alt text; decorative scraps are hidden", kind: deterministic }
  - { id: coll.type.mixed-roles, rule: "headline type mixes at least 2 roles, cut-out style", kind: deterministic }
  - { id: coll.feel.handmade, rule: "the composition reads as physically cut and pasted rather than digitally arranged", kind: judged }
---

# Collage Art

## The look in one paragraph

Images cut out with scissors and stuck down at angles: a face at one scale, a hand at another,
a strip of magazine text across the middle, tape holding a corner, everything overlapping and
casting small shadows. Type is cut from different sources too — a fat display word next to a
newspaper serif.

## Layout

- Wide and compact at 1360px, asymmetric, with fragments overlapping section boundaries.
- Scale mismatch is the engine: a huge cut-out beside a tiny one is what makes it a collage
  rather than a grid of photos.
- Rotations of 2–8°, varying per element, with tape strips and staples anchoring corners.

## Typography

- Headlines are assembled: a heavy display word, a serif word, maybe a typewritten fragment.
- Body copy retreats to a plain sans on a clean fragment of paper.
- Words may be cut mid-letter by a torn edge, but never so far that they can't be read.

## Colour

Paper and kraft grounds with riso blue, riso pink and highlighter yellow as printed accents.
Cut-outs keep their original colour; the accents are the "printing" laid over them.

## Surface and depth

Real stacking: each fragment has a small soft shadow so it reads as paper on paper. No radii,
no borders — edges are torn or scissor-cut masks.

## Motion

Snappy and stepped: 200ms, fragments popping in as though dropped onto the page, slight
rotation on hover. Stops under reduced-motion.

## Imagery

Magazine and archive cut-outs, photocopied fragments, halftone textures, hands, eyes,
architectural details, torn text strips. Sources should look genuinely different from one
another — a collage of one photoshoot isn't a collage.

## Components

- **Fragment** — the base element: a masked image with a shadow and a rotation.
- **Paper block** — a clean fragment holding body copy.
- **Tape strip** — a translucent band across a corner, decorative and hidden from screen readers.
- **Buttons** — cut-out shapes with a clean rectangular hit area behind them.
- **Nav** — a torn strip across the top with mixed-role links.

## Do

- Vary scale dramatically between fragments.
- Give every fragment a small shadow.
- Keep one clean paper block per section for reading.
- Mix genuinely different image sources.

## Don't

- Don't crop everything to rectangles.
- Don't use one uniform rotation.
- Don't set body copy across a busy cut-out.
- Don't leave meaningful imagery without alt text.

## How Weave verifies it

Deterministic checks look for mask or clip-path usage on images, compare rendered fragment sizes
for scale variance, read rotation transforms for variety, detect overlap and shadow layering,
measure contrast where body copy sits, check alt text and decorative hiding, and count type roles
in heading blocks. The judged check asks whether it reads as physically assembled.

Reference pictures: `demo-design/collage-art/`.
