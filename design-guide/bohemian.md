---
slug: bohemian
title: Bohemian
aliases: [boho, eclectic earthy, wanderlust]
status: ready
summary: Warm eclectic layering — terracotta and sand, woven textures, arches, mixed patterns and type with a relaxed hand.
best_for: [travel and retreats, wellness and yoga, homeware and textiles, cafés, personal brands]
avoid_for: [fintech, enterprise, high-tech products, anything cold or precise]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: sand, value: "#F0E6D8" }
      - { name: terracotta, value: "#C4714D" }
      - { name: clay, value: "#9C5A3C" }
      - { name: olive, value: "#7C7F51" }
      - { name: ochre, value: "#D6A353" }
      - { name: ink, value: "#3A302A" }
      - { name: cream, value: "#FBF6EE" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, Playfair Display, serif", weights: [300, 500] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.02
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1160
    section_spacing_px: [64, 108, 152]
    motifs: arches, woven patterns, hand-drawn borders, macramé fringes
  shape:
    radius_px: 999
    arch_radius: "999px 999px 0 0"
    border_px: 1
    shadow: "0 10px 26px rgba(58, 48, 42, 0.10)"
  motion:
    duration_ms: 480
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: relaxed
  imagery:
    treatment: [natural light, textiles and rattan, desert and plants, warm film grain]
    illustration: hand-drawn line motifs, sun and moon symbols
    icons: thin hand-drawn line
checks:
  - { id: boho.shape.arches, rule: "arch-shaped frames appear for imagery or sections", kind: deterministic }
  - { id: boho.color.earth, rule: "the palette is warm earth tones; no cool greys, blues or neons", kind: deterministic }
  - { id: boho.texture.woven, rule: "a woven, linen or paper texture appears on at least one surface", kind: deterministic }
  - { id: boho.pattern.mixed, rule: "at least 2 different patterns or motifs are used together", kind: deterministic }
  - { id: boho.type.serif-relaxed, rule: "headings use a light serif with open tracking and generous line height", kind: deterministic }
  - { id: boho.a11y.contrast, rule: "ink on sand and text on terracotta or clay meet 4.5:1", kind: deterministic }
  - { id: boho.layout.asymmetry, rule: "sections alternate composition rather than repeating one arrangement", kind: deterministic }
  - { id: boho.feel.collected, rule: "the page feels warmly collected rather than a beige template", kind: judged }
---

# Bohemian

## The look in one paragraph

Warm, layered and unhurried: sand and terracotta, arched windows framing photographs of
textiles and plants, a woven pattern behind a heading, hand-drawn sun motifs, and a light serif
with room to breathe. It should feel like a room full of things collected over years rather
than bought at once.

## Layout

- Asymmetric at 1160px with comfortable-to-generous spacing.
- The arch is the recurring container: images with rounded tops, arched section dividers.
- Compositions alternate sides down the page; patterns and motifs fill some margins.

## Typography

- A light serif for headings with open tracking and `1.25` line height — relaxed, never tight.
- A plain sans for labels and navigation.
- Body at 17px with `1.75` line height in a warm dark brown.

## Colour

Sand and cream grounds with terracotta, clay, olive and ochre. Every colour is warm; the
introduction of a cool grey or blue immediately breaks the mood.

## Surface and depth

Soft and flat: arch shapes, pill buttons, hairline borders, and very light warm shadows.
Texture does the work that shadow does elsewhere.

## Motion

Relaxed: 480ms fades and gentle rises. Nothing snappy or springy.

## Imagery

Natural light photography of textiles, rattan, ceramics, plants and desert landscapes, with
warm film grain. Hand-drawn motifs — suns, moons, arches, leaves — as accents.

## Components

- **Arch frame** — the signature image container.
- **Pattern band** — a woven or block-printed pattern strip between sections.
- **Buttons** — pills with terracotta fill or a hairline outline, serif label.
- **Cards** — cream fill on sand, arched top, hairline border.
- **Motif divider** — a hand-drawn sun or leaf flanked by thin rules.

## Do

- Use arches repeatedly.
- Mix at least two patterns.
- Keep everything warm.
- Let photography show real texture.

## Don't

- Don't introduce cool greys or blues.
- Don't use hard shadows or high-contrast black.
- Don't repeat one identical section arrangement down the page.
- Don't let pattern sit behind body copy.

## How Weave verifies it

Deterministic checks detect arch-shaped radii, convert the palette to HSL and check hue warmth,
look for texture and pattern layers, read heading type class and tracking, measure contrast on
earth-tone fills, and compare section arrangements for alternation. The judged check asks whether
the page feels collected rather than templated.

Reference pictures: `demo-design/bohemian/`.
