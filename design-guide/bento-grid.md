---
slug: bento-grid
title: Bento Grid
aliases: [bento box layout, modular tile grid]
status: ready
summary: A tidy lunchbox of unequal tiles — each cell holds one idea, sized by importance, with nothing left over.
best_for: [product feature sections, dashboards, AI and dev tools, portfolios, pricing and comparison pages]
avoid_for: [long-form reading, narrative storytelling, text-only sites]
inherits: _base.md
tokens:
  colors:
    mode: both
    palette:
      - { name: background, value: "#0C0D10" }
      - { name: tile, value: "#16181D" }
      - { name: tile-alt, value: "#1D2026" }
      - { name: foreground, value: "#F2F4F8" }
      - { name: muted, value: "#9096A2" }
      - { name: accent, value: "#6E7BFF" }
      - { name: hairline, value: "#262A32" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Geist, system-ui, sans-serif", weights: [400, 500, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.15
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: grid
    density: comfortable
    columns: 12
    gutter_px: 16
    max_width_px: 1200
    tile_sizes: ["1x1", "2x1", "2x2", "3x1", "1x2"]
    section_spacing_px: [48, 72, 96]
  shape:
    radius_px: 18
    border_px: 1
    shadow: "0 1px 0 rgba(255, 255, 255, 0.04) inset"
  motion:
    duration_ms: 200
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [transform, background-color, border-color]
    intensity: subtle
  imagery:
    treatment: [product screenshots, cropped UI, abstract gradients inside tiles]
    illustration: small isometric or diagrammatic per tile
    icons: 1.5px line, one per tile maximum
checks:
  - { id: bento.layout.fills-grid, rule: "tiles tile the grid completely; no ragged gaps or orphan rows", kind: deterministic }
  - { id: bento.layout.size-variety, rule: "at least 3 distinct tile sizes are used per section", kind: deterministic }
  - { id: bento.layout.gutter-consistent, rule: "every gap between tiles equals the gutter token", kind: deterministic }
  - { id: bento.shape.radius-uniform, rule: "all tiles share the same border-radius token", kind: deterministic }
  - { id: bento.content.one-idea, rule: "each tile contains one heading and at most one short supporting line", kind: deterministic }
  - { id: bento.content.hierarchy, rule: "the largest tile holds the most important message", kind: judged }
  - { id: bento.responsive.stack, rule: "tiles reflow to one or two columns under 768px without cropping content", kind: deterministic }
  - { id: bento.a11y.tile-links, rule: "clickable tiles expose a single accessible link or button, not nested interactive elements", kind: deterministic }
---

# Bento Grid

## The look in one paragraph

The page is a box of compartments: rounded tiles of unequal size packed edge to edge with a
consistent gutter, each holding exactly one idea — a metric, a screenshot, a feature, a quote.
Size signals importance. Nothing spills, nothing is left half-empty.

## Layout

- 12-column grid at 1200px with a 16px gutter. Tiles span 1×1 up to 3×1 or 2×2.
- The arrangement must tile completely — no ragged edges or orphaned single tiles at the bottom.
- Mix sizes: a hero tile, two mediums, three smalls. Uniform tiles turn it into an ordinary card
  grid.
- On mobile, tiles stack to one or two columns and keep their internal proportions.

## Typography

- One sans at 400/500/600. Tile headings are small — 18–22px — because the tile does the framing.
- Metrics and numbers may be large inside a tile, which is often the tile's whole content.
- Body text is short by design: one line, maybe two.

## Colour

Dark ground with slightly lighter tiles, a hairline border to define each edge, and one accent
used sparingly for links, highlighted metrics and the occasional feature tile. A light-mode
inversion works with the same structure.

## Surface and depth

Tiles are flat fills with a 1px hairline and, optionally, a 1px inset top highlight. Radius is
generous (18px) and identical on every tile. No drop shadows — separation comes from the gutter.

## Motion

Subtle: 200ms hover that lifts the tile a couple of pixels or brightens its border. Content
inside a tile may animate once on entry. Tiles never reorder on scroll.

## Imagery

Each tile can hold its own kind of content: a cropped product screenshot bleeding to the tile's
edge, a small diagram, an abstract gradient, or nothing but a number. Crop to the tile's shape
rather than letterboxing.

## Components

- **Tile** — the primary component: optional icon, heading, one supporting line, optional visual.
- **Metric tile** — a large number with a small label, centred.
- **Media tile** — image bleeding to the tile's rounded edge, with text overlaid at the bottom.
- **CTA tile** — accent fill, one action, spanning two columns.
- **Nav** — conventional bar above the grid; the grid itself is not navigation.

## Do

- Vary tile sizes and fill the grid completely.
- Keep one idea per tile.
- Let the biggest tile carry the main message.
- Keep gutters and radii identical everywhere.

## Don't

- Don't nest a button inside an already-clickable tile.
- Don't let a tile hold a paragraph.
- Don't leave a lone tile stranded on the last row.
- Don't mix radii or gutter widths between sections.

## How Weave verifies it

Deterministic checks read the rendered grid geometry: tile bounding boxes, gaps against the
gutter token, distinct size classes per section, uniform radii, and reflow behaviour under
768px. Content checks count headings and text length per tile, and accessibility checks look
for nested interactive elements inside clickable tiles. The judged check confirms the largest
tile actually carries the most important message.

Reference pictures: `demo-design/bento-grid/`.
