---
slug: synthwave
title: Synthwave
aliases: [outrun, retrowave, 80s neon]
status: ready
summary: Eighties movie poster energy — chrome-and-neon titles over a purple sunset, horizon grid, and everything glowing.
best_for: [music and events, gaming, fitness brands, product launches wanting drama, dev tools with attitude]
avoid_for: [enterprise, healthcare, editorial, anything subtle]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: night, value: "#0B0420" }
      - { name: deep-purple, value: "#2B0F54" }
      - { name: magenta, value: "#FF2E88" }
      - { name: orange, value: "#FF8A3D" }
      - { name: cyan, value: "#29E7FF" }
      - { name: foreground, value: "#F4ECFF" }
      - { name: grid, value: "#FF2E88" }
    gradients:
      - { name: sun, value: "linear-gradient(180deg, #FFE45E 0%, #FF8A3D 40%, #FF2E88 100%)" }
      - { name: sky, value: "linear-gradient(180deg, #0B0420 0%, #2B0F54 60%, #FF2E88 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Monument Extended, Streetwear, Outrun future, sans-serif", weights: [700, 800] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.02
    heading_case: uppercase
    heading_line_height: 0.95
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: centered
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [56, 96, 144]
    hero: horizon line with perspective grid and setting sun
  shape:
    radius_px: 6
    border_px: 2
    shadow: "0 0 24px rgba(255, 46, 136, 0.55)"
  motion:
    duration_ms: 320
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [transform, opacity, filter]
    intensity: cinematic
  imagery:
    treatment: [perspective grids, setting sun stripes, chrome type, palm silhouettes, sports cars]
    illustration: retro 3D wireframe, airbrushed gradients
    icons: chunky outline with glow
checks:
  - { id: synth.color.sunset-gradient, rule: "a multi-stop sunset gradient (yellow to magenta) is present", kind: deterministic }
  - { id: synth.layout.horizon-grid, rule: "the hero contains a perspective grid or horizon element", kind: deterministic }
  - { id: synth.effect.glow, rule: "headings and primary controls carry magenta or cyan glow shadows", kind: deterministic }
  - { id: synth.type.display-uppercase, rule: "display headings are uppercase, extended or heavy, at 0.95 line height", kind: deterministic }
  - { id: synth.color.dark-ground, rule: "page background luminance below 15% outside the sunset area", kind: deterministic }
  - { id: synth.a11y.glow-not-contrast, rule: "text contrast is measured without glow and still meets 4.5:1", kind: deterministic }
  - { id: synth.motion.reduced, rule: "grid scrolling and glow pulsing stop under prefers-reduced-motion", kind: deterministic }
  - { id: synth.feel.poster, rule: "the hero reads like an 80s movie poster, with one dominant title and horizon", kind: judged }
---

# Synthwave

## The look in one paragraph

A purple night sky, a striped sun sinking behind a magenta perspective grid, and a huge
chrome-or-neon title sitting dead centre. Everything glows. It's the same neon family as
cyberpunk but the opposite mood: nostalgic, cinematic and optimistic rather than grimy.

## Layout

- Centred composition at 1200px — this style is poster-shaped, not application-shaped.
- The hero is a scene with a horizon: sun, grid floor, title. Content sections sit below it on
  flatter dark ground.
- Symmetry is welcome here, unlike most styles in this set.

## Typography

- An extended or heavy display face, uppercase, at `0.95` line height, usually with a chrome
  gradient fill or a magenta-to-cyan neon outline.
- A plain sans for all body copy on solid dark panels.
- Titles may carry a soft outer glow and a thin dark outline to hold their edge.

## Colour

Night and deep purple grounds, with magenta, orange and cyan as light. The sunset gradient
(yellow → orange → magenta) is the signature; the grid is always magenta or cyan.

## Surface and depth

Panels are dark with 2px neon borders and outer glow. Depth is atmospheric: haze near the
horizon, glow bleeding from bright elements, subtle vignette at the edges.

## Motion

Cinematic: 320ms, elements easing in, grid slowly scrolling toward the horizon, glow gently
pulsing. Ambient motion stops under reduced-motion.

## Imagery

Perspective grids, striped suns, palm silhouettes, chrome lettering, sports cars, mountains in
haze. Airbrushed gradients rather than photography.

## Components

- **Buttons** — pill or 6px radius, gradient or neon-outline fill, glow on hover, uppercase label.
- **Nav** — dark translucent bar, neon underline on the active item.
- **Cards** — dark panels with a neon top edge and a subtle inner haze.
- **Hero title** — the centrepiece: chrome or neon, centred, with the grid behind it.
- **Inputs** — dark fill, neon focus glow plus a solid focus ring.

## Do

- Build the hero as a scene with a horizon.
- Use the sunset gradient once, big.
- Keep body copy on solid panels away from the glow.
- Let the composition be symmetrical.

## Don't

- Don't count glow toward contrast.
- Don't mix in grime or decay — that's cyberpunk.
- Don't glow every element; pick the title and the primary action.
- Don't leave the grid animating under reduced-motion.

## How Weave verifies it

Deterministic checks look for the multi-stop sunset gradient, detect a perspective grid or
horizon element in the hero, read shadow colours and blur for glow, check heading case, weight
class and line height, sample ground luminance outside the sunset region, and measure text
contrast with glow excluded. Reduced-motion is verified by frame diffing. The judged check asks
whether the hero reads as a poster.

Reference pictures: `demo-design/synthwave/`.
