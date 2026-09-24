---
slug: sticker-book
title: Sticker Book
aliases: [scrapbook, sticker collage, journal spread]
status: ready
summary: A page covered in stickers — die-cut shapes with white borders, washi tape, polaroids and handwritten notes, layered and rotated.
best_for: [community and social products, events and festivals, kids and education, merch, personal sites]
avoid_for: [enterprise, finance, luxury, information-dense products]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: page, value: "#FFF9EF" }
      - { name: ink, value: "#2A241E" }
      - { name: sticker-mint, value: "#7FE0C2" }
      - { name: sticker-coral, value: "#FF8A73" }
      - { name: sticker-lilac, value: "#B9A6FF" }
      - { name: sticker-sun, value: "#FFD34E" }
      - { name: tape, value: "#EADFC2" }
      - { name: die-cut, value: "#FFFFFF" }
  typography:
    scale: large
    families:
      - { role: hand, family: "Caveat, Gochi Hand, cursive", weights: [400, 700] }
      - { role: display, family: "Poppins, Baloo 2, sans-serif", weights: [700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.1
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1240
    section_spacing_px: [40, 72, 112]
    composition: overlapping stickers rotated 2-10 degrees, tape anchoring corners
  shape:
    radius_px: 16
    border_px: 4
    border_style: white die-cut outline
    shadow: "0 6px 14px rgba(42, 36, 30, 0.18)"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.34, 1.45, 0.64, 1)"
    properties: [transform, rotate]
    intensity: peel
  imagery:
    treatment: [polaroid photos, die-cut shapes, washi tape, doodle accents, paper texture]
    illustration: sticker-style flat art with white keylines
    icons: die-cut stickers with white borders
checks:
  - { id: stick.shape.diecut, rule: "sticker elements carry a white keyline border of 3px or more", kind: deterministic }
  - { id: stick.layout.rotation, rule: "stickers are rotated 2-10 degrees with varying values and overlap each other", kind: deterministic }
  - { id: stick.depth.shadow, rule: "each sticker has a short soft shadow suggesting it sits above the page", kind: deterministic }
  - { id: stick.tape.anchors, rule: "tape or clip elements anchor at least 2 items to the page", kind: deterministic }
  - { id: stick.type.hand-limited, rule: "handwriting is used for captions and labels only; body copy uses the sans", kind: deterministic }
  - { id: stick.a11y.contrast, rule: "ink on every sticker colour meets 4.5:1", kind: deterministic }
  - { id: stick.a11y.targets, rule: "rotated interactive stickers still expose a 44px hit area and a visible focus ring", kind: deterministic }
  - { id: stick.feel.collected, rule: "the page reads as a collected scrapbook rather than randomly scattered clip art", kind: judged }
---

# Sticker Book

## The look in one paragraph

A scrapbook page: die-cut stickers with white keylines layered over each other at slight
angles, washi tape holding down a polaroid, handwritten captions in the margins, and a warm
paper page underneath. Cheerful, personal, and busy in a way that feels collected rather than
cluttered.

## Layout

- Asymmetric at 1240px, compact, with stickers overlapping and rotated 2–10° — each a different
  amount.
- Tape strips and paper clips anchor items to the page, especially at section boundaries.
- Clusters have a focal sticker with smaller ones tucked behind it.

## Typography

- Handwriting for captions and margin notes.
- A rounded display face for sticker lettering, set inside the die-cut shape.
- A plain sans for body copy at 17px on the page surface, not on a sticker.

## Colour

Warm page with candy sticker colours — mint, coral, lilac, sun — each sticker a flat fill with
a white keyline. Tape is a translucent warm beige.

## Surface and depth

Stickers sit above the page: white keyline, 16px radius, and a short soft shadow. Layering is
the depth model — nothing is inset or embossed.

## Motion

Peel: 260ms with overshoot, stickers lifting a corner on hover, new stickers dropping in with a
slight rotation. Stops under reduced-motion.

## Imagery

Polaroid photographs with a white border and handwritten caption, die-cut illustration, washi
tape, doodle accents, subtle paper texture.

## Components

- **Sticker** — the base unit: flat fill, white keyline, rotation, short shadow.
- **Polaroid** — a photo with a thick white border and a handwritten caption underneath.
- **Tape strip** — translucent band crossing a corner, decorative and hidden from screen readers.
- **Buttons** — sticker-shaped with a rectangular hit area and a visible focus ring.
- **Caption** — handwritten note in the margin, slightly rotated.

## Do

- Give every sticker a white keyline and a short shadow.
- Vary rotation per element.
- Anchor a few items with tape.
- Keep body copy on the page, not on a sticker.

## Don't

- Don't rotate interactive elements so far that their hit area becomes awkward.
- Don't set paragraphs in handwriting.
- Don't skip the white keyline — it's what makes a sticker read as a sticker.
- Don't let tape or doodles reach assistive technology.

## How Weave verifies it

Deterministic checks read keyline border widths and colours, measure rotation variance and
overlap between stickers, confirm shadow presence and size, count tape/anchor elements, identify
handwriting usage and flag body copy, measure contrast on each sticker fill, and compute hit
areas and focus rings for rotated controls. The judged check asks whether the page reads as a
collected scrapbook.

Reference pictures: `demo-design/sticker-book/`.
