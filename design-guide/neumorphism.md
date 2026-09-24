---
slug: neumorphism
title: Neumorphism
aliases: [naumorphism, soft ui, neomorphism]
status: ready
summary: Controls extruded from a single-colour surface using twin light and dark shadows — beautiful, and one contrast slip from unusable.
best_for: [audio and smart-home controls, calculators and utilities, watch and device concepts, focused single-purpose tools]
avoid_for: [content sites, anything with dense text, low-vision audiences, complex forms]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: surface, value: "#E4E8EF" }
      - { name: light-shadow, value: "#FFFFFF" }
      - { name: dark-shadow, value: "#B8BEC9" }
      - { name: ink, value: "#28303D" }
      - { name: muted, value: "#5B6472" }
      - { name: accent, value: "#3F6BE0" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Manrope, system-ui, sans-serif", weights: [500, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.2
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 960
    section_spacing_px: [48, 80, 112]
  shape:
    radius_px: 20
    border_px: 0
    shadow_raised: "8px 8px 16px #B8BEC9, -8px -8px 16px #FFFFFF"
    shadow_pressed: "inset 6px 6px 12px #B8BEC9, inset -6px -6px 12px #FFFFFF"
  motion:
    duration_ms: 200
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [box-shadow, transform]
    intensity: tactile
  imagery:
    treatment: [minimal; the surface is the subject]
    illustration: monochrome line work in the ink colour
    icons: 2px line in ink, never in surface colour
checks:
  - { id: neu.shadow.twin, rule: "raised elements use paired light and dark shadows at opposite offsets", kind: deterministic }
  - { id: neu.state.pressed, rule: "active and selected states switch to inset shadows", kind: deterministic }
  - { id: neu.a11y.contrast-text, rule: "all text meets 4.5:1 against the single surface colour", kind: deterministic }
  - { id: neu.a11y.border-affordance, rule: "interactive elements carry a border, label or icon in addition to shadow, so they are not depth-only", kind: deterministic }
  - { id: neu.a11y.focus-ring, rule: "focus uses a solid accent ring, not a shadow change", kind: deterministic }
  - { id: neu.surface.single-tone, rule: "backgrounds and controls share one surface colour; shadows carry all separation", kind: deterministic }
  - { id: neu.a11y.forms-plain, rule: "text inputs use a visible border or underline rather than inset shadow alone", kind: deterministic }
  - { id: neu.feel.extruded, rule: "controls read as pressed out of the surface rather than as flat cards", kind: judged }
---

# Neumorphism

## The look in one paragraph

One flat colour for everything, with shapes that appear to swell out of it or sink into it —
a white shadow from the top-left and a grey shadow from the bottom-right. It is elegant and
tactile and it has a well-known failure mode: because everything is the same colour, contrast
and affordance have to be added back deliberately, or the interface becomes invisible.

## Layout

- Centred, 960px, comfortable spacing. This style suits small focused interfaces — a player, a
  calculator, a thermostat — more than long pages.
- Controls are grouped in clusters with even spacing so the light direction stays consistent.
- One light source for the entire page: top-left. Every shadow pair obeys it.

## Typography

- One sans at 500/600 — medium weights hold up better against low-contrast surfaces.
- Body at 16px in dark ink, never in the surface colour or a light grey.
- Headings modest; the surface is the star.

## Colour

A single surface colour (`#E4E8EF`) for background and controls alike, plus its white and grey
shadow partners, dark ink for text, and one accent for focus and primary actions. The accent is
what rescues this style's accessibility.

## Surface and depth

Raised: `8px 8px 16px` dark, `-8px -8px 16px` light. Pressed: the same values inset. Radius 20px.
No borders on decorative surfaces — but interactive elements get a hairline or an accent detail
so they don't depend on depth alone.

## Motion

Tactile: 200ms shadow transitions between raised and pressed states. Elements do not move; the
light does.

## Imagery

Minimal. Icons are 2px line work in the ink colour. Photographs sit in a pressed well with a
clear boundary.

## Components

- **Buttons** — raised by default, inset on press, with an ink label and an accent detail.
- **Toggles** — a pressed track with a raised knob; state is also shown by an accent fill and a
  text label.
- **Inputs** — pressed well **plus** a visible border or underline; never depth alone.
- **Cards** — raised surfaces with ample padding.
- **Sliders/dials** — the style's best use: a pressed track and a raised handle.

## Do

- Keep one light direction across the whole page.
- Add an accent or border to every interactive element.
- Keep text dark and at medium weight.
- Use a solid accent focus ring.

## Don't

- Don't signal state with shadow alone.
- Don't place low-contrast grey text on the surface.
- Don't use this style for long forms or content pages.
- Don't mix light directions between components.

## How Weave verifies it

Deterministic checks read shadow declarations for the paired light/dark offsets and confirm a
consistent light direction, compare default and active states for the inset switch, measure text
contrast against the single surface, verify interactive elements carry non-depth affordances and
a solid focus ring, and check inputs for visible boundaries. The judged check asks whether
controls read as extruded.

Reference pictures: `demo-design/neumorphism/`.
