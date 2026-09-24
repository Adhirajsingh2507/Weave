---
slug: memphis
title: Memphis
aliases: [memphis milano, 80s postmodern, squiggle style]
status: ready
summary: Eighties postmodern chaos with rules — squiggles, terrazzo confetti, clashing pastels and primaries, and shapes that serve no purpose.
best_for: [creative agencies, kids and education, events and festivals, stationery and merch, playful SaaS]
avoid_for: [finance, healthcare, luxury, anything conservative]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFDF6" }
      - { name: ink, value: "#141414" }
      - { name: hot-pink, value: "#FF4F79" }
      - { name: electric-blue, value: "#2D6BFF" }
      - { name: sun-yellow, value: "#FFD23F" }
      - { name: mint, value: "#3FD9A0" }
      - { name: lilac, value: "#A97BFF" }
  typography:
    scale: display
    families:
      - { role: display, family: "Poppins, Futura, Jost, sans-serif", weights: [700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.05
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [48, 88, 128]
    motifs: squiggles, zigzags, terrazzo dots, half-circles, grids
  shape:
    radius_px: 12
    border_px: 3
    shadow: "5px 5px 0 #141414"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.34, 1.5, 0.64, 1)"
    properties: [transform, rotate, opacity]
    intensity: playful
  imagery:
    treatment: [cut-out photos on colour blocks, terrazzo patterns, confetti shapes]
    illustration: flat geometric motifs, squiggles, columns
    icons: chunky outline, mismatched fills
checks:
  - { id: memphis.motif.shapes, rule: "at least 4 decorative motifs (squiggle, zigzag, dot, half-circle) appear per page", kind: deterministic }
  - { id: memphis.color.clash, rule: "at least 4 palette hues are used, including one pastel and one primary together", kind: deterministic }
  - { id: memphis.shape.outline-shadow, rule: "cards and controls use ink outlines with hard offset shadows", kind: deterministic }
  - { id: memphis.layout.scatter, rule: "decorative motifs are scattered asymmetrically, not aligned to a row", kind: deterministic }
  - { id: memphis.a11y.decorative, rule: "motifs are marked decorative and never overlap body text", kind: deterministic }
  - { id: memphis.a11y.contrast, rule: "text on every coloured block meets 4.5:1", kind: deterministic }
  - { id: memphis.type.plain-body, rule: "body copy uses the plain sans on a solid background", kind: deterministic }
  - { id: memphis.feel.postmodern, rule: "the page reads as joyful postmodern clutter rather than random stickers", kind: judged }
---

# Memphis

## The look in one paragraph

Shapes that refuse to justify themselves: squiggles, zigzags, half-circles and terrazzo
confetti scattered across an off-white ground, with clashing pastels and primaries, thick ink
outlines and hard offset shadows. It's loud and silly on purpose, and the only discipline is
keeping the text out of the way of the party.

## Layout

- Asymmetric at 1200px, with content blocks placed off-centre and motifs scattered around them.
- Motifs never sit in a tidy row — they're rotated, varied in size, and overlapping section
  edges.
- Each section keeps one clear content area free of decoration.

## Typography

- A geometric sans, bold, for headings; the same family or a neutral sans at regular for body.
- Headings sit at `1.05` and are often placed inside or beside a colour block.
- Body copy always on a solid background — never on terrazzo or pattern.

## Colour

Off-white ground and ink outlines with four or more clashing hues: hot pink beside mint,
electric blue beside sun yellow. Flat fills, no gradients. Terrazzo patterns mix three colours
as small scattered dots.

## Surface and depth

Flat fills, 3px ink outlines, 12px radius, and hard `5px 5px` ink shadows. Motifs have no
shadow — they're flat graphic elements floating on the ground.

## Motion

Playful: 260ms with overshoot, motifs rotating slightly on scroll, cards popping on hover. All
ambient rotation stops under reduced-motion.

## Imagery

Cut-out photography placed on flat colour blocks, terrazzo textures, and geometric props
(columns, spheres, squiggles) rendered flat or in soft 3D.

## Components

- **Cards** — outlined, flat fill, hard shadow, a squiggle or dot cluster tucked behind one corner.
- **Buttons** — pill or 12px radius, flat fill, ink outline, hard shadow, press effect.
- **Nav** — off-white bar with an ink underline and a coloured block behind the active link.
- **Section headers** — a heading with one motif beside it, rotated.
- **Dividers** — zigzag or wave rules in a contrasting hue.

## Do

- Scatter at least four different motif types per page.
- Keep motifs flat and shadowless.
- Mix a pastel and a primary in the same view.
- Leave one clean area per section for reading.

## Don't

- Don't align motifs into rows or grids.
- Don't put text over terrazzo or pattern.
- Don't gradient the fills.
- Don't let a motif overlap an interactive target.

## How Weave verifies it

Deterministic checks count distinct decorative motif elements and their rotations and positions
to confirm scatter, sample the palette for hue count and pastel/primary mixing, read outline and
shadow values, verify motifs carry `aria-hidden` and do not intersect text bounding boxes, and
measure contrast on every coloured block. The judged check asks whether the clutter feels joyful
rather than arbitrary.

Reference pictures: `demo-design/memphis/`.
