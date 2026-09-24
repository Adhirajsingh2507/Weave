---
slug: cassette-futurism
title: Cassette Futurism
aliases: [retro-future tech, alien computer, 70s sci-fi interface]
status: ready
summary: The future as imagined in 1979 — beige plastic, CRT phosphor, chunky labelled buttons and monospace readouts.
best_for: [developer tools, audio and music software, games, hardware brands, sci-fi projects]
avoid_for: [luxury, fashion, wellness, anything sleek or modern]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: shell, value: "#C9BFA5" }
      - { name: shell-dark, value: "#8E856F" }
      - { name: crt, value: "#0D1410" }
      - { name: phosphor, value: "#7CE38B" }
      - { name: amber, value: "#E8A33D" }
      - { name: ink, value: "#221F19" }
      - { name: alert, value: "#D4483B" }
  typography:
    scale: default
    families:
      - { role: mono, family: "IBM Plex Mono, VT323, ui-monospace, monospace", weights: [400, 700] }
      - { role: sans, family: "Inter, Eurostile, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.08
    heading_case: uppercase
    heading_line_height: 1.25
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1280
    section_spacing_px: [24, 48, 72]
    structure: panelled console with labelled groups and bezel edges
  shape:
    radius_px: 6
    border_px: 2
    border_style: bevelled plastic with a recessed bezel
    shadow: "inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.35)"
  motion:
    duration_ms: 120
    easing: "steps(2, end)"
    properties: [transform, opacity, background-color]
    intensity: mechanical
  imagery:
    treatment: [CRT scanlines, phosphor glow, product photography of old hardware, printed labels]
    illustration: technical schematics, dot-matrix output
    icons: chunky glyphs with engraved labels
checks:
  - { id: cass.surface.bevel, rule: "controls use inset/outset plastic bevels rather than flat fills", kind: deterministic }
  - { id: cass.screen.crt, rule: "screen areas use a dark recessed panel with phosphor text and scanlines under 12% opacity", kind: deterministic }
  - { id: cass.type.mono-readouts, rule: "all readouts and data use the mono role; labels are uppercase with wide tracking", kind: deterministic }
  - { id: cass.color.shell-phosphor, rule: "the palette pairs beige shell tones with phosphor or amber screens", kind: deterministic }
  - { id: cass.control.labels, rule: "every control carries a visible printed-style text label, not an icon alone", kind: deterministic }
  - { id: cass.a11y.contrast, rule: "phosphor on CRT and ink on shell both meet 4.5:1", kind: deterministic }
  - { id: cass.motion.mechanical, rule: "transitions are stepped and under 150ms; CRT flicker stops under prefers-reduced-motion", kind: deterministic }
  - { id: cass.feel.hardware, rule: "the page reads as a physical console rather than a dark theme with a mono font", kind: judged }
---

# Cassette Futurism

## The look in one paragraph

The spaceship computer from a 1979 film: beige plastic housing with bevelled edges, recessed
CRT panels glowing phosphor green, chunky buttons with printed labels, amber warning lights and
dot-matrix readouts. Analogue, chunky and reassuringly mechanical.

## Layout

- A console: 12 columns at 1280px divided into labelled panel groups, each with a bezel edge and
  a printed header.
- Dense (24–72px spacing) — instruments sit close together.
- Screens are recessed rectangles inset into the shell, with a visible bezel around them.

## Typography

- Mono for every readout, value and label — this is a machine that prints its own text.
- Labels uppercase with `0.08em` tracking, as though silk-screened onto plastic.
- A plain sans for longer prose at 16px, kept to short blocks.

## Colour

Beige shell and darker shell shadow, near-black CRT wells, phosphor green for live text, amber
for warnings, red for alerts, dark ink for printed labels. Nothing saturated outside the screen
areas.

## Surface and depth

Plastic: 2px bevelled borders with an inset light top edge and dark bottom edge, 6px radius,
recessed wells for screens and inputs. Buttons visibly depress on press.

## Motion

Mechanical and stepped: 120ms in two frames, toggles snapping, LEDs switching state, a faint
CRT flicker that stops under reduced-motion. Nothing glides.

## Imagery

CRT scanlines and phosphor glow, photographs of old hardware, printed labels and dymo tape,
dot-matrix output, technical schematics.

## Components

- **Console panel** — bevelled shell group with a printed header label.
- **Screen** — recessed dark well, phosphor mono text, scanline overlay, subtle inner glow.
- **Button** — chunky bevelled plastic with a printed label and a real pressed state.
- **Toggle/LED** — physical switch with an amber or green indicator plus a text state label.
- **Readout** — mono value with unit, on the screen surface.

## Do

- Label every control in text.
- Recess screens into the shell with a bezel.
- Keep phosphor and amber inside screen areas.
- Make presses feel physical.

## Don't

- Don't use flat modern fills or soft shadows.
- Don't rely on an LED colour alone for state.
- Don't put phosphor text on the beige shell.
- Don't animate smoothly.

## How Weave verifies it

Deterministic checks read border and inset shadow values for bevels, identify recessed screen
panels and their scanline opacity, confirm mono usage and label tracking, sample the palette for
shell/phosphor pairing, check every control has a text label, measure contrast in both zones,
and verify stepped motion and reduced-motion behaviour. The judged check asks whether it reads
as physical hardware.

Reference pictures: `demo-design/cassette-futurism/`.
