---
slug: dieselpunk
title: Dieselpunk
aliases: [interwar industrial, art deco machine age, noir industrial]
status: ready
summary: Machine-age weight — riveted steel, propaganda-poster geometry, oil-stained palettes and heavy condensed type.
best_for: [games and fiction, breweries and distilleries, motorsport and aviation, heavy industry, events]
avoid_for: [wellness, children's products, minimal consumer tech]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: gunmetal, value: "#22262A" }
      - { name: steel, value: "#3B4248" }
      - { name: oil, value: "#121518" }
      - { name: bone, value: "#D9D2C4" }
      - { name: rust, value: "#A4472A" }
      - { name: brass, value: "#9C7B3C" }
      - { name: warning, value: "#D9A227" }
  typography:
    scale: display
    families:
      - { role: display, family: "Oswald, Alternate Gothic, Bebas Neue, sans-serif", weights: [500, 700] }
      - { role: sans, family: "Inter, Roboto Condensed, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.03
    heading_case: uppercase
    heading_line_height: 1.0
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1360
    section_spacing_px: [32, 64, 96]
    composition: heavy horizontal bands, riveted panel edges, strong diagonals
  shape:
    radius_px: 2
    border_px: 3
    border_style: riveted steel plate
    shadow: "0 14px 30px rgba(0,0,0,0.55)"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: heavy
  imagery:
    treatment: [high-contrast industrial photography, soot and oil texture, blueprint overlays, propaganda posters]
    illustration: machine cutaways, turbines, aircraft silhouettes
    icons: solid, heavy, stencil-cut
checks:
  - { id: diesel.surface.rivets, rule: "panels carry rivet or plate-seam detailing along their edges", kind: deterministic }
  - { id: diesel.type.condensed-caps, rule: "headings use a condensed sans, uppercase, at 1.0 line height", kind: deterministic }
  - { id: diesel.color.industrial, rule: "palette is gunmetal and steel with rust, brass and warning yellow accents", kind: deterministic }
  - { id: diesel.texture.soot, rule: "a soot, grime or metal texture overlays surfaces at 6-15% opacity", kind: deterministic }
  - { id: diesel.layout.bands, rule: "sections are heavy horizontal bands with strong edge definition", kind: deterministic }
  - { id: diesel.a11y.contrast, rule: "bone on gunmetal and warning yellow on steel meet 4.5:1", kind: deterministic }
  - { id: diesel.motion.weight, rule: "motion is slow-starting and short-travel, suggesting mass", kind: deterministic }
  - { id: diesel.feel.machine, rule: "the page reads as fabricated machinery rather than a dark grey theme", kind: judged }
---

# Dieselpunk

## The look in one paragraph

Interwar industry with the volume up: riveted steel plates, heavy horizontal bands, condensed
uppercase type marching across posters, rust and brass against gunmetal, and soot texture over
everything. Where steampunk is ornamental brass and clockwork, dieselpunk is welded plate and
combustion — heavier, darker, more militant.

## Layout

- 12 columns at 1360px, compact, organised into heavy horizontal bands with hard edges.
- Panels look fabricated: 3px steel borders with rivets along the seams, plates overlapping.
- Diagonals appear as stencil stripes and hazard markings rather than as rotated content.

## Typography

- A condensed gothic sans, uppercase, `1.0` line height, `0.03em` tracking — poster type.
- A condensed or neutral sans for body at 16px.
- Stencil-style lettering suits labels, warnings and numbers.

## Colour

Gunmetal and steel grounds, bone for text, rust and brass for accents, warning yellow for
alerts and hazard stripes. Nothing bright; everything looks slightly oxidised.

## Surface and depth

Fabricated: bevelled steel plates with rivet rows, 2px radius at most, deep shadows beneath
overlapping plates. Surfaces feel thick and heavy.

## Motion

Heavy: 260ms with a slow start and short travel, panels sliding like sheet metal, gauges
sweeping. Nothing light or springy.

## Imagery

High-contrast industrial photography, turbines and aircraft, blueprint overlays, propaganda-
poster compositions, soot and oil texture.

## Components

- **Steel panel** — riveted edges, plate seams, stencil label in one corner.
- **Buttons** — heavy rectangles with 3px borders, stencil uppercase labels, pressed state that
  darkens the plate.
- **Nav** — a gunmetal band with stencil links and a hazard-stripe active marker.
- **Gauge** — circular dial with a brass needle for metrics.
- **Hazard stripe** — diagonal yellow/black band used for warnings and section breaks.

## Do

- Rivet the panel edges.
- Use hazard stripes for warnings, not decoration.
- Keep type condensed and uppercase.
- Let soot texture dirty the surfaces.

## Don't

- Don't use ornamental filigree — that's steampunk.
- Don't round corners.
- Don't use bright or clean colours.
- Don't let texture drop contrast below the floor.

## How Weave verifies it

Deterministic checks look for rivet/seam detailing on panel edges, read heading font width class
and case, sample the palette for industrial tones, measure texture opacity, analyse section
structure for banding, measure contrast in both the bone-on-gunmetal and warning-on-steel cases,
and read easing curves for weight. The judged check asks whether surfaces read as fabricated.

Reference pictures: `demo-design/dieselpunk/`.
