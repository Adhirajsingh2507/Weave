---
slug: retro
title: Retro
aliases: [vintage americana, 70s retro, throwback]
status: ready
summary: Seventies warmth — burnt orange and avocado, groovy rounded type, sunburst rays and printed paper texture.
best_for: [food and drink, coffee and breweries, music, apparel, local business, festivals]
avoid_for: [enterprise software, luxury, anything futuristic]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cream, value: "#F4E4C8" }
      - { name: ink, value: "#3A2A1E" }
      - { name: burnt-orange, value: "#D2601A" }
      - { name: avocado, value: "#7C8C3F" }
      - { name: mustard, value: "#E0A72C" }
      - { name: brick, value: "#9C3B23" }
      - { name: teal, value: "#3E7C7B" }
  typography:
    scale: display
    families:
      - { role: display, family: "Cooper Black, Bagel Fat One, Rubik Bubbles, serif", weights: [400] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.05
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1120
    section_spacing_px: [48, 88, 128]
    motifs: sunburst rays, arches, rainbow stripes
  shape:
    radius_px: 999
    arch_radius: "999px 999px 0 0"
    border_px: 3
    shadow: "4px 4px 0 rgba(58, 42, 30, 0.35)"
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.34, 1.4, 0.64, 1)"
    properties: [transform, opacity]
    intensity: bouncy
  imagery:
    treatment: [film grain, warm colour cast, halftone print texture, faded edges]
    illustration: thick-outline retro mascots, sunbursts, stripes
    icons: filled, rounded, chunky
checks:
  - { id: retro.color.warm-palette, rule: "painted colours come from the warm 70s palette; no cool greys or pure white", kind: deterministic }
  - { id: retro.type.display-rounded, rule: "headings use a heavy rounded display face, not a grotesque", kind: deterministic }
  - { id: retro.shape.arches, rule: "at least one arch or fully rounded container appears per page", kind: deterministic }
  - { id: retro.texture.grain, rule: "a paper grain or halftone texture overlays the background at 4-10% opacity", kind: deterministic }
  - { id: retro.motif.stripes, rule: "a sunburst, rainbow stripe or repeated arc motif is present", kind: deterministic }
  - { id: retro.image.warm-cast, rule: "photography carries a warm colour cast and grain rather than neutral colour", kind: deterministic }
  - { id: retro.a11y.contrast-on-warm, rule: "ink on cream and on the orange/mustard fills meets 4.5:1", kind: deterministic }
  - { id: retro.feel.authentic, rule: "the page feels warmly vintage rather than a modern layout with orange accents", kind: judged }
---

# Retro

## The look in one paragraph

A 1974 travel brochure: cream paper, burnt orange and avocado, a fat rounded display face,
sunburst rays behind the hero, arched picture frames and a light halftone texture over
everything. Warm, friendly and a bit groovy, with zero interest in minimalism.

## Layout

- Centred, 1120px, comfortable spacing, arranged in clear horizontal bands.
- Arches are the signature container: images and cards with a fully rounded top.
- Rays, stripes or arcs radiate from behind the hero, clipped by the section edge.

## Typography

- A heavy rounded display face (Cooper Black and relatives) for headings — the single most
  recognisable element of the style.
- A plain sans for body copy so the page stays readable.
- Headings tight at `1.05`, often on a curve or inside an arch.

## Colour

Cream ground, dark warm ink, and the burnt orange / avocado / mustard / brick family. Teal is
the cool accent. Flat fills, no gradients except in a sunburst.

## Surface and depth

Flat with printed depth: 3px ink borders, hard offset shadows in warm brown, and a grain
overlay across the whole page so it reads as printed rather than rendered.

## Motion

Bouncy but gentle: 300ms with a slight overshoot, arches rising into place, sunburst slowly
rotating behind the hero (stopped under reduced-motion).

## Imagery

Warm-cast photography with grain and slightly faded edges, retro mascots with thick outlines,
striped and starburst patterns. Photos sit in arched or circular frames.

## Components

- **Buttons** — pills with flat warm fills, 3px ink border, hard offset shadow.
- **Nav** — cream bar with rounded links; active item gets a mustard pill.
- **Cards** — arched tops, ink borders, flat fills.
- **Badges** — circular "seal" badges with text around the curve.
- **Dividers** — striped or wavy rules rather than plain lines.

## Do

- Use the arch as a repeating container shape.
- Keep grain on at 4–10%.
- Let the display face be genuinely large.
- Stick to flat warm fills.

## Don't

- Don't use cool greys or pure white.
- Don't pair the display face with a second decorative face.
- Don't let the grain reduce text contrast.
- Don't use modern soft shadows.

## How Weave verifies it

Deterministic checks sample painted colours against the warm palette, identify the heading font
class, detect arch-shaped radii and repeated motif elements, measure grain overlay opacity, test
imagery for warm colour cast, and re-measure contrast with the texture applied. The judged check
asks whether it reads as genuinely vintage.

Reference pictures: `demo-design/retro/`.
