---
slug: acid-graphics
title: Acid Graphics
aliases: [acid design, rave graphics, chrome acid, y2k acid]
status: ready
summary: Rave flyer energy — chrome and iridescent gradients, warped type, hard-edged 3D objects and colour that buzzes.
best_for: [club nights and festivals, streetwear, music labels, energy drinks, youth campaigns]
avoid_for: [corporate, healthcare, finance, anything reserved]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: void, value: "#050510" }
      - { name: acid-green, value: "#A8FF00" }
      - { name: electric-violet, value: "#7B2BFF" }
      - { name: hot-orange, value: "#FF5E00" }
      - { name: ice, value: "#DFF6FF" }
      - { name: chrome-mid, value: "#9BA6B5" }
      - { name: foreground, value: "#F2F4FA" }
    gradients:
      - { name: iridescent, value: "linear-gradient(120deg, #A8FF00 0%, #00E5FF 30%, #7B2BFF 60%, #FF5E00 100%)" }
      - { name: chrome, value: "linear-gradient(170deg, #FFFFFF 0%, #9BA6B5 35%, #2D3440 55%, #E9EEF5 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Monument Extended, Clash Display, Anton, sans-serif", weights: [700, 800] }
      - { role: mono, family: "JetBrains Mono, ui-monospace, monospace", weights: [400, 700] }
    heading_tracking_em: -0.03
    heading_case: uppercase
    heading_line_height: 0.9
    body_size_px: 16
    body_line_height: 1.5
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1400
    section_spacing_px: [32, 64, 96]
    composition: warped type, stickers, objects breaking the grid
  shape:
    radius_px: 999
    secondary_radius_px: 0
    border_px: 2
    shadow: "0 0 30px rgba(168, 255, 0, 0.35)"
  motion:
    duration_ms: 200
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [transform, background-position, filter]
    intensity: high-energy
  imagery:
    treatment: [3D chrome and liquid objects, iridescent foil, warped photography, sticker cutouts]
    illustration: hard-edged 3D renders
    icons: filled with gradient, chunky
checks:
  - { id: acid.color.iridescent, rule: "at least one iridescent multi-hue gradient is present", kind: deterministic }
  - { id: acid.type.warped, rule: "at least one display heading is warped, arched or stretched", kind: deterministic }
  - { id: acid.color.acid-pair, rule: "acid green or violet appears against the dark ground at full saturation", kind: deterministic }
  - { id: acid.object.3d, rule: "a rendered 3D chrome or liquid object appears in the hero", kind: deterministic }
  - { id: acid.a11y.body-plain, rule: "body copy is solid-colour on a solid ground, never gradient-filled or warped", kind: deterministic }
  - { id: acid.a11y.contrast, rule: "acid colours used for text meet 4.5:1 against their actual background", kind: deterministic }
  - { id: acid.motion.energy, rule: "hover and scroll motion is under 250ms and stops under prefers-reduced-motion", kind: deterministic }
  - { id: acid.feel.flyer, rule: "the page reads as a club flyer with energy and hierarchy, not as random gradient soup", kind: judged }
---

# Acid Graphics

## The look in one paragraph

A rave flyer rendered in 3D: near-black ground, acid green and electric violet at full
saturation, iridescent foil gradients, chrome objects floating in the hero, and display type
warped along an arc or stretched past its natural proportions. Fast, loud, and built to be seen
on a phone at night.

## Layout

- Wide (1400px), compact spacing, asymmetric. Elements are stacked and overlapping like layered
  stickers.
- The hero is a composition: warped title, a chrome object, small mono details scattered around
  the edges.
- Information sections are plainer — solid panels with straightforward type — so the flyer
  energy stays in the hero and section openers.

## Typography

- An extended heavy display face, uppercase, tight (`-0.03em`, `0.9`), frequently warped with an
  arc or perspective transform.
- Mono for details: dates, times, catalogue numbers, tiny print around the edges.
- Body copy plain and solid, never gradient-filled.

## Colour

Near-black void with acid green, electric violet and hot orange at full saturation, plus an
iridescent gradient and a chrome ramp. Colour is meant to buzz — but only in large shapes and
display type.

## Surface and depth

Pills and squares together, 2px borders, and coloured glow shadows. Depth comes from the 3D
objects and overlapping layers rather than from elevation systems.

## Motion

High-energy but short: 200ms, gradients sliding across fills, objects rotating slowly, stickers
popping on hover. Everything ambient stops under reduced-motion.

## Imagery

Rendered chrome and liquid-metal objects, iridescent foil textures, warped or stretched
photography, sticker cut-outs with hard outlines.

## Components

- **Hero object** — a 3D chrome form, rotating slowly, anchoring the composition.
- **Warped title** — display type on an arc or in perspective, as an SVG with real text.
- **Buttons** — pills with iridescent or acid fills and a dark label, glow on hover.
- **Sticker badge** — a small rotated pill with mono text for dates or tags.
- **Info panel** — solid dark panel, plain type, normal spacing.

## Do

- Keep one warped title per screen.
- Put the energy in the hero and the section openers.
- Use mono details to fill the margins.
- Keep body copy solid and plain.

## Don't

- Don't gradient-fill or warp body text.
- Don't stack three gradients on one element.
- Don't let acid colours fall under the contrast floor.
- Don't animate everything simultaneously.

## How Weave verifies it

Deterministic checks detect multi-hue gradients, look for warp transforms or SVG text paths on
headings, sample palette saturation against the dark ground, confirm a 3D object asset loads in
the hero, verify body copy uses solid colour on solid backgrounds, measure contrast, and read
motion durations plus reduced-motion behaviour. The judged check asks whether the page reads as
a flyer with hierarchy.

Reference pictures: `demo-design/acid-graphics/`.
