---
slug: pixel-art
title: Pixel Art
aliases: [8-bit, 16-bit, retro game ui]
status: ready
summary: Everything on a visible pixel grid — hard-edged sprites, bitmap type, limited palette and chunky nearest-neighbour scaling.
best_for: [games and game studios, indie tools, community sites, event pages, developer merch]
avoid_for: [enterprise, luxury, content-heavy reading, anything needing photographic imagery]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: bg, value: "#1A1C2C" }
      - { name: panel, value: "#333C57" }
      - { name: foreground, value: "#F4F4F4" }
      - { name: green, value: "#38B764" }
      - { name: yellow, value: "#FFCD75" }
      - { name: red, value: "#EF4A5B" }
      - { name: blue, value: "#41A6F6" }
      - { name: shadow, value: "#29366F" }
  typography:
    scale: default
    families:
      - { role: bitmap, family: "Press Start 2P, Silkscreen, monospace", weights: [400] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0
    heading_line_height: 1.6
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1024
    grid_unit_px: 8
    section_spacing_px: [32, 64, 96]
  shape:
    radius_px: 0
    border_px: 4
    border_style: stepped pixel corners
    shadow: "4px 4px 0 #29366F"
  motion:
    duration_ms: 100
    easing: "steps(4, end)"
    properties: [transform, background-position]
    intensity: stepped
  imagery:
    treatment: [sprites, tilesets, nearest-neighbour scaling, dithered gradients]
    illustration: pixel sprites at 1x, 2x or 3x scale
    icons: 16x16 or 24x24 pixel icons
checks:
  - { id: px.render.crisp, rule: "images use image-rendering: pixelated and integer scale factors", kind: deterministic }
  - { id: px.layout.grid-unit, rule: "spacing and sizes are multiples of the 8px grid unit", kind: deterministic }
  - { id: px.color.palette-limited, rule: "no more than 16 distinct colours painted across the page", kind: deterministic }
  - { id: px.shape.stepped, rule: "corners are square or stepped; no border-radius", kind: deterministic }
  - { id: px.type.bitmap-limited, rule: "bitmap type is used for headings and labels only; body copy uses the sans role at >= 16px", kind: deterministic }
  - { id: px.motion.stepped, rule: "animations use steps() easing, not smooth interpolation", kind: deterministic }
  - { id: px.a11y.contrast, rule: "palette pairs used for text meet 4.5:1 despite the limited palette", kind: deterministic }
  - { id: px.feel.consistent-scale, rule: "all sprites share one pixel scale; nothing is blurred or half-scaled", kind: judged }
---

# Pixel Art

## The look in one paragraph

Every element looks like it was drawn on a small grid and then magnified by a whole number:
hard pixel edges, stepped corners, a tight palette of sixteen colours or fewer, chunky bitmap
headings and drop shadows that are just offset squares. Nothing is anti-aliased, nothing is
smoothly animated.

## Layout

- Everything lands on an 8px unit. Padding, gaps, borders and icon sizes are all multiples.
- 1024px max width keeps the pixel scale feeling deliberate on large screens.
- Panels look like game UI: 4px stepped borders, flat fills, a solid offset shadow.

## Typography

- A bitmap face (Press Start 2P, Silkscreen) for headings, labels, buttons and numbers — used
  only at its native sizes and integer multiples, with generous line height (`1.6`) because
  bitmap faces are cramped.
- A normal sans for body copy at 16px+. Long paragraphs in bitmap type are unreadable, and this
  is the most common mistake in the style.

## Colour

A limited palette — sixteen colours maximum, and fewer is better. Flat fills only; gradients
are done with dithering if at all. Pick a named palette and stick to it.

## Surface and depth

Panels have 4px borders with stepped corners (drawn, not rounded) and a hard 4px offset shadow.
Depth is a single step: raised or not.

## Motion

Stepped: `steps(4, end)` at 100ms, sprite-sheet animation by shifting `background-position`,
blinking cursors and two-frame hovers. Nothing eases smoothly.

## Imagery

Sprites and tilesets scaled by integers with `image-rendering: pixelated`. No photographs. If a
photo is unavoidable, it gets posterised and dithered into the palette.

## Components

- **Buttons** — 4px stepped border, flat fill, offset shadow that disappears on press so the
  button looks pushed in.
- **Nav** — a panel bar with bitmap labels and a blinking or highlighted active item.
- **Cards** — game-style panels with a title bar in bitmap type.
- **Inputs** — inset panels with a blinking block cursor and a clear focus state.
- **Progress/health bars** — segmented blocks rather than a smooth fill.

## Do

- Keep one pixel scale across the whole site.
- Use bitmap type for short strings only.
- Snap everything to the 8px unit.
- Use dithering instead of gradients.

## Don't

- Don't let sprites scale to non-integer sizes or blur.
- Don't set paragraphs in bitmap type.
- Don't round corners or anti-alias borders.
- Don't use smooth easing.

## How Weave verifies it

Deterministic checks read `image-rendering` and computed image dimensions against natural sizes
for integer scaling, test spacing values against the 8px unit, count distinct painted colours,
assert zero radii, verify which elements use the bitmap font role and at what size, and read
easing functions for `steps()`. Contrast is checked across the limited palette. The judged
check looks for a consistent pixel scale across sprites.

Reference pictures: `demo-design/pixel-art/`.
