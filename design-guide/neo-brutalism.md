---
slug: neo-brutalism
title: Neo-Brutalism
aliases: [neubrutalism, new brutalism, hard-shadow style]
status: ready
summary: Brutalism art-directed — thick black outlines, hard offset shadows, saturated flat colour, and type that shouts.
best_for: [startup marketing, dev tools, portfolios, community products, launch pages]
avoid_for: [enterprise, finance, healthcare, anything conservative]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFDF5" }
      - { name: ink, value: "#0A0A0A" }
      - { name: yellow, value: "#FFE14D" }
      - { name: mint, value: "#7BF1A8" }
      - { name: sky, value: "#79C0FF" }
      - { name: coral, value: "#FF7A66" }
      - { name: lilac, value: "#C4A7FF" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Archivo, Space Grotesk, Inter, sans-serif", weights: [500, 800] }
      - { role: mono, family: "JetBrains Mono, ui-monospace, monospace", weights: [400, 700] }
    heading_tracking_em: -0.02
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.5
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [48, 80, 120]
  shape:
    radius_px: 8
    border_px: 3
    shadow: "5px 5px 0 #0A0A0A"
    shadow_hover: "2px 2px 0 #0A0A0A"
  motion:
    duration_ms: 120
    easing: "steps(1, end)"
    properties: [transform, box-shadow]
    intensity: snappy
  imagery:
    treatment: [cut-out photos with ink outlines, flat illustration, sticker badges]
    illustration: bold flat with 3px outlines
    icons: 3px stroke, square caps
checks:
  - { id: neo.shape.border-width, rule: "interactive surfaces carry a 3px ink border", kind: deterministic }
  - { id: neo.shape.hard-shadow, rule: "shadows have 0 blur and a visible offset, in ink", kind: deterministic }
  - { id: neo.shape.radius-token, rule: "radii use the 8px token or 0; nothing softer than 12px", kind: deterministic }
  - { id: neo.color.flat, rule: "fills are flat; no gradients on surfaces", kind: deterministic }
  - { id: neo.color.contrast, rule: "text on pastel fills still meets 4.5:1 against ink", kind: deterministic }
  - { id: neo.motion.press, rule: "hover or active state reduces the shadow offset, giving a press effect", kind: deterministic }
  - { id: neo.type.heavy-display, rule: "headings use weight 800 at >= 2.5x body size", kind: deterministic }
  - { id: neo.layout.alignment, rule: "blocks align to the 12-column grid despite the playful styling", kind: deterministic }
  - { id: neo.feel.solid, rule: "elements read as physical stickers on a surface, not as flat divs with a border", kind: judged }
---

# Neo-Brutalism

## The look in one paragraph

Everything is a solid object: cream ground, 3px black outlines, hard offset shadows with no
blur, flat pastel-saturated fills, and heavy type set tight. Where brutalism refuses design,
neo-brutalism designs the refusal — it's cheerful, loud, and deliberately unsubtle, but the
grid underneath is disciplined.

## Layout

- 12-column grid at 1200px, ordinary spacing, blocks aligned properly. The chaos is in the
  styling, not the structure.
- Elements may overlap slightly and tilt a degree or two, but they still snap to the grid.
- Generous padding inside outlined boxes so the border reads as a frame, not a squeeze.

## Typography

- A grotesque with a heavy weight available (Archivo 800, Space Grotesk 700) plus a mono for
  code, labels and numbers.
- Headings at `1.0` line height, `-0.02em`, at least 2.5× body size, often in a coloured box.
- Body at 17px. Labels frequently uppercase mono with wide tracking.

## Colour

Cream ground, ink outlines, and a set of saturated pastels — yellow, mint, sky, coral, lilac.
Fills are always flat. Two or three fills per screen; the rest of the page stays cream.

## Surface and depth

The whole identity: 3px ink border, 8px radius, `5px 5px 0` ink shadow. Depth is faked with
offset, never blur. On press the shadow shrinks to `2px 2px` and the element translates by the
difference, so it looks physically pushed down.

## Motion

Snappy and stepped — 120ms, often with `steps()` easing so movement feels mechanical rather
than smooth. Only transform and shadow animate.

## Imagery

Cut-out photography with an ink outline, flat illustration with matching stroke weight, badges
and stickers. Every image sits in a bordered frame with its own hard shadow.

## Components

- **Buttons** — bordered, flat fill, hard shadow, press effect on active, heavy label.
- **Nav** — a bordered bar with pill or boxed links; active link gets a coloured fill.
- **Cards** — border, shadow, flat fill, occasionally rotated 1–2°.
- **Inputs** — 3px border, inset-free, focus state changes fill colour and keeps a visible ring.
- **Badges** — small boxes with mono uppercase text, used for prices, tags and counts.

## Do

- Keep shadows hard, ink-coloured, and consistent in direction.
- Give every interactive element a press state.
- Keep the grid tidy underneath.
- Limit fills to three per screen.

## Don't

- Don't use soft or coloured blur shadows.
- Don't gradient the fills.
- Don't shrink the border below 3px — it stops reading as a frame.
- Don't rely on colour alone for state; the shadow and border carry it too.

## How Weave verifies it

Deterministic checks read border widths and shadow values (asserting zero blur and a consistent
offset direction), confirm radii come from the token set, look for gradients on surfaces, compare
hover and active shadow offsets to verify the press effect, check heading weight and size ratio,
and test grid alignment. Contrast is measured over the pastel fills. The judged check asks
whether elements read as physical objects or as ordinary divs with a border.

Reference pictures: `demo-design/neo-brutalism/`.
