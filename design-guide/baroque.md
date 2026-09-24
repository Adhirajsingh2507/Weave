---
slug: baroque
title: Baroque
aliases: [baroque revival, chiaroscuro, dramatic classical]
status: ready
summary: Theatrical excess — dramatic light against deep shadow, gold ornament, swirling movement and painterly imagery.
best_for: [luxury fashion, perfume and spirits, opera and theatre, fine dining, art exhibitions]
avoid_for: [tech products, minimal brands, anything needing clarity over drama]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: shadow, value: "#100C0A" }
      - { name: umber, value: "#2A1D14" }
      - { name: gold, value: "#C39A3E" }
      - { name: ivory, value: "#EFE4CE" }
      - { name: crimson, value: "#7A1220" }
      - { name: emerald, value: "#194B3C" }
    gradients:
      - { name: chiaroscuro, value: "radial-gradient(60% 55% at 35% 25%, rgba(239,228,206,0.22) 0%, transparent 65%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Cormorant Garamond, Playfair Display, Didot, serif", weights: [300, 600] }
      - { role: serif, family: "EB Garamond, Georgia, serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.1
    body_size_px: 18
    body_line_height: 1.75
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [72, 120, 172]
    composition: diagonal movement, dramatic focal point, ornament in the corners
  shape:
    radius_px: 0
    border_px: 1
    border_style: gilt hairline with corner flourishes
    shadow: "0 40px 90px rgba(0,0,0,0.65)"
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform, scale]
    intensity: sweeping
  imagery:
    treatment: [chiaroscuro photography, old-master paintings, draped fabric, still life]
    illustration: gilt filigree, cartouches, acanthus scroll
    icons: ornamental, gilt, asymmetric flourish
checks:
  - { id: baroque.light.chiaroscuro, rule: "a strong directional light gradient creates a bright focal area against deep shadow", kind: deterministic }
  - { id: baroque.layout.diagonal, rule: "the hero composition follows a diagonal rather than a centred axis", kind: deterministic }
  - { id: baroque.ornament.gilt, rule: "gilt filigree or cartouche ornament frames at least one section", kind: deterministic }
  - { id: baroque.type.high-contrast-serif, rule: "display type is a high-contrast serif, with light and semibold weights paired", kind: deterministic }
  - { id: baroque.color.deep-jewel, rule: "grounds are deep umber or near-black with gold, crimson and emerald accents", kind: deterministic }
  - { id: baroque.a11y.contrast-in-shadow, rule: "ivory text over the darkest regions and gold over umber both meet 4.5:1", kind: deterministic }
  - { id: baroque.motion.sweep, rule: "transitions are 500ms or slower with scale and fade, never abrupt", kind: deterministic }
  - { id: baroque.feel.drama, rule: "the page reads as theatrical and painterly rather than as dark luxury boilerplate", kind: judged }
---

# Baroque

## The look in one paragraph

Drama staged with light. A deep umber darkness with one brightly lit focal area, compositions
that move on a diagonal, gilt ornament curling into the corners, painterly imagery of fabric
and still life, and a high-contrast serif set large and airy. Where Art Deco is symmetrical and
geometric, Baroque is asymmetrical and in motion.

## Layout

- Asymmetric at 1200px, built around a diagonal: the eye enters bright at one corner and travels
  to the opposite.
- One dominant focal element per section, lit; everything else falls away into shadow.
- Ornament collects in corners and edges rather than framing content evenly.

## Typography

- A high-contrast display serif, using a light weight at large size for elegance and a semibold
  for emphasis.
- Body in an old-style serif, 18px at `1.75` — generous, unhurried.
- Italics are used expressively for subtitles and quotes.

## Colour

Deep shadow and umber grounds with gold as light, ivory for text, crimson and emerald as
theatrical accents. Colour is rich and low-key; brightness is reserved for the lit focal area.

## Surface and depth

Depth comes from light, not from panels: a radial highlight behind the focal element, deep
shadow at the edges, gilt hairlines with corner flourishes marking boundaries.

## Motion

Sweeping: 600ms, elements scaling up slightly as they fade in, the light gradient drifting
slowly. Everything is slow and continuous.

## Imagery

Chiaroscuro photography, old-master paintings, draped fabric, still life with fruit and metal.
Subject lit from one side with the background falling into darkness.

## Components

- **Hero** — one lit focal image, a serif headline placed on the diagonal, gilt flourish in a corner.
- **Buttons** — gilt hairline outline with ivory small-caps label; crimson fill for primary.
- **Cards** — dark panels with a gilt corner flourish and an illuminated top edge.
- **Quotes** — large italic serif over a shadowed backdrop with a gilt rule.
- **Inputs** — square fields, gilt hairline, ivory text, warm focus glow plus a real focus ring.

## Do

- Build every section around one lit focal point.
- Compose on a diagonal.
- Let shadow occupy most of the page.
- Use gold as light rather than as a fill.

## Don't

- Don't centre everything — that's Deco, not Baroque.
- Don't flatten the lighting or use even exposure.
- Don't let ivory text sit in the brightest part of the highlight without checking contrast.
- Don't use geometric or sans typefaces.

## How Weave verifies it

Deterministic checks sample rendered luminance across the viewport to confirm a bright focal
region against deep shadow, analyse element positions for a diagonal composition, detect gilt
ornament elements, read font classes and weight pairings, sample the palette, and measure
contrast in both the darkest and brightest regions. The judged check asks whether the result is
theatrical rather than generic dark luxury.

Reference pictures: `demo-design/baroque/`.
