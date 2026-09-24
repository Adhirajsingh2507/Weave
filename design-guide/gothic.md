---
slug: gothic
title: Gothic
aliases: [gothic revival, blackletter, cathedral style]
status: ready
summary: Cathedral verticality — blackletter display, pointed arches, deep shadow and stained-glass colour against near-black stone.
best_for: [metal and alternative music, fashion and tattoo studios, horror and fiction, cocktail bars, events]
avoid_for: [family brands, healthcare, finance, anything cheerful]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: stone, value: "#0E0D10" }
      - { name: crypt, value: "#17161B" }
      - { name: bone, value: "#D8D3C8" }
      - { name: blood, value: "#7B1220" }
      - { name: amethyst, value: "#4A2A6B" }
      - { name: candle, value: "#D6A64A" }
      - { name: moss, value: "#2E3B2C" }
  typography:
    scale: display
    families:
      - { role: display, family: "UnifrakturMaguntia, Cinzel Decorative, blackletter, serif", weights: [400] }
      - { role: serif, family: "EB Garamond, Cormorant, Georgia, serif", weights: [400, 600] }
    heading_tracking_em: 0.02
    heading_line_height: 1.15
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: centered
    density: comfortable
    max_width_px: 1080
    section_spacing_px: [72, 120, 176]
    composition: tall vertical proportions, pointed arch frames, symmetry
  shape:
    radius_px: 0
    arch: "pointed arch via clip-path"
    border_px: 1
    shadow: "0 30px 60px rgba(0,0,0,0.7)"
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: solemn
  imagery:
    treatment: [candlelit photography, stone and statuary, stained glass, heavy vignette]
    illustration: engraved ornament, tracery, iconography
    icons: sharp, symmetrical, engraved
checks:
  - { id: goth.shape.arches, rule: "pointed arch shapes are used for framing images or sections", kind: deterministic }
  - { id: goth.layout.vertical, rule: "hero and key blocks use tall proportions, taller than wide", kind: deterministic }
  - { id: goth.type.blackletter-limited, rule: "blackletter is used for display only, never for body or UI labels", kind: deterministic }
  - { id: goth.color.dark-jewel, rule: "grounds are near-black with deep jewel accents; no bright or pastel hues", kind: deterministic }
  - { id: goth.a11y.contrast, rule: "bone text on stone and blood/amethyst fills meets 4.5:1", kind: deterministic }
  - { id: goth.light.vignette, rule: "imagery carries a vignette or directional light rather than even exposure", kind: deterministic }
  - { id: goth.motion.solemn, rule: "transitions are 400ms or slower, fades and vertical reveals only", kind: deterministic }
  - { id: goth.feel.cathedral, rule: "the page reads as architectural and solemn rather than as a dark theme with a spooky font", kind: judged }
---

# Gothic

## The look in one paragraph

Everything points upward. Near-black stone grounds, pointed arches framing images, blackletter
display type over engraved serif text, jewel-toned accents borrowed from stained glass, and
light that falls from one direction as if through a high window. Solemn and vertical, with deep
shadows doing most of the work.

## Layout

- Centred and symmetrical at 1080px, with tall narrow proportions — columns and arches rather
  than wide bands.
- Images sit inside pointed-arch frames (a `clip-path` arch, not a rounded rectangle).
- Generous vertical spacing (72–176px) so the page feels high-ceilinged.

## Typography

- Blackletter for display moments only: the wordmark, a section title, a pull quote. It is
  nearly unreadable at small sizes and must never be used for navigation, buttons or body text.
- An old-style serif for everything else, 17px at `1.75` line height.
- Small caps and drop caps suit openings.

## Colour

Stone black grounds, bone text, and jewel accents: blood red, amethyst, candle gold, deep moss.
Accents behave like stained glass — saturated, but occupying small areas with dark all around.

## Surface and depth

Dark surfaces with 1px hairlines and very deep soft shadows. Depth comes from light: a subtle
gradient falling from the top of a panel, a vignette at the page edges.

## Motion

Solemn: 500ms fades and slow vertical reveals, as though something is rising. No bounce, no
horizontal slides.

## Imagery

Candlelit photography, stone, statuary, tracery, stained glass, heavy vignettes. Everything
lit from one side with real shadow.

## Components

- **Arch frame** — the signature container for imagery and feature blocks.
- **Buttons** — square or arched top, hairline border, serif small-caps label, blood fill for
  primary.
- **Nav** — centred serif links with wide spacing, a hairline beneath.
- **Cards** — dark panels with an arched top edge and an engraved rule under the heading.
- **Drop cap** — a large blackletter initial opening a section.

## Do

- Use arches as the repeating container shape.
- Keep blackletter for display only.
- Light images from a single direction.
- Let vertical space be generous.

## Don't

- Don't set navigation, buttons or body text in blackletter.
- Don't use bright or pastel accents.
- Don't flatten the lighting.
- Don't round corners — the shape language is pointed, not soft.

## How Weave verifies it

Deterministic checks look for arch-shaped `clip-path` framing, compare hero block aspect ratios
for verticality, identify which elements use the blackletter family and flag body or UI usage,
sample the palette for darkness and jewel saturation, measure contrast on accent fills, inspect
imagery for vignetting and directional light, and read motion durations and properties. The
judged check asks whether it reads as architectural rather than merely dark.

Reference pictures: `demo-design/gothic/`.
