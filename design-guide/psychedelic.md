---
slug: psychedelic
title: Psychedelic
aliases: [acid rock poster, 60s psych, liquid light]
status: ready
summary: Sixties poster haze — melting hand-lettered type, vibrating complementary colours and swirling liquid-light patterns.
best_for: [music and festivals, art projects, merch, cannabis and wellness brands, event posters]
avoid_for: [enterprise, accessibility-sensitive audiences, information-dense sites]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: ground, value: "#1B0B2E" }
      - { name: magenta, value: "#FF2D95" }
      - { name: orange, value: "#FF7A00" }
      - { name: lime, value: "#B9FF2D" }
      - { name: cyan, value: "#00E5FF" }
      - { name: gold, value: "#FFC300" }
      - { name: foreground, value: "#FFF6E8" }
    gradients:
      - { name: liquid, value: "conic-gradient(from 210deg, #FF2D95, #FF7A00, #FFC300, #B9FF2D, #00E5FF, #FF2D95)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Rozha One, Bagel Fat One, Cooper Black, serif", weights: [400] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: compact
    max_width_px: 1080
    section_spacing_px: [48, 80, 120]
    composition: curved baselines, circular and arched text, poster-like symmetry
  shape:
    radius_px: 999
    border_px: 0
    shadow: none
  motion:
    duration_ms: 900
    easing: "cubic-bezier(0.45, 0, 0.55, 1)"
    properties: [transform, filter, background-position]
    intensity: undulating
  imagery:
    treatment: [liquid light blobs, kaleidoscope mirrors, solarised photos, halftone rainbows]
    illustration: hand-drawn flowing lettering and florals
    icons: hand-drawn, irregular
checks:
  - { id: psych.color.complementary, rule: "complementary hue pairs (magenta/lime, orange/cyan) appear together", kind: deterministic }
  - { id: psych.type.curved, rule: "at least one heading follows a curved or arched baseline", kind: deterministic }
  - { id: psych.pattern.liquid, rule: "a swirling conic or radial pattern is present as a background layer", kind: deterministic }
  - { id: psych.a11y.body-plain, rule: "body copy uses the plain sans on a solid panel, never over the swirl", kind: deterministic }
  - { id: psych.a11y.vibration, rule: "no body text uses saturated complementary colour pairs that vibrate; contrast still meets 4.5:1", kind: deterministic }
  - { id: psych.motion.slow, rule: "pattern motion is 800ms or slower and stops under prefers-reduced-motion", kind: deterministic }
  - { id: psych.a11y.no-flash, rule: "nothing flashes or strobes more than 3 times per second", kind: deterministic }
  - { id: psych.feel.poster, rule: "the hero reads like a 60s concert poster rather than a rainbow gradient page", kind: judged }
---

# Psychedelic

## The look in one paragraph

A 1967 concert poster: hand-lettered type melting along curved baselines, complementary colours
set against each other until they shimmer, liquid-light swirls behind everything, and dense
ornament filling every corner. Beautiful, overwhelming, and genuinely risky for readability —
which is why the body copy retreats to plain type on a solid panel.

## Layout

- Centred, poster-shaped, 1080px, dense. The hero is one composition rather than a row of
  elements.
- Text follows arcs and circles, filling the space around a central image.
- Reading sections are separated out completely: a solid panel, plain type, no swirl behind it.

## Typography

- A heavy flowing display face for the poster moments, warped along curves, tightly packed.
- A plain sans for all real content at 17px.
- Display type may be filled with the liquid gradient; body type never is.

## Colour

Deep purple ground with magenta, orange, lime, cyan and gold. The vibration between
complementary pairs is the effect — used in ornament and large type only, never in body copy.

## Surface and depth

No panels or shadows in the poster areas; everything is flat pattern and type. Reading sections
get a solid opaque panel, which is the one piece of structure in the style.

## Motion

Undulating: 900ms, the liquid background slowly morphing and rotating, gradients drifting
through the hue cycle. Strictly no strobing — nothing flashes more than three times a second —
and all of it stops under reduced-motion.

## Imagery

Liquid light shows, kaleidoscope mirroring, solarised photography, halftone rainbows, flowing
floral ornament.

## Components

- **Hero** — one poster composition: curved headline, central image, ornament filling the edges.
- **Buttons** — pill shaped, solid saturated fill with a high-contrast label, no gradient text.
- **Nav** — a simple bar with plain type; navigation stays legible while the page riots.
- **Reading panel** — solid, opaque, plain, with normal spacing.
- **Dividers** — flowing ornamental rules.

## Do

- Keep the swirl behind ornament and display type only.
- Give every reading section a solid panel.
- Use complementary pairs in big shapes, where vibration is pleasant.
- Keep motion slow and non-strobing.

## Don't

- Don't set body text in saturated complementary pairs.
- Don't put paragraphs over the liquid pattern.
- Don't flash or strobe.
- Don't warp interactive labels — buttons stay readable.

## How Weave verifies it

Deterministic checks sample the palette for complementary pairings, detect curved text paths,
find conic/radial swirl layers, confirm body copy sits on solid panels with compliant contrast,
sample frames to count flashes per second, and check reduced-motion stillness. The judged check
asks whether the hero reads as a poster composition.

Reference pictures: `demo-design/psychedelic/`.
