---
slug: deconstructivism
title: Deconstructivism
aliases: [deconstructiivism, fragmented design, post-structural layout]
status: ready
summary: A grid pulled apart — fragments, collisions, sliced type and layered planes that refuse to resolve into a tidy page.
best_for: [fashion, architecture studios, art direction portfolios, experimental editorial]
avoid_for: [ecommerce, documentation, forms, anything read in a hurry]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#F3F3F1" }
      - { name: ink, value: "#141414" }
      - { name: concrete, value: "#A8A79F" }
      - { name: signal, value: "#FF3B30" }
      - { name: steel, value: "#5B6B7A" }
  typography:
    scale: display
    families:
      - { role: display, family: "Helvetica Neue, Inter, Arial, sans-serif", weights: [400, 700] }
      - { role: mono, family: "ui-monospace, SFMono-Regular, monospace", weights: [400] }
    heading_tracking_em: -0.03
    heading_line_height: 0.9
    body_size_px: 16
    body_line_height: 1.5
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1600
    section_spacing_px: [0, 32, 96]
    composition: overlapping planes, fragments crossing section boundaries, deliberate collisions
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
    clip: angled clip-path fragments
  motion:
    duration_ms: 320
    easing: "cubic-bezier(0.65, 0, 0.35, 1)"
    properties: [transform, clip-path, opacity]
    intensity: unstable
  imagery:
    treatment: [sliced photography, fragments, repeated crops of one image]
    illustration: technical fragments, exploded diagrams
    icons: mono, fragmentary
checks:
  - { id: decon.layout.overlap, rule: "at least 3 elements overlap another element's bounds", kind: deterministic }
  - { id: decon.layout.fragment, rule: "at least one element uses clip-path to appear sliced", kind: deterministic }
  - { id: decon.type.collision, rule: "headline blocks overlap an image or another text block without reducing contrast below 4.5:1", kind: deterministic }
  - { id: decon.layout.no-overflow, rule: "no horizontal scrolling at 360px despite fragmentation", kind: deterministic }
  - { id: decon.a11y.dom-order, rule: "DOM order and focus order stay logical while visual order is disrupted", kind: deterministic }
  - { id: decon.shape.hard-edges, rule: "no rounded corners, no shadows, no soft blends", kind: deterministic }
  - { id: decon.color.restrained, rule: "at most 4 colours, with the signal colour used on fragments only", kind: deterministic }
  - { id: decon.feel.instability, rule: "the page reads as deliberately fragmented, with tension rather than randomness", kind: judged }
---

# Deconstructivism

## The look in one paragraph

The grid exists so it can be broken in front of you. Planes slide past each other, headlines
collide with images, blocks get sliced by angled clips and reassembled a few pixels out of
alignment. The result should feel unstable and controlled at the same time — like a building
whose structure is showing.

## Layout

- Very wide canvas, tight and overlapping. Sections bleed into each other, sometimes with no
  spacing at all.
- Every screen has at least one collision: text over image, plane over plane, fragment crossing
  a boundary.
- A hidden safe area keeps everything inside the viewport. Fragmentation never becomes overflow.
- Mobile keeps the overlaps but reduces their offsets, so the page stays usable.

## Typography

- One neutral grotesque doing all the work, plus a mono for technical fragments and captions.
- Headlines set very tight (`0.9` line height, `-0.03em`) and often split: one word overlapping
  an image, the next sitting a column away.
- Body copy stays in a clean uninterrupted block — the fragmentation is applied to display
  elements, not to reading text.

## Colour

Concrete neutrals with a single signal red used only on fragments, rules and markers. Steel
blue as a cool secondary. Colour stays restrained so the structural disorder reads clearly.

## Surface and depth

Hard edges only: no radius, no shadow, no blur. Depth is layering and clipping. Elements are
opaque, sliced by angled `clip-path`, and stacked in deliberate z-order.

## Motion

Unstable: 320ms, elements sliding along their fragment axis, clip paths opening, pieces
arriving slightly out of sync. Nothing settles into a symmetrical resting state.

## Imagery

One photograph, sliced and repeated at different crops and scales across a section. Technical
and architectural subjects suit it. Images are never given a frame.

## Components

- **Buttons** — plain rectangles, possibly clipped at one corner, high contrast, always ≥44px tall.
- **Nav** — fragmented across the top: wordmark at one edge, links offset and staggered, still
  reachable in one tab sequence.
- **Cards** — overlapping planes rather than contained boxes.
- **Forms** — conventional and clean; this is where the style stops. Inputs stay aligned and legible.
- **Section markers** — mono labels placed at odd angles or rotated 90° along an edge.

## Do

- Keep one clean reading block per section.
- Break alignment deliberately and repeatedly, not once.
- Keep the DOM and focus order sane.
- Use the signal colour only on fragments.

## Don't

- Don't fragment forms, tables or long text.
- Don't allow horizontal overflow.
- Don't soften anything with radius or shadow.
- Don't let overlapping text drop below the contrast floor.

## How Weave verifies it

Deterministic checks compute element bounding boxes to count overlaps, look for `clip-path`
usage, measure contrast where text overlaps imagery, test 360px for overflow, compare DOM
order against visual position to confirm focus order stays sane, and assert hard edges and a
restrained palette. The judged check asks whether the fragmentation reads as tension or as a
broken layout.

Reference pictures: `demo-design/deconstructivism/`.
