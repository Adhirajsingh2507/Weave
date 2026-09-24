---
slug: maximalism
title: Maximalism
aliases: [more is more, maximalist web]
status: ready
summary: Layered pattern, clashing type and saturated colour packed edge to edge — abundance as the message.
best_for: [fashion and music brands, festivals, food and drink, creative portfolios, campaigns]
avoid_for: [dashboards, forms-heavy products, anything read for long stretches]
inherits: _base.md
overrides:
  - rule: base.perf.fonts
    allowance: "3 font families permitted (display, serif, sans) because type clash is the style"
    compensating_check: max.perf.font-payload
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFF3D6" }
      - { name: ink, value: "#170F1E" }
      - { name: magenta, value: "#E3007E" }
      - { name: cobalt, value: "#1B2CC1" }
      - { name: emerald, value: "#0C8A4A" }
      - { name: tangerine, value: "#FF6B1A" }
      - { name: violet, value: "#6A2CF0" }
    gradients:
      - { name: clash, value: "linear-gradient(120deg, #E3007E 0%, #FF6B1A 50%, #6A2CF0 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Clash Display, Anton, Impact, sans-serif", weights: [700] }
      - { role: serif, family: "Playfair Display, Georgia, serif", weights: [400, 700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1440
    section_spacing_px: [24, 48, 72]
    overlap: elements overlap section edges and each other by design
  shape:
    radius_px: 999
    secondary_radius_px: 0
    border_px: 3
    shadow: "6px 6px 0 #170F1E"
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    properties: [transform, opacity, background-position]
    intensity: energetic
  imagery:
    treatment: [cut-out photography, pattern fills, stickers, repeated motifs]
    illustration: bold flat, hand-drawn accents
    icons: filled, chunky, outlined in ink
checks:
  - { id: max.color.count-min, rule: "at least 5 distinct hues painted per full page", kind: deterministic }
  - { id: max.color.contrast-pairs, rule: "every text/background pair still meets 4.5:1 despite the clashing palette", kind: deterministic }
  - { id: max.type.roles, rule: "all three type roles (display, serif, sans) appear, each with a distinct job", kind: deterministic }
  - { id: max.perf.font-payload, rule: "total webfont payload stays under 180KB despite 3 families", kind: deterministic }
  - { id: max.layout.density, rule: "no viewport is more than 35% unpainted background", kind: deterministic }
  - { id: max.layout.overlap, rule: "at least 2 elements per page overlap a section boundary", kind: deterministic }
  - { id: max.shape.hard-shadow, rule: "shadows are hard offsets with 0 blur, not soft drops", kind: deterministic }
  - { id: max.a11y.reading-island, rule: "long text sits on a solid, pattern-free panel", kind: deterministic }
  - { id: max.feel.controlled-chaos, rule: "the page reads as deliberate abundance with a clear reading path, not noise", kind: judged }
---

# Maximalism

## The look in one paragraph

Every surface is doing something: pattern, colour, cut-out photography, type at wildly
different scales, elements crashing over each other's edges. It looks reckless and isn't —
there is always one clear path through the page, and everything else is scenery. Restraint
shows up in exactly one place: wherever the user has to read more than a sentence.

## Layout

- Wide (1440px), dense, asymmetric. Tight section spacing — 24–72px — because crowding is
  the point.
- Elements overlap section boundaries: a sticker crossing into the next block, an image
  breaking the grid, type running over a photo.
- Despite the chaos, one element per screen is unmistakably the largest. That's the path.

## Typography

- Three roles, each with a job: a heavy display face for the shouting, a serif for contrast
  and quotes, a plain sans for anything functional.
- Mix scales violently — 96px headline next to 14px caption — but never mix roles inside a
  sentence.
- Body text stays sans, 17px, on a plain panel.

## Colour

Warm off-white ground with five or more saturated hues used at full strength. Colours clash
on purpose: magenta beside emerald, cobalt on tangerine. What doesn't move is contrast — every
text pairing is still checked, and text over pattern gets a solid panel underneath.

## Surface and depth

Flat colour with hard 6px offset shadows in ink, 3px ink borders, and two radii in play at
once: full pills for buttons and squared corners for panels. No soft blur anywhere.

## Motion

Energetic, 300ms with overshoot. Hover tilts, pops or shifts a pattern. Marquees and looping
motifs fit the style and must fully stop under `prefers-reduced-motion`.

## Imagery

Cut-out photography with visible edges, halftone or pattern fills, repeated motifs, stickers
and badges. Nothing sits in a tidy rectangle unless it's a reading panel.

## Components

- **Buttons** — pill, saturated fill, 3px ink border, hard offset shadow, chunky label.
- **Nav** — loud bar in a contrasting hue, overlapping the hero, with a sticker-style active state.
- **Cards** — ink border, hard shadow, pattern or colour fill, often rotated a degree or two.
- **Forms** — plain solid panel, ink borders, no pattern behind inputs.
- **Footer** — the densest block on the page: pattern, oversized wordmark, every link visible.

## Do

- Commit — half-maximalism looks like a mistake.
- Keep one dominant element per screen so there's a reading path.
- Put long text on a solid island.
- Repeat a motif across sections so the noise feels composed.

## Don't

- Don't run body copy over pattern or photography.
- Don't let the palette drift past seven hues; that's noise, not abundance.
- Don't sacrifice contrast for a colour pairing you like.
- Don't animate everything at once.

## How Weave verifies it

Deterministic checks count distinct hues and measure painted density per viewport, confirm all
three type roles appear and that the webfont payload still fits the compensating budget, detect
hard-offset shadows versus soft blurs, find elements crossing section boundaries, and assert
that long text blocks sit on solid backgrounds. Contrast is re-measured against actual rendered
pixels, since clashing palettes fail there first. The judged check asks whether the page reads
as controlled abundance or as noise.

Reference pictures: `demo-design/maximalism/`.
