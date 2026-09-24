---
slug: material-design
title: Material Design
aliases: [material 3, material you, google design language]
status: ready
summary: Paper-like surfaces at defined elevations, a tonal colour system generated from one seed, and motion that obeys physics.
best_for: [web apps, admin tools, Android-adjacent products, forms-heavy flows, internal software]
avoid_for: [fashion, luxury, editorial, anything wanting a distinctive brand voice]
inherits: _base.md
tokens:
  colors:
    mode: both
    seed: "#6750A4"
    palette:
      - { name: primary, value: "#6750A4" }
      - { name: on-primary, value: "#FFFFFF" }
      - { name: primary-container, value: "#EADDFF" }
      - { name: surface, value: "#FEF7FF" }
      - { name: surface-variant, value: "#E7E0EC" }
      - { name: on-surface, value: "#1D1B20" }
      - { name: outline, value: "#79747E" }
      - { name: error, value: "#B3261E" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Roboto, Google Sans, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: 0
    heading_line_height: 1.25
    body_size_px: 16
    body_line_height: 1.5
    roles: [display, headline, title, body, label]
  layout:
    system: grid
    density: comfortable
    columns: 12
    gutter_px: 24
    max_width_px: 1440
    spacing_base_px: 8
    section_spacing_px: [24, 48, 72]
  shape:
    radius_px: 16
    small_radius_px: 8
    full_radius_px: 999
    border_px: 1
    elevation: ["0", "1: 0 1px 2px rgba(0,0,0,0.30)", "2: 0 1px 2px rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15)", "3: 0 4px 8px 3px rgba(0,0,0,0.15)"]
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [transform, opacity, box-shadow]
    intensity: physical
  imagery:
    treatment: [photography inside rounded containers, tonal illustration]
    illustration: friendly flat with tonal palette
    icons: Material Symbols, 24px, consistent fill and weight
checks:
  - { id: md.color.roles, rule: "colours are applied via role tokens (primary, surface, on-surface), not raw hex values", kind: deterministic }
  - { id: md.color.on-pairs, rule: "every surface uses its matching on-colour, meeting 4.5:1", kind: deterministic }
  - { id: md.shape.scale, rule: "radii come from the shape scale (8, 16, 999); no arbitrary values", kind: deterministic }
  - { id: md.elevation.levels, rule: "shadows come from the defined elevation levels only", kind: deterministic }
  - { id: md.spacing.8dp, rule: "spacing and sizing are multiples of 8px (4px permitted for fine adjustment)", kind: deterministic }
  - { id: md.type.roles, rule: "type uses the named roles; no ad-hoc font sizes", kind: deterministic }
  - { id: md.motion.easing, rule: "transitions use the standard easing curve and 200-400ms durations", kind: deterministic }
  - { id: md.component.states, rule: "interactive components implement hover, focus, pressed and disabled states", kind: deterministic }
  - { id: md.feel.system, rule: "the page reads as one coherent system rather than assorted components", kind: judged }
---

# Material Design

## The look in one paragraph

Surfaces behave like sheets of paper stacked at defined heights: each has an elevation, a
tonal fill derived from one seed colour, and a rounded shape from a fixed scale. Everything
sits on an 8px grid, type comes from named roles, and motion follows consistent easing. It is
a system first and a look second — its strength is predictability.

## Layout

- 12 columns, 24px gutters, up to 1440px. Every dimension is a multiple of 8 (4 for fine tuning).
- Content lives on surfaces; the page background is the lowest surface level.
- Navigation is structural: top app bar, optional navigation rail or drawer at larger widths.

## Typography

- One family (Roboto or equivalent) at 400 and 500 only.
- Use the type roles rather than ad-hoc sizes: display, headline, title, body, label. Each role
  has a fixed size, weight and line height — pick a role, don't invent a size.
- Body at 16px, `1.5` line height.

## Colour

One seed colour generates the tonal palette. Work in role tokens — `primary`, `on-primary`,
`primary-container`, `surface`, `surface-variant`, `on-surface`, `outline`, `error` — never raw
hex. Every surface has a matching `on-` colour, which is what keeps contrast correct by
construction. Dark mode is the same roles at different tones.

## Surface and depth

Elevation is the depth system: levels 0–3, each with a defined shadow. Higher elevation means
higher in the stack, not "more important". Shape comes from the scale: 8px for small components,
16px for cards and sheets, full rounding for pills and FABs.

## Motion

Physical: 300ms with the standard easing curve. Elements grow from their origin, containers
transform into detail views, and ripples respond on press. Motion explains where something came
from.

## Imagery

Photography sits inside rounded containers matching the shape scale. Illustration is friendly
and tonal, drawn from the same palette.

## Components

- **Buttons** — filled, tonal, outlined and text variants, all with the full state set.
- **Cards** — elevated or filled, 16px radius, consistent internal padding on the 8px grid.
- **Text fields** — filled or outlined, floating label, helper and error text slots.
- **App bar** — surface with elevation on scroll, title and actions.
- **FAB** — fully rounded, primary container colour, one per screen.
- **Chips, dialogs, sheets** — all from the same shape and elevation scales.

## Do

- Use role tokens and type roles rather than raw values.
- Keep everything on the 8px grid.
- Implement all interaction states for every control.
- Derive dark mode from the same seed.

## Don't

- Don't invent radii, shadows or font sizes outside the scales.
- Don't use elevation decoratively.
- Don't mix in a second type family.
- Don't place text on a surface without its matching on-colour.

## How Weave verifies it

Deterministic checks parse computed styles for radii, shadows, spacing multiples and font sizes,
comparing each against the defined scales; check that colour values resolve to role tokens and
that each surface/on-surface pair meets contrast; read transition durations and easing; and
exercise hover, focus, pressed and disabled states on every interactive component. The judged
check asks whether the page reads as one coherent system.

Reference pictures: `demo-design/material-design/`.
