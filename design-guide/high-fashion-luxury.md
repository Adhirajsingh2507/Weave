---
slug: high-fashion-luxury
title: High-Fashion Luxury
aliases: [editorial luxury, fashion house, quiet luxury]
status: ready
summary: Restraint as a flex — enormous imagery, tiny tracked-out type, monochrome palette and confidence in empty space.
best_for: [fashion and jewellery, fragrance, hospitality, automotive, premium interiors]
avoid_for: [mass retail, discount messaging, dense catalogues, anything with urgency]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: bone, value: "#F3F1ED" }
      - { name: ink, value: "#0E0E0E" }
      - { name: stone, value: "#9A968F" }
      - { name: sand, value: "#DCD6CC" }
      - { name: noir, value: "#141414" }
      - { name: accent, value: "#7A6A55" }
  typography:
    scale: display
    families:
      - { role: display, family: "Didot, Bodoni Moda, Playfair Display, serif", weights: [300, 400] }
      - { role: sans, family: "Inter, Helvetica Neue, system-ui, sans-serif", weights: [300, 400] }
    heading_tracking_em: 0.18
    heading_case: uppercase
    heading_line_height: 1.3
    label_size_px: 11
    body_size_px: 16
    body_line_height: 1.8
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1440
    section_spacing_px: [96, 160, 224]
    composition: full-bleed imagery with small type placed at the margins
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 800
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, clip-path]
    intensity: restrained
  imagery:
    treatment: [full-bleed editorial photography, high-fashion styling, natural or hard studio light]
    illustration: none
    icons: hairline, minimal, rarely used
checks:
  - { id: lux.type.small-tracked, rule: "labels and navigation are 11-13px uppercase with tracking >= 0.15em", kind: deterministic }
  - { id: lux.image.dominant, rule: "imagery occupies at least 60% of the hero viewport, full-bleed", kind: deterministic }
  - { id: lux.color.monochrome, rule: "the palette is monochrome neutrals; at most one muted accent", kind: deterministic }
  - { id: lux.space.generous, rule: "section spacing uses the large steps; no section is visually crowded", kind: deterministic }
  - { id: lux.shape.flat, rule: "no radii, shadows or gradients anywhere", kind: deterministic }
  - { id: lux.a11y.small-text, rule: "small tracked type still meets 4.5:1 and is never below 11px", kind: deterministic }
  - { id: lux.motion.slow, rule: "transitions are 600ms or slower with no bounce", kind: deterministic }
  - { id: lux.feel.restraint, rule: "the page reads as confident restraint rather than an empty template", kind: judged }
---

# High-Fashion Luxury

## The look in one paragraph

Enormous photography and almost no words. What type exists is tiny, uppercase and tracked far
apart, placed at the edges of the frame rather than over the subject. The palette is bone,
ink and stone. Nothing is rounded, nothing glows, nothing hurries — the restraint is the entire
message.

## Layout

- Wide (1440px) and spacious, with full-bleed imagery and type parked in the margins.
- Section spacing is extreme (96–224px). Crowding destroys the effect faster than anything else.
- Compositions are asymmetric: an image occupying two thirds, a caption alone in the remaining
  third.

## Typography

- A high-contrast display serif at light weight for the few large statements.
- Everything functional — navigation, labels, captions, buttons — is 11–13px uppercase sans,
  tracked to `0.18em`.
- Body at 16px with `1.8` line height, used sparingly.

## Colour

Bone, ink, stone, sand, noir. One muted accent at most, usually a warm taupe. Colour comes from
the photography, never from the interface.

## Surface and depth

Completely flat: no radii, no shadows, no gradients. A hairline rule is the only decoration
permitted.

## Motion

Restrained: 800ms fades and slow clip reveals as imagery enters. No hover scaling, no bounce,
no parallax beyond the most subtle image drift.

## Imagery

Full-bleed editorial photography, carefully styled, in natural or hard studio light. Images are
the content; everything else is caption. Never crop tightly or overlay text across a face.

## Components

- **Hero image** — full-bleed, with the brand name and one small caption at an edge.
- **Nav** — 11px tracked uppercase links, generously spaced, no background.
- **Product card** — image, name in small caps, price in the same small type. No border, no card.
- **Buttons** — a hairline-underlined small-caps label, or a 1px outlined rectangle.
- **Editorial block** — a large image with a short serif statement beside it.

## Do

- Let imagery dominate.
- Keep functional type tiny, uppercase and tracked.
- Use extreme spacing.
- Keep the palette monochrome.

## Don't

- Don't add radii, shadows or colour to the interface.
- Don't crowd sections or add badges and ribbons.
- Don't drop small type below 11px or below the contrast floor.
- Don't overlay text on a subject's face.

## How Weave verifies it

Deterministic checks measure label font sizes, case and tracking, compute the imagery share of
the hero viewport, sample the palette for monochrome neutrals, verify spacing steps, assert
absence of radii, shadows and gradients, measure contrast on small type, and read transition
durations. The judged check asks whether the restraint reads as confidence rather than emptiness.

Reference pictures: `demo-design/high-fashion-luxury/`.
