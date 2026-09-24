---
slug: low-exposure-candlelit
title: Low Exposure + Candlelight
aliases: [candlelit, low key, warm darkness]
status: ready
summary: A combination layer — underexposed warm darkness lit by a single small source, with most of the frame left in shadow.
best_for: [restaurants and bars, fragrance, jewellery, hospitality, film and music]
avoid_for: [utility software, documentation, bright consumer brands, anything read at length]
inherits: _base.md
combination: true
tokens:
  colors:
    mode: dark
    palette:
      - { name: dark, value: "#0B0907" }
      - { name: shadow, value: "#171310" }
      - { name: ember, value: "#C97B3C" }
      - { name: candle, value: "#E8B978" }
      - { name: warm-white, value: "#F0E2CC" }
      - { name: muted, value: "#9C8B76" }
    gradients:
      - { name: candlelight, value: "radial-gradient(40% 40% at 30% 35%, rgba(232,185,120,0.30) 0%, rgba(201,123,60,0.12) 45%, transparent 75%)" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, EB Garamond, Georgia, serif", weights: [300, 500] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.04
    heading_line_height: 1.3
    body_size_px: 17
    body_line_height: 1.8
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1120
    section_spacing_px: [80, 128, 176]
    composition: one lit focal area per section, the rest in shadow
  shape:
    radius_px: 2
    border_px: 1
    shadow: none
  motion:
    duration_ms: 700
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: flickering-slow
  imagery:
    treatment: [underexposed warm photography, single light source, deep shadow, visible grain]
    illustration: none
    icons: hairline in warm white
  combination:
    applies_over: any base style with a dark mode
    layers: ["underexpose imagery and grounds", "add one warm radial light source per section", "raise text size and warmth to stay readable in the dark"]
checks:
  - { id: candle.light.single-source, rule: "each section has one warm radial light area with the rest in shadow", kind: deterministic }
  - { id: candle.color.warm-dark, rule: "grounds are warm near-black; no cool greys or blue-blacks", kind: deterministic }
  - { id: candle.a11y.contrast-in-shadow, rule: "text placed in shadow areas meets 4.5:1 against the actual rendered darkness", kind: deterministic }
  - { id: candle.text.size, rule: "body text is 17px or larger, since low-key palettes reduce apparent legibility", kind: deterministic }
  - { id: candle.image.exposure, rule: "imagery is underexposed with warm highlights and visible grain, not simply darkened", kind: deterministic }
  - { id: candle.motion.flicker, rule: "any light flicker is slow, under 1Hz, and stops under prefers-reduced-motion", kind: deterministic }
  - { id: candle.base.preserved, rule: "the base style's layout and type rules still hold beneath the treatment", kind: deterministic }
  - { id: candle.feel.intimate, rule: "the page feels intimate and lit rather than simply dark", kind: judged }
---

# Low Exposure + Candlelight

## The look in one paragraph

A treatment for dark styles: underexpose everything, then light each section with one small
warm source — a candle, a lamp, a window at dusk. Most of the frame stays in shadow, warm
highlights fall on the subject, and the type gets a little larger and warmer so it survives the
darkness.

## How to combine it

1. Start from a base style that has a dark mode and keep its layout and type rules.
2. Shift its dark grounds warm: near-black with a brown or amber bias, never blue-black.
3. Add one radial warm light per section, positioned off-centre, fading to nothing.
4. Place content in or near the lit area; check contrast where text falls into shadow.
5. Raise body size and line height slightly — low-key palettes read as less legible.

## Layout

- Asymmetric and spacious. The lit area is the focal point; content clusters near it.
- Sections are separated by darkness rather than rules.

## Typography

- A light serif for headings with open tracking; a plain sans for small labels.
- Body at 17px minimum with `1.8` line height, in warm white rather than pure white.

## Colour

Warm near-black grounds, ember and candle tones for light, warm white for text, and a muted
warm grey for secondary copy. No cool tones anywhere — a single blue-grey will make the page
look merely dark rather than candlelit.

## Surface and depth

Depth is light falloff. Panels barely exist: a hairline border, a 2px radius, no shadows
(pointless in darkness). What separates elements is how much light reaches them.

## Motion

Slow: 700ms fades. If the light flickers, it does so slowly — under 1Hz — and stops entirely
under reduced-motion.

## Imagery

Underexposed photography with one warm source, deep shadows retaining a little detail, visible
grain. Darkening a normally-exposed image does not produce this; the highlights have to fall
off naturally.

## Do

- Keep one light source per section.
- Bias everything warm.
- Raise text size and warmth.
- Measure contrast where text sits in shadow.

## Don't

- Don't use cool blacks or greys.
- Don't simply reduce brightness on normal images.
- Don't place long text in the darkest areas.
- Don't flicker fast enough to distract or trigger discomfort.

## How Weave verifies it

Deterministic checks sample rendered luminance per section to confirm a single lit region against
shadow, check ground colours for warm hue bias, measure contrast at the darkest text positions,
read body text size, analyse imagery for genuine underexposure characteristics and grain, measure
flicker frequency, and re-run the base style's checks. The judged check asks whether the page
feels lit rather than dimmed.

Reference pictures: `demo-design/low-exposure-candlelit/`.
