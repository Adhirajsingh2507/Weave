---
slug: watercolor-wash
title: Watercolor Wash
aliases: [aquarelle, painted wash, soft watercolour]
status: ready
summary: Pigment bleeding into wet paper — soft irregular edges, blooming colour and visible paper texture under every stroke.
best_for: [weddings and events, wellness and spa, children's books, artisan food, florists]
avoid_for: [tech and finance, dashboards, anything needing crisp edges or high density]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#FCFAF5" }
      - { name: ink, value: "#3A3733" }
      - { name: wash-blue, value: "#A7C4DC" }
      - { name: wash-rose, value: "#E3B3B8" }
      - { name: wash-sage, value: "#B6C9A9" }
      - { name: wash-ochre, value: "#E0C58F" }
      - { name: muted, value: "#7C766E" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, Georgia, serif", weights: [300, 500] }
      - { role: script, family: "Tangerine, Parisienne, cursive", weights: [400] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: centered
    density: spacious
    max_width_px: 1100
    section_spacing_px: [72, 116, 160]
    composition: wash shapes bleeding behind content, irregular edges, generous margins
  shape:
    radius_px: 0
    border_px: 0
    border_style: irregular painted edges via masks
    shadow: none
  motion:
    duration_ms: 700
    easing: "cubic-bezier(0.37, 0, 0.35, 1)"
    properties: [opacity, transform]
    intensity: bleeding
  imagery:
    treatment: [watercolour washes, soft-edged florals, paper grain, pigment blooms]
    illustration: painted florals and abstract washes
    icons: thin line with a painted accent
checks:
  - { id: wash.edges.irregular, rule: "wash shapes have irregular painted edges, not geometric or uniformly blurred ones", kind: deterministic }
  - { id: wash.texture.paper, rule: "paper grain shows through washes at 5-12% opacity", kind: deterministic }
  - { id: wash.color.transparent, rule: "overlapping washes multiply into deeper tones rather than covering each other", kind: deterministic }
  - { id: wash.a11y.text-clear, rule: "body copy sits on plain paper or on the palest part of a wash, meeting 4.5:1", kind: deterministic }
  - { id: wash.type.script-limited, rule: "the script face is used for accents only, never for body or UI labels", kind: deterministic }
  - { id: wash.layout.space, rule: "at least 45% of each viewport is plain paper", kind: deterministic }
  - { id: wash.motion.slow, rule: "wash motion is 600ms or slower and stops under prefers-reduced-motion", kind: deterministic }
  - { id: wash.feel.painted, rule: "washes read as real pigment on paper rather than as blurred CSS gradients", kind: judged }
---

# Watercolor Wash

## The look in one paragraph

Colour laid on wet paper and allowed to move: soft irregular edges, darker rings where pigment
pooled, lighter centres where it spread, and paper texture showing through everything. Type is
a light serif with the occasional script flourish, and most of the page stays plain paper.

## Layout

- Centred at 1100px with very generous spacing — washes need room to bleed.
- Wash shapes sit behind or beside content, bleeding off the page edges rather than being
  contained.
- Sections are separated by a wash band rather than a rule.

## Typography

- A light serif for headings and body, generous line height (`1.75`).
- A script face for one or two accents per page — a name, a greeting — never for anything
  functional.
- Body 17px in warm dark grey rather than black.

## Colour

Soft paper ground with translucent washes: dusty blue, rose, sage, ochre. Washes are
transparent, so where two overlap they deepen — that overlap is part of the palette.

## Surface and depth

No borders, radii or shadows. Depth is pigment density: heavier at an edge, lighter in the
middle. Every wash keeps a visible irregular edge.

## Motion

Bleeding: 700ms, washes fading in as though spreading through paper, content rising gently. All
ambient motion stops under reduced-motion.

## Imagery

Painted florals and abstract washes, photographs with a soft-edged painted mask, pigment
blooms and salt textures. Real scans beat CSS approximations — a blurred gradient does not
read as watercolour.

## Components

- **Wash panel** — a painted shape behind a block of content.
- **Buttons** — plain serif labels over a small wash, or a thin outline; the hit area stays
  rectangular.
- **Nav** — plain serif links on paper with a wash accent behind the active item.
- **Dividers** — a thin wash band with irregular edges.
- **Cards** — paper with a wash corner rather than a border.

## Do

- Use real painted assets with irregular edges.
- Let washes overlap and deepen.
- Keep most of the page plain paper.
- Restrict script type to accents.

## Don't

- Don't fake washes with blurred rectangles.
- Don't set body copy over a dark part of a wash.
- Don't add borders or shadows.
- Don't use script for buttons or navigation.

## How Weave verifies it

Deterministic checks analyse wash asset edges for irregularity versus uniform blur, measure paper
grain opacity through washes, sample overlapping wash regions for multiply behaviour, measure
contrast where body copy sits, identify script-font usage and flag functional elements, measure
plain-paper area, and read motion timing. The judged check asks whether washes read as pigment.

Reference pictures: `demo-design/watercolor-wash/`.
