---
slug: tactical-hud
title: Tactical HUD
aliases: [sci-fi interface, fui, heads-up display, mission control]
status: ready
summary: A command interface pretending to be mission-critical — bracket frames, telemetry readouts, targeting reticles and a single phosphor accent.
best_for: [monitoring and observability tools, security products, games, robotics and drones, hackathon projects]
avoid_for: [consumer marketing, wellness, anything warm or casual]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: base, value: "#04070A" }
      - { name: panel, value: "#0A1016" }
      - { name: foreground, value: "#D6E6EE" }
      - { name: muted, value: "#6C8593" }
      - { name: hud, value: "#4FF0B0" }
      - { name: warn, value: "#FFB020" }
      - { name: alert, value: "#FF4D4D" }
      - { name: grid-line, value: "#12202A" }
  typography:
    scale: default
    families:
      - { role: mono, family: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace", weights: [400, 700] }
      - { role: sans, family: "Inter, Chakra Petch, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.1
    heading_case: uppercase
    heading_line_height: 1.2
    body_size_px: 15
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1600
    section_spacing_px: [16, 32, 56]
    overlay: coordinate grid, corner brackets, tick marks, scan sweep
  shape:
    radius_px: 2
    clip: "corner brackets and 8px notch cuts"
    border_px: 1
    shadow: "0 0 0 1px rgba(79,240,176,0.18)"
  motion:
    duration_ms: 160
    easing: "linear"
    properties: [opacity, transform, stroke-dashoffset]
    intensity: instrument
  imagery:
    treatment: [wireframes, satellite and map tiles, telemetry charts, schematic overlays]
    illustration: vector schematics, exploded technical views
    icons: 1px stroke, geometric, uniform grid size
checks:
  - { id: hud.frame.brackets, rule: "panels use corner brackets or notch cuts rather than plain rectangles", kind: deterministic }
  - { id: hud.type.mono-data, rule: "all numeric and data elements use the mono role with tabular figures", kind: deterministic }
  - { id: hud.color.single-accent, rule: "one phosphor accent plus warn/alert states; no decorative colour", kind: deterministic }
  - { id: hud.layout.density, rule: "at least 3 labelled readouts or status elements are visible per screen", kind: deterministic }
  - { id: hud.overlay.grid, rule: "a coordinate grid or tick overlay is present under 10% opacity", kind: deterministic }
  - { id: hud.a11y.status-text, rule: "status is conveyed by text and icon, never colour alone", kind: deterministic }
  - { id: hud.a11y.contrast, rule: "the phosphor accent and muted text both meet 4.5:1 on the panel colour", kind: deterministic }
  - { id: hud.motion.instrument, rule: "motion is linear and under 200ms; sweeps and pulses stop under prefers-reduced-motion", kind: deterministic }
  - { id: hud.feel.operational, rule: "the screen reads as an operational instrument, not as decorative sci-fi", kind: judged }
---

# Tactical HUD

## The look in one paragraph

Near-black panels framed by corner brackets, a faint coordinate grid behind everything, mono
readouts with units and timestamps, a phosphor green accent for live values, and small
schematic drawings. It should look like it is displaying something real, updating, and
slightly urgent.

## Layout

- Wide (1600px), dense, 12-column, with tight 16–56px spacing. Empty space is rare and
  deliberate.
- Panels are framed by corner brackets or cut notches rather than closed rectangles.
- Every panel has a header strip: an uppercase label, an ID, and a status indicator.
- Edges of the screen carry furniture: tick marks, coordinates, version strings.

## Typography

- Mono for all data, labels, coordinates and timestamps, with tabular figures so numbers don't
  jitter as they update.
- A technical sans for prose, kept short.
- Headings uppercase with `0.1em` tracking. Everything is small — 15px body — because density
  is the aesthetic.

## Colour

Near-black ground, slightly lighter panels, cool grey text, one phosphor accent for live and
primary data, amber for warnings, red for alerts. Colour carries meaning here, never decoration.

## Surface and depth

Flat panels with 1px borders and a faint accent ring. Depth comes from overlay layers: grid,
panel, content, reticle. Radius is barely there (2px) and corners are usually cut instead.

## Motion

Instrument-like: 160ms linear, values ticking, a slow scan sweep across a radar element, lines
drawing themselves via `stroke-dashoffset`. Ambient sweeps and pulses stop under reduced-motion;
live data keeps updating.

## Imagery

Wireframes, map and satellite tiles, telemetry charts, schematic side views with callouts.
Nothing photographic or glossy.

## Components

- **Panel** — bracket frame, header strip with label and ID, content grid inside.
- **Readout** — label, large mono value, unit, delta indicator with an arrow glyph and text.
- **Status pill** — uppercase text plus an icon; colour reinforces but never carries the meaning.
- **Chart** — thin phosphor stroke on the grid, no fills or gradients.
- **Reticle/marker** — bracket corners around a focused element.
- **Buttons** — notch-cut rectangles, uppercase mono labels, accent border on hover.

## Do

- Label every number with a unit and a source.
- Use tabular figures.
- Keep the accent for live and primary values.
- Fill the margins with small technical furniture.

## Don't

- Don't use colour as the only status signal.
- Don't round corners or add glow bloom — this is an instrument, not a nightclub.
- Don't animate smoothly; linear ticks read as machine output.
- Don't let density push text below 15px or under the contrast floor.

## How Weave verifies it

Deterministic checks detect bracket/notch framing via `clip-path` or pseudo-element borders,
confirm mono and `font-variant-numeric: tabular-nums` on data elements, count accent hues,
count labelled readouts per screen, measure the grid overlay opacity, check that every status
element contains text or an icon alongside colour, measure contrast on panels, and read motion
timing plus reduced-motion behaviour. The judged check asks whether it reads as operational.

Reference pictures: `demo-design/tactical-hud/`.
