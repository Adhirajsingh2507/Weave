---
slug: japanese-minimalism
title: Japanese Minimalism
aliases: [ma, wabi-sabi web, zen minimal]
status: ready
summary: Emptiness as a material — asymmetric balance, a single ink accent, vertical rhythm, and space that is the composition.
best_for: [craft and artisan brands, tea and food, architecture, galleries, meditation and wellness]
avoid_for: [dense commerce, dashboards, anything competing on information volume]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: washi, value: "#F4F1EA" }
      - { name: sumi, value: "#1C1B19" }
      - { name: stone, value: "#8D877C" }
      - { name: vermilion, value: "#B03A2E" }
      - { name: moss, value: "#6B7355" }
      - { name: hairline, value: "#DDD8CD" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Noto Sans JP, Inter, system-ui, sans-serif", weights: [300, 400] }
      - { role: serif, family: "Noto Serif JP, Source Serif 4, serif", weights: [400] }
    heading_tracking_em: 0.02
    heading_line_height: 1.5
    body_size_px: 16
    body_line_height: 1.9
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1000
    section_spacing_px: [96, 160, 240]
    ma_ratio: "at least 60% of each viewport left empty"
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)"
    properties: [opacity]
    intensity: still
  imagery:
    treatment: [single subject, natural material, soft shadow, generous empty frame]
    illustration: brush mark, used once
    icons: none, or a single hairline mark
checks:
  - { id: jmin.layout.ma, rule: "at least 60% of each viewport is unpainted background", kind: deterministic }
  - { id: jmin.layout.asymmetry, rule: "primary content is off-centre; no fully centred hero block", kind: deterministic }
  - { id: jmin.type.line-height, rule: "body line height is at least 1.8", kind: deterministic }
  - { id: jmin.type.light-weights, rule: "weights limited to 300 and 400; no bold display type", kind: deterministic }
  - { id: jmin.color.count, rule: "at most 3 colours painted per viewport, accent used once", kind: deterministic }
  - { id: jmin.shape.flat, rule: "no radius, no shadow, no gradient", kind: deterministic }
  - { id: jmin.motion.slow, rule: "transitions are 350ms or longer and opacity-only", kind: deterministic }
  - { id: jmin.image.single-subject, rule: "hero imagery shows one subject with generous empty space in frame", kind: judged }
  - { id: jmin.feel.stillness, rule: "the page feels still and deliberate, with emptiness reading as intentional", kind: judged }
---

# Japanese Minimalism

## The look in one paragraph

Space is the subject. Content occupies a small, carefully placed part of the screen and the
rest is left deliberately empty — *ma*, the interval that gives the rest meaning. Washi-toned
ground, sumi ink text set light and airy, one vermilion mark per page, hairlines instead of
boxes, and motion slow enough to feel like breathing.

## Layout

- Narrow content column (1000px max) placed off-centre, with the emptiness weighted to one side.
- Enormous vertical spacing: 96–240px. Sections are separated by space and a single hairline,
  never by a background change.
- Vertical rhythm matters more than horizontal alignment; a short vertical rule or vertically
  set label is in character.

## Typography

- Light and regular weights only. Headings are not much larger than body text — hierarchy comes
  from position and space, not scale.
- Slightly open tracking (`0.02em`) on headings, and a very generous `1.9` body line height.
- If Japanese text appears, use the Noto JP family for both scripts so the two align in weight.

## Colour

Washi off-white, sumi ink, a warm stone grey, and one accent — vermilion or moss — appearing
exactly once per page, as a mark rather than a fill.

## Surface and depth

None. No cards, no radius, no shadow, no gradient. Separation is a single hairline or, more
often, simply distance.

## Motion

Slow and quiet: 400ms opacity fades. Nothing slides, scales or springs. At most, an image
settles into view as the page is scrolled.

## Imagery

One subject, photographed with soft natural light against a plain ground, with plenty of empty
space inside the frame itself. Materials over products: clay, wood, paper, water. A single
brush mark may be used as the page's only ornament.

## Components

- **Buttons** — text with a hairline underneath, or a 1px outlined rectangle with wide padding.
- **Nav** — a few small links in one corner, or a vertical list along an edge.
- **Cards** — don't exist. A heading, a line of text, and space.
- **Forms** — hairline-bottom inputs, labels in stone grey, vermilion only for errors.
- **Footer** — one hairline and a small block of text placed off-centre.

## Do

- Leave more space than feels comfortable.
- Place content off-centre with intent.
- Use the accent exactly once.
- Let images contain their own emptiness.

## Don't

- Don't centre everything symmetrically.
- Don't add borders, cards or shadows.
- Don't tighten line height to fit more in.
- Don't use bold weights for emphasis; use space.

## How Weave verifies it

Deterministic checks measure unpainted viewport proportion, test whether the main content block
is off-centre, read line heights and font weights, count painted colours and accent occurrences,
assert no radius/shadow/gradient, and read transition durations and properties. Two judged
checks look at the hero image's use of empty space and whether the page reads as intentional
stillness rather than missing content.

Reference pictures: `demo-design/japanese-minimalism/`.
