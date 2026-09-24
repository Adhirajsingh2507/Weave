---
slug: futuristic
title: Futuristic
aliases: [near-future ui, sci-fi product, techno minimal]
status: ready
summary: Cool dark surfaces, precise thin lines, one luminous accent and clinical type — the interface of something expensive and not yet released.
best_for: [AI and infrastructure products, robotics, aerospace, crypto, hardware launches]
avoid_for: [family brands, food, anything warm or handmade]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: void, value: "#05070B" }
      - { name: surface, value: "#0C111A" }
      - { name: surface-raised, value: "#121927" }
      - { name: foreground, value: "#E8EEF7" }
      - { name: muted, value: "#7E8A9C" }
      - { name: accent, value: "#3DE1FF" }
      - { name: grid-line, value: "#1B2433" }
    gradients:
      - { name: horizon, value: "radial-gradient(70% 50% at 50% 0%, rgba(61,225,255,0.18) 0%, transparent 70%)" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Aeonik, Neue Montreal, sans-serif", weights: [400, 500] }
      - { role: mono, family: "JetBrains Mono, ui-monospace, monospace", weights: [400] }
    heading_tracking_em: -0.02
    heading_line_height: 1.1
    label_tracking_em: 0.12
    label_case: uppercase
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1320
    section_spacing_px: [72, 120, 176]
    overlay: faint grid lines or measurement ticks
  shape:
    radius_px: 10
    border_px: 1
    shadow: "0 0 0 1px rgba(61,225,255,0.12), 0 20px 60px rgba(0,0,0,0.6)"
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    properties: [opacity, transform, filter]
    intensity: precise
  imagery:
    treatment: [product renders on black, wireframes, long-exposure light, macro hardware]
    illustration: technical line work, exploded views
    icons: 1.25px line, geometric, uniform
checks:
  - { id: fut.color.dark-ground, rule: "page background luminance is below 12%", kind: deterministic }
  - { id: fut.color.single-accent, rule: "exactly one luminous accent hue is used across the page", kind: deterministic }
  - { id: fut.type.mono-labels, rule: "labels and metadata use the mono role, uppercase, tracking >= 0.1em", kind: deterministic }
  - { id: fut.line.hairlines, rule: "borders are 1px and low-contrast; no heavy outlines", kind: deterministic }
  - { id: fut.layout.grid-overlay, rule: "a faint grid or tick overlay is present at under 10% opacity", kind: deterministic }
  - { id: fut.a11y.contrast-dark, rule: "muted text on dark surfaces still meets 4.5:1", kind: deterministic }
  - { id: fut.motion.precise, rule: "transitions are 300-500ms with decelerating easing; no bounce", kind: deterministic }
  - { id: fut.image.dark-fit, rule: "imagery is dark-backed or cut out; no white-background photos", kind: deterministic }
  - { id: fut.feel.engineered, rule: "the page reads as precise and engineered, not as generic dark mode", kind: judged }
---

# Futuristic

## The look in one paragraph

Near-black surfaces with a faint technical grid, hairline borders, one cyan accent that behaves
like emitted light rather than paint, and type that alternates between a clean grotesque for
statements and uppercase mono for labels. Everything is measured, spacious and slightly cold.

## Layout

- 12 columns at 1320px with large section spacing (72–176px).
- A faint grid, tick marks or coordinate labels sit behind content at under 10% opacity, giving
  the sense of a calibrated instrument.
- Content blocks are precisely aligned; nothing is casually placed.

## Typography

- A neutral grotesque for headings and body; mono, uppercase, wide-tracked for labels, figures
  and section markers.
- Headings at `1.1` line height with slight negative tracking. Body 16px at `1.6`.
- Numbers matter in this style: metrics get large mono treatment with unit labels.

## Colour

Void black ground, two raised surface tones, near-white text, a cool grey for secondary text,
and a single luminous accent. The accent appears as thin glowing lines, focus states and one
gradient wash at the horizon of the hero — never as large filled areas.

## Surface and depth

Raised surfaces are slightly lighter fills with a 1px low-contrast border and a soft ambient
shadow. Glow is subtle: a 1px accent-tinted ring, not a neon bloom.

## Motion

Precise and unhurried: 400ms decelerating. Elements fade and rise a few pixels; lines draw
themselves; numbers count up once. No bounce, no elastic easing.

## Imagery

Product renders on black, wireframes, macro hardware shots, long-exposure light trails.
Anything on a white background breaks the ground instantly — cut it out or re-light it.

## Components

- **Buttons** — 10px radius, dark fill with a hairline accent border; primary uses a subtle
  accent tint and a brighter border.
- **Nav** — translucent dark bar with a hairline underneath and uppercase mono links.
- **Cards** — raised surface, hairline border, optional accent line along the top edge.
- **Metrics** — large mono numeral, small uppercase label, hairline divider between entries.
- **Inputs** — dark fill, hairline border, accent focus ring at 2px.

## Do

- Keep the accent for light-like moments: lines, rings, focus, one gradient wash.
- Use mono uppercase for every label and unit.
- Keep borders at 1px and low contrast.
- Leave large calm spaces between sections.

## Don't

- Don't fill large areas with the accent.
- Don't use warm colours or soft rounded shapes.
- Don't drop muted text below the contrast floor — dark backgrounds make this easy to miss.
- Don't add bouncy motion.

## How Weave verifies it

Deterministic checks compute background luminance, count distinct accent hues, read the type
stack, case and tracking for label elements, measure border widths and contrast, detect the
grid overlay and its opacity, read transition durations and easing, and inspect loaded images
for light backgrounds. Contrast is re-measured for every muted text token on dark surfaces.
The judged check asks whether it reads as engineered precision rather than default dark mode.

Reference pictures: `demo-design/futuristic/`.
