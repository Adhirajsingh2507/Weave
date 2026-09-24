---
slug: vaporwave
title: Vaporwave
aliases: [aesthetic, a e s t h e t i c, mallsoft]
status: ready
summary: Sun-bleached pink and cyan nostalgia — Roman busts, grid horizons, Japanese katakana and VHS decay, all slightly melancholy.
best_for: [music, art projects, merch drops, nostalgia campaigns, playlist and radio sites]
avoid_for: [enterprise, healthcare, anything needing to be taken literally]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: dusk, value: "#1A0B2E" }
      - { name: pink, value: "#FF6AD5" }
      - { name: cyan, value: "#26F0F1" }
      - { name: lavender, value: "#C774E8" }
      - { name: peach, value: "#FFC5C5" }
      - { name: foreground, value: "#F6E9FF" }
      - { name: grid, value: "#8C1EFF" }
    gradients:
      - { name: sunset, value: "linear-gradient(180deg, #FF6AD5 0%, #C774E8 45%, #26F0F1 100%)" }
      - { name: horizon, value: "linear-gradient(0deg, #1A0B2E 0%, #8C1EFF 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "VCR OSD Mono, Monument Extended, Arial Black, sans-serif", weights: [700] }
      - { role: serif, family: "Times New Roman, Didot, serif", weights: [400] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.3
    heading_case: uppercase
    heading_line_height: 1.1
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1120
    section_spacing_px: [48, 88, 128]
    overlay: VHS scanlines, chromatic aberration, soft bloom
  shape:
    radius_px: 4
    border_px: 2
    shadow: "6px 6px 0 rgba(38, 240, 241, 0.7)"
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.45, 0, 0.55, 1)"
    properties: [transform, opacity, filter]
    intensity: dreamy
  imagery:
    treatment: [classical statuary, palm trees, grid horizons, VHS artefacts, mall interiors]
    illustration: low-poly 3D, wireframe grids, dolphins and windows iconography
    icons: pixel or chunky outline
checks:
  - { id: vapor.color.pink-cyan, rule: "the pink and cyan tokens both appear prominently", kind: deterministic }
  - { id: vapor.color.gradient-sky, rule: "at least one large vertical sunset gradient is present", kind: deterministic }
  - { id: vapor.type.wide-tracking, rule: "display headings are uppercase with tracking >= 0.25em", kind: deterministic }
  - { id: vapor.effect.scanlines, rule: "a scanline or VHS noise overlay is present under 15% opacity", kind: deterministic }
  - { id: vapor.effect.chromatic, rule: "at least one element uses a chromatic-aberration or offset-shadow treatment", kind: deterministic }
  - { id: vapor.a11y.contrast-pastel, rule: "pastel text on the dusk ground still meets 4.5:1", kind: deterministic }
  - { id: vapor.motion.slow, rule: "ambient motion is 500ms or slower and stops under prefers-reduced-motion", kind: deterministic }
  - { id: vapor.feel.nostalgia, rule: "the page reads as wistful 90s-mall nostalgia rather than generic neon", kind: judged }
---

# Vaporwave

## The look in one paragraph

A half-remembered 1993 shopping mall at sunset: pink-to-cyan gradient skies, a purple wireframe
grid running to the horizon, a marble bust, katakana next to English, VHS tracking lines across
everything. Letter-spacing is absurdly wide. The mood is nostalgic and a little sad, never
energetic.

## Layout

- Centred, 1120px, with comfortable spacing and plenty of room around a single focal image.
- The hero is a scene: gradient sky, grid floor, one object (statue, palm, window) centred in it.
- Sections are composed like album covers — one image, one wide-tracked title, little else.

## Typography

- A VCR/mono or extended display face for titles, uppercase, tracked out to `0.3em` so the word
  spreads across the screen.
- A Times-style serif for small classical touches; a plain sans for anything that must be read.
- Full-width (zenkaku) characters and katakana are part of the vocabulary, used as decoration
  alongside a readable translation.

## Colour

Dusk purple ground with pink, cyan, lavender and peach. Gradients do the heavy lifting — the
sky gradient and the horizon glow. Everything is slightly washed out rather than fully
saturated.

## Surface and depth

Flat panels with 2px borders and hard cyan offset shadows. Depth is suggested by the grid
horizon and by soft bloom around bright elements.

## Motion

Dreamy and slow: 600ms drifts, a slowly scrolling grid, gentle floating of the hero object,
VHS tracking lines rolling down the screen. All ambient motion stops under reduced-motion.

## Imagery

Classical statuary, palm silhouettes, chrome text, early-3D objects, mall interiors, dolphins,
old OS windows. Apply a wash: lowered contrast, slight magenta/cyan channel offset, grain.

## Components

- **Buttons** — bordered rectangles with a hard cyan offset shadow and wide-tracked uppercase labels.
- **Nav** — a thin bar with tracked-out links, sometimes styled as an old window title bar.
- **Cards** — bordered panels with a gradient header and a classical thumbnail.
- **Window chrome** — retro OS window frames as a container motif, complete with fake title bars.
- **Inputs** — flat fields with 2px borders and cyan focus glow plus a real focus ring.

## Do

- Let one gradient sky dominate the hero.
- Track titles out until they nearly break.
- Keep motion slow and ambient.
- Mix scripts decoratively, with the readable version nearby.

## Don't

- Don't use katakana as the only label for a control.
- Don't saturate to neon brightness — this is faded, not electric.
- Don't let the scanline overlay reduce text contrast.
- Don't rush the animation.

## How Weave verifies it

Deterministic checks sample painted colours for the pink/cyan pair, detect large vertical
gradients, read heading case and tracking, look for the scanline/noise overlay and its opacity,
find chromatic-offset treatments, measure pastel-on-dark contrast, and read animation durations
plus reduced-motion behaviour. The judged check asks whether the mood reads as nostalgic rather
than as generic neon.

Reference pictures: `demo-design/vaporwave/`.
