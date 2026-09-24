---
slug: bw-pop-of-color
title: Black and White + Pops of Colour
aliases: [selective colour, monochrome with accent, spot colour]
status: ready
summary: A combination layer — everything reduced to black and white except one colour, which marks whatever matters most.
best_for: [portfolios, agencies, product launches, editorial features, campaign sites]
avoid_for: [ecommerce with colour-variant products, data dashboards needing multiple series]
inherits: _base.md
combination: true
tokens:
  colors:
    mode: light
    palette:
      - { name: white, value: "#FFFFFF" }
      - { name: near-black, value: "#0F0F0F" }
      - { name: grey-100, value: "#F2F2F2" }
      - { name: grey-500, value: "#8C8C8C" }
      - { name: grey-800, value: "#333333" }
      - { name: pop, value: "#FF3B30" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Inter, Helvetica Neue, Archivo, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.03
    heading_line_height: 0.98
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1280
    section_spacing_px: [56, 96, 140]
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, filter]
    intensity: crisp
  imagery:
    treatment: [greyscale photography with one colour element preserved or added]
    illustration: greyscale with a single accent
    icons: greyscale, accent only on the active item
  combination:
    applies_over: any base style
    layers: ["desaturate imagery and interface to greyscale", "choose one accent hue", "apply the accent only to the single most important element per view"]
checks:
  - { id: pop.color.single-hue, rule: "exactly one non-greyscale hue is painted across the page", kind: deterministic }
  - { id: pop.color.usage-limited, rule: "the accent appears on at most 3 elements per viewport", kind: deterministic }
  - { id: pop.image.greyscale, rule: "photography is greyscale apart from deliberate spot-colour areas", kind: deterministic }
  - { id: pop.a11y.not-colour-alone, rule: "the accent never carries meaning alone; state also has text, icon or position", kind: deterministic }
  - { id: pop.a11y.contrast, rule: "the accent meets 4.5:1 wherever it is used for text", kind: deterministic }
  - { id: pop.hierarchy.primary, rule: "the accent marks the primary action or focal point, not decoration", kind: judged }
  - { id: pop.base.preserved, rule: "the base style's layout and type rules still hold beneath the treatment", kind: deterministic }
  - { id: pop.feel.intent, rule: "the colour reads as a deliberate pointer rather than a leftover brand accent", kind: judged }
---

# Black and White + Pops of Colour

## The look in one paragraph

A treatment rather than a style: strip the whole page to black, white and grey, then allow
exactly one colour back in — and spend it only where you want the eye to land. Because nothing
else is coloured, the accent becomes a pointer, and the page acquires an unusually clear
hierarchy almost for free.

## How to combine it

1. Keep the base style's layout, type and spacing.
2. Convert its palette to greyscale: one near-black, three or four greys, white.
3. Choose one accent hue and define exactly what it means — usually "the primary action".
4. Apply it to at most three elements per viewport, and never as decoration.

## Layout

- Unchanged from the base style. This treatment changes colour only.
- Because grey provides less separation than colour, spacing and rules may need to work harder.

## Typography

- One neutral sans, regular and bold. Hierarchy comes from scale and weight, since colour is
  unavailable for it.
- Body at 17px; greys used for secondary text must still clear the contrast floor.

## Colour

Greyscale plus one hue. The accent should be genuinely saturated — a muted accent in a grey page
reads as a mistake. Red, electric blue and acid green all work; pick one and never add a second.

## Surface and depth

Flat: separation by rule, spacing and tone. Shadows are unnecessary and often muddy in
greyscale.

## Motion

Crisp: 300ms. A common and effective interaction is an image de-saturating or re-saturating on
hover — cheap, and it reinforces the concept.

## Imagery

Greyscale photography, optionally with one object left in colour (spot colour). Keep the spot
colour the same hue as the interface accent, or the system falls apart.

## Components

- **Primary button** — the accent's main home.
- **Active nav item** — accent underline plus a weight change, so colour isn't the only cue.
- **Key metric** — the one number that matters, in the accent.
- **Images** — greyscale by default, colour on hover or for the featured item.
- **Everything else** — grey.

## Do

- Define one meaning for the accent and keep to it.
- Use scale and weight for hierarchy.
- Pair the accent with text or an icon wherever it signals state.
- Match spot colour in imagery to the interface accent.

## Don't

- Don't introduce a second accent "just for errors" — use text and iconography instead, or
  accept that error red is the accent.
- Don't let the accent decorate.
- Don't rely on grey alone for important separation.
- Don't drop mid-greys below the contrast floor for body text.

## How Weave verifies it

Deterministic checks count non-greyscale hues painted across the page and their occurrences per
viewport, analyse images for greyscale conversion and spot-colour regions, verify every accent
usage is accompanied by text or an icon, measure contrast, and re-run the base style's checks.
Two judged checks confirm the accent marks the primary focus and reads as deliberate.

Reference pictures: `demo-design/bw-pop-of-color/`.
