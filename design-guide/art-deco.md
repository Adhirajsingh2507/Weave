---
slug: art-deco
title: Art Deco
aliases: [gatsby style, jazz age, 1920s deco]
status: ready
summary: Symmetrical geometric luxury — gold on deep ink, fan and chevron motifs, stepped frames and tall elegant capitals.
best_for: [hotels and restaurants, spirits and perfume, theatres and events, jewellery, wedding and gala sites]
avoid_for: [tech products, casual brands, anything informal or playful]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: midnight, value: "#0E1A24" }
      - { name: ink, value: "#0A0F14" }
      - { name: gold, value: "#C9A227" }
      - { name: champagne, value: "#E8D8A6" }
      - { name: emerald, value: "#0B5E51" }
      - { name: cream, value: "#F3EDDF" }
    gradients:
      - { name: gilt, value: "linear-gradient(180deg, #E8D8A6 0%, #C9A227 45%, #8A6E14 70%, #E8D8A6 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Poiret One, Josefin Sans, Didot, serif", weights: [400, 700] }
      - { role: sans, family: "Inter, Futura, system-ui, sans-serif", weights: [300, 400] }
    heading_tracking_em: 0.16
    heading_case: uppercase
    heading_line_height: 1.25
    body_size_px: 16
    body_line_height: 1.7
  layout:
    system: centered
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [72, 112, 160]
    composition: strict vertical symmetry, stepped frames, tall proportions
  shape:
    radius_px: 0
    border_px: 2
    border_style: double rules and stepped corners
    shadow: none
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: stately
  imagery:
    treatment: [black and white photography with gold duotone, architectural detail, sunburst motifs]
    illustration: geometric fans, chevrons, stylised flora
    icons: thin gold line, symmetrical
checks:
  - { id: deco.layout.symmetry, rule: "hero and section compositions are vertically symmetrical", kind: deterministic }
  - { id: deco.motif.geometric, rule: "fan, chevron or stepped motifs appear as framing elements", kind: deterministic }
  - { id: deco.type.tracked-caps, rule: "display headings are uppercase with tracking >= 0.12em", kind: deterministic }
  - { id: deco.color.gold-on-dark, rule: "gold or champagne is used on dark grounds, never as a large flat background", kind: deterministic }
  - { id: deco.shape.no-radius, rule: "corners are square or stepped; no rounded shapes", kind: deterministic }
  - { id: deco.frame.double-rule, rule: "framing uses double or stepped rules rather than single hairlines", kind: deterministic }
  - { id: deco.a11y.gold-contrast, rule: "gold text on midnight meets 4.5:1; gilt gradient text has a solid fallback", kind: deterministic }
  - { id: deco.feel.luxury, rule: "the page reads as composed jazz-age luxury rather than generic gold-on-black", kind: judged }
---

# Art Deco

## The look in one paragraph

Symmetry, gold and geometry. A deep midnight ground, tall tracked-out capitals, fan and chevron
motifs framing the content, stepped rules in gilt, and photography reduced to black-and-white
with a gold cast. Everything is centred, vertical and composed — the visual language of a 1927
hotel lobby.

## Layout

- Strict vertical symmetry: centred hero, mirrored ornament left and right, centred section
  headings.
- 1140px, comfortable spacing, with tall proportions — content blocks are narrow and vertical
  rather than wide.
- Stepped frames (a rectangle with notched or tiered corners) contain key content.

## Typography

- An elegant geometric display face, uppercase, tracked out to `0.16em` — the spacing is as
  important as the letterforms.
- A light sans for body at 16px with a generous `1.7` line height.
- Numerals are often set as a feature: large, gilt, centred.

## Colour

Midnight and near-black grounds with gold and champagne as the only bright elements, plus deep
emerald as a secondary. Cream for long text sections. Gold is line work, type and ornament — it
never becomes a large flat fill.

## Surface and depth

Flat and architectural. Depth is implied by stepped frames and double rules rather than shadow.
No radius anywhere.

## Motion

Stately: 400ms fades and slow vertical reveals. Ornament may draw itself in symmetrically from
the centre outward. Nothing bounces or slides sideways.

## Imagery

Black-and-white photography with a gold duotone, architectural details, repeated geometric
patterns. Portraits are formal and centred.

## Components

- **Buttons** — square or stepped, gold outline with a gold tracked-caps label; solid gold fill
  with dark label for the primary action.
- **Nav** — centred links with wide tracking, a double rule beneath, wordmark centred above.
- **Cards** — stepped frames with a gold hairline and a centred heading.
- **Dividers** — a centred motif flanked by two rules.
- **Inputs** — square fields with double-rule borders and gold focus.

## Do

- Centre and mirror the composition.
- Track capitals out generously.
- Keep gold for line, type and ornament.
- Use stepped and double rules for framing.

## Don't

- Don't round corners or use soft shadows.
- Don't fill large areas with gold.
- Don't break symmetry for visual interest.
- Don't use gilt gradient on small text without a solid fallback.

## How Weave verifies it

Deterministic checks compare left and right element distributions for symmetry, detect
fan/chevron/stepped motif elements, read heading case and tracking, sample gold usage area
against a ceiling, assert zero radii, inspect border styles for double or stepped rules, and
measure gold-on-midnight contrast including a fallback for gradient-filled text. The judged
check asks whether it reads as composed luxury.

Reference pictures: `demo-design/art-deco/`.
