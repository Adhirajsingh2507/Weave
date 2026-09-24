---
slug: atompunk
title: Atompunk
aliases: [atomic age, raygun gothic, 1950s futurism]
status: ready
summary: Nuclear-age optimism — starbursts and boomerangs, rocket fins, turquoise and atomic orange, and confident mid-century sans type.
best_for: [diners and retro food, motels and travel, games, toy and collectible brands, event campaigns]
avoid_for: [enterprise, minimal luxury, anything contemporary-serious]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cream, value: "#F7EEDD" }
      - { name: turquoise, value: "#3FBFB0" }
      - { name: atomic-orange, value: "#E95A1F" }
      - { name: charcoal, value: "#25221F" }
      - { name: mustard, value: "#E8B83C" }
      - { name: cherry, value: "#C42B2B" }
      - { name: sky, value: "#9FD4E8" }
  typography:
    scale: display
    families:
      - { role: display, family: "Bungee, Alfa Slab One, Futura, sans-serif", weights: [400, 700] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.02
    heading_case: uppercase
    heading_line_height: 1.05
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [48, 88, 128]
    motifs: starbursts, boomerangs, atoms, parabolas, rocket fins
  shape:
    radius_px: 999
    secondary_radius_px: 4
    border_px: 3
    shadow: "5px 5px 0 rgba(37, 34, 31, 0.35)"
  motion:
    duration_ms: 280
    easing: "cubic-bezier(0.34, 1.45, 0.64, 1)"
    properties: [transform, rotate, opacity]
    intensity: zippy
  imagery:
    treatment: [screen-print texture, halftone dots, retro advertising photography, starburst overlays]
    illustration: atomic diagrams, rockets, ray guns, boomerang shapes
    icons: filled with a thin outline, rounded
checks:
  - { id: atom.motif.starburst, rule: "starburst, boomerang or atom motifs appear as structural decoration", kind: deterministic }
  - { id: atom.color.midcentury, rule: "palette pairs turquoise and atomic orange against cream", kind: deterministic }
  - { id: atom.type.display-caps, rule: "headings are uppercase in the slab or geometric display face", kind: deterministic }
  - { id: atom.texture.screenprint, rule: "a halftone or screen-print texture overlays fills at 4-12% opacity", kind: deterministic }
  - { id: atom.shape.parabola, rule: "at least one container uses a parabolic, capsule or angled-fin shape", kind: deterministic }
  - { id: atom.a11y.contrast, rule: "charcoal on cream and text on turquoise or orange meet 4.5:1", kind: deterministic }
  - { id: atom.motion.zippy, rule: "motion is under 300ms with slight overshoot and stops under prefers-reduced-motion", kind: deterministic }
  - { id: atom.feel.optimism, rule: "the page reads as 1950s atomic optimism rather than generic retro", kind: judged }
---

# Atompunk

## The look in one paragraph

The atomic age selling itself: cream ground, turquoise and atomic orange, starbursts radiating
behind headlines, boomerang and parabola shapes, rocket fins on the corners of panels, and
chunky uppercase display type. Screen-print texture over everything, as though printed on a
1957 motel brochure.

## Layout

- Asymmetric at 1200px, built from capsule and parabola shapes rather than plain rectangles.
- Starbursts and atom diagrams sit behind headlines and prices.
- Sections tilt slightly and overlap, with fin shapes extending from panel corners.

## Typography

- A chunky slab or geometric display face, uppercase, at `1.05` line height with slight open
  tracking.
- A plain sans for body at 17px.
- Prices, numbers and callouts get the display treatment inside a starburst.

## Colour

Cream ground with turquoise and atomic orange as the defining pair, mustard and cherry as
support, sky blue for backgrounds. Flat fills with screen-print texture, no gradients.

## Surface and depth

Flat print with hard charcoal offset shadows and 3px outlines. Capsule and parabolic shapes
carry the era's geometry; depth is layered paper, not elevation.

## Motion

Zippy: 280ms with a slight overshoot, starbursts rotating slowly, panels sliding in on an
angle. Ambient rotation stops under reduced-motion.

## Imagery

Retro advertising photography with halftone dots, screen-print texture, atomic diagrams,
rockets and ray guns, googie architecture.

## Components

- **Starburst callout** — a price or claim inside a radiating burst.
- **Capsule panel** — a rounded-end container with a fin or angled corner.
- **Buttons** — pills with flat fills, 3px outline, hard shadow, uppercase label.
- **Nav** — a cream bar with a boomerang divider between links.
- **Badges** — atom or orbit motifs marking features.

## Do

- Pair turquoise and atomic orange prominently.
- Use starbursts for the loudest claim on the page.
- Keep the screen-print texture over flat fills.
- Build containers from capsules and parabolas.

## Don't

- Don't use gradients or soft shadows.
- Don't mix in neon or cool greys.
- Don't let texture reduce text contrast.
- Don't ship rotating motifs that ignore reduced-motion.

## How Weave verifies it

Deterministic checks detect starburst/boomerang/atom motif elements, sample the palette for the
turquoise-orange pairing on cream, read heading case and font class, measure texture overlay
opacity, look for parabolic or capsule container shapes, measure contrast on each fill, and read
motion timing plus reduced-motion behaviour. The judged check asks whether it feels specifically
1950s rather than generically retro.

Reference pictures: `demo-design/atompunk/`.
