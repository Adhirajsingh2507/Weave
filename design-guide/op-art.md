---
slug: op-art
title: Op Art
aliases: [optical art, bridget riley style, moire]
status: ready
summary: Pattern that moves without moving — high-contrast repetition, warped grids and figure-ground illusions, handled carefully.
best_for: [exhibitions and galleries, music and fashion, poster microsites, bold brand campaigns]
avoid_for: [content-heavy products, anyone with vestibular or photosensitivity concerns, dashboards]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: white, value: "#FAFAFA" }
      - { name: black, value: "#0B0B0B" }
      - { name: signal, value: "#FF3B1D" }
      - { name: cyan, value: "#00B3C8" }
      - { name: grey, value: "#B6B6B6" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Helvetica Neue, Inter, Arial, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.02
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1280
    section_spacing_px: [56, 96, 136]
    composition: pattern fields alternating with solid reading blocks
  shape:
    radius_px: 0
    border_px: 0
    shadow: none
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: restrained
  imagery:
    treatment: [geometric pattern fields, warped grids, concentric forms, duotone photography]
    illustration: precise vector repetition
    icons: geometric, high contrast
checks:
  - { id: op.pattern.repetition, rule: "at least one section uses a precise repeating geometric pattern", kind: deterministic }
  - { id: op.pattern.warp, rule: "pattern geometry is distorted progressively rather than uniformly tiled", kind: deterministic }
  - { id: op.a11y.text-off-pattern, rule: "no text sits on top of an active pattern field", kind: deterministic }
  - { id: op.a11y.motion-free, rule: "pattern fields do not animate; any motion is limited to section transitions", kind: deterministic }
  - { id: op.a11y.reduced-motion, rule: "under prefers-reduced-motion, high-frequency patterns are replaced with flat fills", kind: deterministic }
  - { id: op.pattern.frequency, rule: "stripe and grid frequency stays under 8 cycles per 100px to limit shimmer", kind: deterministic }
  - { id: op.color.high-contrast, rule: "patterns use black/white with at most one accent hue", kind: deterministic }
  - { id: op.feel.illusion, rule: "the pattern produces a sense of depth or movement while the page stays comfortable to read", kind: judged }
---

# Op Art

## The look in one paragraph

Black and white repetition warped just enough that the eye insists it is moving: bulging
grids, converging stripes, concentric rings, one signal colour. It is the most physically
demanding style in this set, so the discipline is separation — pattern fields do the illusion,
and reading happens somewhere else entirely.

## Layout

- 12 columns at 1280px, alternating between full-bleed pattern fields and plain solid blocks
  that hold the text.
- A pattern field is a section of its own. Text never overlays it.
- Patterns may bleed to the viewport edges; solid blocks stay within the grid.

## Typography

- One neutral grotesque, regular and bold. Headings tight (`1.0` line height) and large, always
  on a solid ground.
- Body at 17px, `1.6`. Typography stays deliberately plain — the pattern is the event.

## Colour

Near-white and near-black for the patterns, one signal colour (red or cyan) for accent and
interactive elements, and a mid grey for secondary text. Two colours per pattern, never more.

## Surface and depth

No shadows, no radius, no borders. Depth is entirely illusory, produced by the pattern warp.

## Motion

Deliberately restrained: patterns do **not** animate. Movement in an op-art pattern crosses
quickly from striking into nauseating. Section transitions fade at 400ms, and under
reduced-motion high-frequency patterns are swapped for flat fills.

## Imagery

Vector pattern fields: warped grids, converging lines, concentric circles, checkerboards
distorted by a lens. Duotone photography can sit inside a pattern-shaped mask.

## Components

- **Pattern field** — a full-width section rendered as SVG or CSS gradient repetition.
- **Solid block** — the reading counterpart: flat colour, plain type, comfortable spacing.
- **Buttons** — solid signal fill with high-contrast label; never patterned.
- **Nav** — solid bar, never transparent over a pattern field.
- **Dividers** — a shift from pattern to solid; no rules needed.

## Do

- Keep every pattern field text-free.
- Warp the geometry progressively so the illusion appears.
- Cap stripe frequency to limit shimmer.
- Provide a flat fallback under reduced-motion.

## Don't

- Don't animate the patterns.
- Don't place navigation or controls over a pattern.
- Don't use more than two colours in one pattern.
- Don't use high-frequency patterns as a page background behind everything.

## How Weave verifies it

Deterministic checks detect repeating pattern definitions and measure their spatial frequency,
compare text bounding boxes against pattern field regions to confirm separation, verify patterns
carry no animation, force reduced-motion and confirm flat fallbacks render, and count colours per
pattern. The judged check asks whether the illusion works while the page stays comfortable.

Reference pictures: `demo-design/op-art/`.
