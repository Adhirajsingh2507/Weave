---
slug: monochromatic-tonal
title: Monochromatic Tonal
aliases: [single hue, tonal palette, one-colour design]
status: ready
summary: One hue, many tones — the entire interface built from tints and shades of a single colour, with hierarchy carried by value alone.
best_for: [brand-led marketing, fintech, portfolios, single-product sites, report microsites]
avoid_for: [products needing many status colours, data-dense dashboards, marketplaces]
inherits: _base.md
tokens:
  colors:
    mode: both
    hue: 218
    palette:
      - { name: tone-950, value: "#070C16" }
      - { name: tone-800, value: "#12203A" }
      - { name: tone-600, value: "#1F3A68" }
      - { name: tone-400, value: "#3E6AB0" }
      - { name: tone-200, value: "#9DB8E4" }
      - { name: tone-050, value: "#E8EFFA" }
      - { name: signal, value: "#E4572E" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Neue Haas Grotesk, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.12
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [64, 104, 152]
    rhythm: alternating tone bands between sections
  shape:
    radius_px: 12
    border_px: 1
    shadow: "0 10px 30px rgba(7, 12, 22, 0.18)"
  motion:
    duration_ms: 240
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, background-color]
    intensity: subtle
  imagery:
    treatment: [duotone photography mapped to the hue, tonal illustration]
    illustration: single-hue with tonal shading
    icons: 1.5px line in a mid tone
checks:
  - { id: mono.color.single-hue, rule: "all painted colours except the signal fall within 15 degrees of the base hue", kind: deterministic }
  - { id: mono.color.tone-steps, rule: "colours come from the defined tone ramp, not arbitrary values", kind: deterministic }
  - { id: mono.hierarchy.value, rule: "adjacent surfaces differ by at least 2 tone steps so boundaries read without borders", kind: deterministic }
  - { id: mono.a11y.contrast, rule: "every text/surface pair meets 4.5:1 within the single hue", kind: deterministic }
  - { id: mono.image.duotone, rule: "photography is duotone-mapped to the hue rather than full colour", kind: deterministic }
  - { id: mono.signal.rare, rule: "the signal colour appears at most 3 times per page, only for action or alert", kind: deterministic }
  - { id: mono.layout.bands, rule: "sections alternate tone bands rather than repeating one background", kind: deterministic }
  - { id: mono.feel.range, rule: "the page uses the full tonal range rather than crowding the middle tones", kind: judged }
---

# Monochromatic Tonal

## The look in one paragraph

Everything is one colour at different values. Deep near-black tones for grounds, mid tones for
surfaces, pale tones for text and highlights, and photography mapped into the same hue. Because
there is no second colour to lean on, hierarchy is built entirely from value contrast — which
makes it a disciplined, unusually coherent way to design.

## Layout

- 12 columns at 1200px, comfortable spacing, with sections alternating between tone bands
  (dark section, then pale section) to create rhythm.
- Boundaries come from value change rather than borders or shadows.
- Composition is otherwise straightforward; the colour system is the identity.

## Typography

- One sans at 400/600. Headings large and tight; body 17px at `1.6`.
- Emphasis is a lighter or darker tone, not a different hue.
- Since colour can't differentiate, size and weight have to do more work than usual.

## Colour

Pick one hue and build a ramp of six tones (950 → 050). Everything on the page comes from that
ramp. One signal colour — complementary, warm — is permitted for the primary action and error
states, and it appears no more than three times per page.

## Surface and depth

Surfaces differ by at least two tone steps so edges read without borders. Shadows are tinted
with the hue rather than neutral black, at low opacity.

## Motion

Subtle: 240ms. Hover shifts an element one tone step; focus uses the signal colour. Tone
transitions are the main interaction feedback.

## Imagery

Duotone: map photographs between two tones of the hue. Illustrations use the same ramp. Full
colour imagery destroys the effect immediately.

## Components

- **Buttons** — primary is the signal colour or the darkest tone; secondary is a two-step tonal
  contrast with no border.
- **Nav** — a tone band, one step from the hero, with pale links.
- **Cards** — one tone step above their section band, 12px radius, no border.
- **Inputs** — a step darker than their surface, signal focus ring.
- **Charts** — tone ramp as the series scale, with labels rather than a colour legend.

## Do

- Derive every colour from the ramp.
- Keep two tone steps between adjacent surfaces.
- Map imagery into the hue.
- Reserve the signal colour for action and alert.

## Don't

- Don't introduce a second hue for decoration.
- Don't crowd the mid tones — use the full range.
- Don't rely on colour for chart series without labels.
- Don't let tonal subtlety drop text under the contrast floor.

## How Weave verifies it

Deterministic checks convert every painted colour to HSL and assert hue proximity to the base,
match values against the tone ramp, compare adjacent surface tones for the two-step rule,
measure contrast on every text pair, inspect images for duotone mapping, and count signal-colour
occurrences. The judged check asks whether the full tonal range is used or everything sits in
the middle.

Reference pictures: `demo-design/monochromatic-tonal/`.
