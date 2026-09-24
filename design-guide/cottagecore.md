---
slug: cottagecore
title: Cottagecore
aliases: [rural romantic, pastoral, farmhouse aesthetic]
status: ready
summary: Gentle countryside nostalgia — gingham and florals, soft daylight, hand-lettering and the warmth of a kitchen table.
best_for: [bakeries and preserves, farm shops, craft and knitting, wedding and stationery, slow-living blogs]
avoid_for: [technology, finance, urban nightlife, anything fast or corporate]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cream, value: "#FBF6EA" }
      - { name: butter, value: "#F2DFA7" }
      - { name: sage, value: "#A8B79A" }
      - { name: rose, value: "#D9A0A3" }
      - { name: wheat, value: "#C9A66B" }
      - { name: ink, value: "#453A2F" }
      - { name: gingham, value: "#B85C5C" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, Lora, Georgia, serif", weights: [400, 600] }
      - { role: hand, family: "Caveat, Parisienne, cursive", weights: [400] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: centered
    density: comfortable
    max_width_px: 1100
    section_spacing_px: [64, 104, 144]
    motifs: gingham and floral patterns, scalloped edges, pressed flowers
  shape:
    radius_px: 16
    scallop: "scalloped edges on cards and dividers"
    border_px: 1
    shadow: "0 8px 20px rgba(69, 58, 47, 0.08)"
  motion:
    duration_ms: 460
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: gentle
  imagery:
    treatment: [soft daylight, baking and gardens, linen and wildflowers, warm film grain]
    illustration: pressed flowers, botanical sketches, hand-drawn borders
    icons: thin hand-drawn line with a floral accent
checks:
  - { id: cottage.pattern.gingham, rule: "a gingham, floral or ticking-stripe pattern appears as a background or accent", kind: deterministic }
  - { id: cottage.color.soft-warm, rule: "the palette is soft warm cream, sage, rose and butter; nothing saturated or cool", kind: deterministic }
  - { id: cottage.shape.scallop, rule: "at least one element uses a scalloped or softly curved edge", kind: deterministic }
  - { id: cottage.type.hand-limited, rule: "the script face is used for accents only; body copy uses the serif", kind: deterministic }
  - { id: cottage.image.daylight, rule: "photography is soft natural daylight with warm grain, not studio or flash lighting", kind: deterministic }
  - { id: cottage.a11y.contrast, rule: "ink on cream and on every pastel fill meets 4.5:1", kind: deterministic }
  - { id: cottage.a11y.pattern-behind-text, rule: "no body copy sits directly on a gingham or floral pattern", kind: deterministic }
  - { id: cottage.feel.homemade, rule: "the page feels homemade and warm rather than a pastel corporate template", kind: judged }
---

# Cottagecore

## The look in one paragraph

A kitchen table in the afternoon: cream and butter tones, a gingham cloth, wildflowers in a jar,
soft daylight, a serif with a little warmth and a script flourish for the greeting. Everything
is gentle, nothing is urgent, and the photography smells faintly of baking.

## Layout

- Centred at 1100px with comfortable spacing.
- Pattern bands (gingham, ticking stripe, small floral) separate sections.
- Cards and dividers have scalloped or softly curved edges, like pinked fabric.

## Typography

- A warm serif for headings and body — `1.25` heading line height, `1.75` for body at 17px.
- A script face for one or two accents: a welcome, a signature, a recipe title.
- Small caps or spaced serif for labels.

## Colour

Cream ground, butter and wheat warmth, sage green, dusty rose, and a deeper gingham red for
patterns and accents. Everything soft, warm and slightly faded.

## Surface and depth

Soft: 16px radii, scalloped edges, hairline borders, and very light warm shadows. Nothing
sharp, nothing glossy.

## Motion

Gentle: 460ms fades and small rises, like a curtain moving. Nothing bounces.

## Imagery

Soft daylight photography of baking, gardens, linen, preserves and wildflowers, with warm grain.
Pressed-flower and botanical sketch illustration.

## Components

- **Pattern band** — gingham or floral strip dividing sections.
- **Scalloped card** — cream fill, curved edge, hairline border, small floral corner.
- **Buttons** — rounded, sage or rose fill, serif label.
- **Recipe/list block** — serif with hand-drawn bullets and plenty of space.
- **Signature** — a script line closing a section.

## Do

- Keep patterns as bands and accents, behind headings rather than paragraphs.
- Keep the palette soft and warm.
- Use scalloped or curved edges somewhere on every page.
- Photograph in daylight.

## Don't

- Don't set body copy over gingham or florals.
- Don't use cool greys, black or saturated colour.
- Don't set paragraphs in script.
- Don't use studio or flash-lit photography.

## How Weave verifies it

Deterministic checks detect pattern backgrounds and where they sit relative to text, convert the
palette to HSL for softness and warmth, look for scalloped or curved edge treatments, identify
script-font usage and flag body copy, analyse image lighting characteristics, and measure
contrast on every pastel fill. The judged check asks whether it feels homemade rather than
templated.

Reference pictures: `demo-design/cottagecore/`.
