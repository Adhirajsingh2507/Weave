---
slug: line-art
title: Line Art
aliases: [continuous line, monoline illustration, contour drawing]
status: ready
summary: Drawing reduced to a single continuous stroke — no fills, no shading, just confident contour lines on an empty ground.
best_for: [wellness and beauty, editorial features, stationery and print, fashion, minimal brand systems]
avoid_for: [data visualisation, dense product UI, anything needing colour coding]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FBF9F5" }
      - { name: ink, value: "#1C1A17" }
      - { name: muted, value: "#7A746B" }
      - { name: accent, value: "#C25A3C" }
      - { name: wash, value: "#E8E2D6" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, Georgia, serif", weights: [300, 500] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.7
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1120
    section_spacing_px: [72, 120, 168]
    composition: large empty ground with one drawing per section
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 900
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [stroke-dashoffset, opacity]
    intensity: drawing
  imagery:
    treatment: [single-weight contour drawings, no fills, generous empty space]
    illustration: continuous-line figures, botanicals, objects
    icons: 1.5px monoline, matching the illustration weight
checks:
  - { id: line.stroke.single-weight, rule: "all illustration strokes share one width; no variable or tapered strokes", kind: deterministic }
  - { id: line.fill.none, rule: "illustrations have no filled areas except the optional single wash colour", kind: deterministic }
  - { id: line.space.generous, rule: "at least 55% of each viewport is empty ground", kind: deterministic }
  - { id: line.icons.match, rule: "icon stroke width matches the illustration stroke width", kind: deterministic }
  - { id: line.motion.draw, rule: "line drawings animate via stroke-dashoffset and complete within 1s", kind: deterministic }
  - { id: line.a11y.svg-desc, rule: "informative drawings carry a description; decorative ones are hidden", kind: deterministic }
  - { id: line.a11y.contrast, rule: "ink on the warm ground meets 4.5:1; the accent is not used for small text", kind: deterministic }
  - { id: line.feel.confidence, rule: "lines read as one confident gesture rather than as traced or wobbly vector", kind: judged }
---

# Line Art

## The look in one paragraph

A single stroke doing all the work: a face, a plant, a hand described by contour alone, with no
fill and no shading, sitting in a large area of warm empty ground. Type is light and serif, the
page is spacious, and the one accent colour appears as a wash behind the drawing or as a small
underline.

## Layout

- Asymmetric at 1120px with very generous spacing (72–168px).
- One drawing per section, placed off-centre, with the text balancing it.
- Emptiness is structural — more than half of each screen stays unpainted.

## Typography

- A light high-contrast serif for headings, set large with open tracking.
- A plain sans for small labels; body in the serif at 17px with `1.7` line height.
- Weight stays light throughout to match the line weight of the art.

## Colour

Warm off-white ground, near-black ink for the lines and text, a muted grey for secondary text,
and one terracotta accent used as a wash shape behind a drawing or as a rule. The art itself
is almost always monochrome.

## Surface and depth

None. No cards, shadows or radii. Depth is line overlap only — where one contour crosses in
front of another.

## Motion

Drawing: 900ms `stroke-dashoffset` animation so the line appears to be drawn as the section
arrives. Each drawing animates once, and stops instantly under reduced-motion.

## Imagery

Continuous-line figures, botanical contours, objects described in one unbroken stroke. Every
drawing shares the same stroke width — mixing weights is the fastest way to break the style.

## Components

- **Drawing block** — an SVG line drawing beside a short text column.
- **Buttons** — text with a hand-drawn underline, or a 1px outlined rectangle.
- **Nav** — light serif links with plenty of space, one thin rule beneath.
- **Dividers** — a single drawn line with a slight irregularity.
- **Wash shape** — a flat accent shape sitting behind a drawing for contrast.

## Do

- Keep one stroke width everywhere, icons included.
- Let empty space dominate.
- Animate drawings once, as a reveal.
- Use the accent as a wash, not as a line colour.

## Don't

- Don't fill or shade the drawings.
- Don't mix stroke weights.
- Don't crowd sections with multiple drawings.
- Don't use the accent for small text.

## How Weave verifies it

Deterministic checks parse SVG stroke widths for uniformity across illustrations and icons, look
for fill attributes other than the wash colour, measure unpainted viewport area, read animation
properties and durations, check SVG accessibility attributes, and measure contrast. The judged
check asks whether the lines read as confident gestures.

Reference pictures: `demo-design/line-art/`.
