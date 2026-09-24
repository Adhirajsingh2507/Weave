---
slug: solarpunk
title: Solarpunk
aliases: [eco-futurism, green optimism, art nouveau futurism]
status: ready
summary: A future that worked — sunlit greenery growing through clean technology, warm optimism and organic-meets-engineered forms.
best_for: [climate and energy, sustainable products, urban planning, food and agriculture, non-profits]
avoid_for: [luxury, nightlife, security products, anything dystopian or cold]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: sky, value: "#EAF4E4" }
      - { name: leaf, value: "#3F8F5C" }
      - { name: deep-green, value: "#215A3B" }
      - { name: sun, value: "#F2B84B" }
      - { name: copper, value: "#C97B4A" }
      - { name: ink, value: "#1D2A22" }
      - { name: glass, value: "rgba(255, 255, 255, 0.55)" }
  typography:
    scale: large
    families:
      - { role: display, family: "Fraunces, Cormorant Garamond, serif", weights: [400, 600] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.7
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [64, 108, 152]
    motifs: arches, climbing plants, solar panels, stained-glass geometry
  shape:
    radius_px: 20
    arch_radius: "999px 999px 0 0"
    border_px: 1
    shadow: "0 12px 30px rgba(29, 42, 34, 0.10)"
  motion:
    duration_ms: 480
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: growing
  imagery:
    treatment: [sunlit greenery, plants on architecture, solar and wind technology, warm daylight]
    illustration: art-nouveau-influenced plant and tech motifs
    icons: rounded line with a leaf or ray motif
checks:
  - { id: solar.color.green-sun, rule: "the palette pairs greens with warm sunlight tones on a light ground", kind: deterministic }
  - { id: solar.motif.growth, rule: "plant or growth motifs appear alongside technological elements", kind: deterministic }
  - { id: solar.shape.arch-organic, rule: "arches or organic curves appear in framing or dividers", kind: deterministic }
  - { id: solar.light.warm, rule: "imagery is warm daylight, not overcast or artificial light", kind: deterministic }
  - { id: solar.a11y.contrast, rule: "ink on sky and text on leaf green meet 4.5:1", kind: deterministic }
  - { id: solar.content.specific, rule: "sustainability claims are specific and sourced rather than vague green language", kind: judged }
  - { id: solar.motion.grow, rule: "motion grows or unfurls, 400ms or slower, stopping under prefers-reduced-motion", kind: deterministic }
  - { id: solar.feel.optimism, rule: "the page reads as a hopeful working future rather than greenwashed marketing", kind: judged }
---

# Solarpunk

## The look in one paragraph

Technology and plants growing into each other in full sunlight: glass arches with vines through
them, solar panels above a garden, copper and greenery, stained-glass geometry, and warm light
on everything. Optimistic without being naive, and deliberately the opposite of the dystopian
default.

## Layout

- Asymmetric at 1200px with comfortable spacing and arch-shaped frames.
- Plant elements grow across section boundaries — a vine along an edge, leaves over a corner.
- Sections alternate between built forms (panels, grids) and organic ones (curves, foliage).

## Typography

- A warm serif with some character (Fraunces) for headings, paired with a clean sans for body.
- Headings at `1.2`; body 17px at `1.7` — readable and unhurried.
- Nothing technical or condensed; the tone is human.

## Colour

A pale green-tinted sky ground, leaf and deep green, warm sun yellow, copper, and translucent
glass surfaces. The pairing of green with warm gold is what separates this from generic eco
branding.

## Surface and depth

Soft and light: 20px radii, arch frames, hairline borders, and gentle shadows. Translucent
glass panels suggest greenhouse architecture.

## Motion

Growing: 480ms, elements unfurling or rising as though growing into place, leaves drifting
slightly. Stops under reduced-motion.

## Imagery

Sunlit greenery on architecture, solar arrays among plants, people working outdoors, warm
daylight. Illustration borrows art nouveau's plant line work applied to technological subjects.

## Components

- **Arch panel** — glass or pale fill with an arched top and a plant motif at one corner.
- **Buttons** — rounded, leaf-green fill or copper outline, sans label.
- **Nav** — translucent pale bar with a vine accent under the active item.
- **Stat block** — a number in the serif with a specific, sourced claim beneath it.
- **Divider** — a growing vine or a stained-glass geometry band.

## Do

- Pair greenery with visible technology.
- Keep the light warm and the mood hopeful.
- Make sustainability claims specific and sourced.
- Let plants cross structural boundaries.

## Don't

- Don't use vague green language without evidence — this style attracts greenwashing.
- Don't use cold or overcast imagery.
- Don't go fully organic; the technology has to be visible.
- Don't rely on green alone for state or meaning.

## How Weave verifies it

Deterministic checks sample the palette for the green-and-gold pairing on a light ground, detect
plant motifs alongside technological imagery, look for arch and organic framing, analyse image
colour temperature, measure contrast, and read motion behaviour. Two judged checks look at
whether claims are specific and sourced, and whether the page reads as hopeful rather than
greenwashed.

Reference pictures: `demo-design/solarpunk/`.
