---
slug: rococo
title: Rococo
aliases: [rocaille, french pastel ornament, 18th century salon]
status: ready
summary: Pastel frivolity in gilt frames — asymmetric shell ornament, powder blue and rose, curling scrollwork and airy light.
best_for: [beauty and fragrance, patisserie and florists, weddings, boutique hospitality, fashion editorials]
avoid_for: [tech, finance, industrial brands, anything sober or masculine-coded]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cream, value: "#FBF3E8" }
      - { name: powder-blue, value: "#BBD3E4" }
      - { name: rose, value: "#E9B7C0" }
      - { name: mint, value: "#C6DCC8" }
      - { name: gilt, value: "#C2A355" }
      - { name: ink, value: "#463A34" }
  typography:
    scale: display
    families:
      - { role: display, family: "Cormorant Garamond, Playfair Display, Didot, serif", weights: [300, 500] }
      - { role: script, family: "Tangerine, Pinyon Script, cursive", weights: [400] }
      - { role: serif, family: "EB Garamond, Georgia, serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [64, 104, 152]
    composition: asymmetric curves, ornament weighted to one side, oval frames
  shape:
    radius_px: 999
    oval_frame: "50% / 60%"
    border_px: 2
    shadow: "0 12px 30px rgba(70, 58, 52, 0.12)"
  motion:
    duration_ms: 520
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: airy
  imagery:
    treatment: [pastel painting, florals, porcelain and silk, soft high-key light]
    illustration: rocaille shell scrolls, garlands, ribbons
    icons: thin gilt line with a curl
checks:
  - { id: rococo.layout.asymmetric-ornament, rule: "ornament is weighted to one side rather than mirrored", kind: deterministic }
  - { id: rococo.shape.curves, rule: "frames are oval or fully curved; no square containers", kind: deterministic }
  - { id: rococo.color.pastel, rule: "palette is high-key pastel with gilt accents; no dark grounds", kind: deterministic }
  - { id: rococo.type.script-limited, rule: "the script face is used for accents only, never for body or UI labels", kind: deterministic }
  - { id: rococo.ornament.scroll, rule: "shell, garland or scroll ornament frames at least one section", kind: deterministic }
  - { id: rococo.a11y.contrast-pastel, rule: "ink on pastel fills meets 4.5:1; gilt is not used for body text", kind: deterministic }
  - { id: rococo.a11y.decorative, rule: "ornament is marked decorative and hidden from assistive technology", kind: deterministic }
  - { id: rococo.feel.light, rule: "the page feels airy and playful rather than heavy or formal", kind: judged }
---

# Rococo

## The look in one paragraph

An eighteenth-century salon: cream walls, powder blue and rose pastels, gilded scrollwork
curling asymmetrically around oval portraits, ribbons and garlands, and delicate serif type
with the occasional script flourish. Where Baroque is dark and theatrical, Rococo is light,
ornamental and deliberately frivolous.

## Layout

- Asymmetric at 1140px: ornament gathers on one side of a block, never mirrored evenly.
- Oval and curved frames for imagery, with scrollwork spilling past their edges.
- Generous spacing and high-key light — the page should feel like a bright room.

## Typography

- A delicate high-contrast serif at light weight for headings, set large and airy.
- A script face for one or two accents per page — a signature, a section label — and nothing
  functional.
- Body in an old-style serif at 17px with `1.75` line height.

## Colour

Cream ground with powder blue, rose and mint pastels, and gilt for ornament and hairlines. Ink
is a warm soft brown rather than black. Nothing dark, nothing saturated.

## Surface and depth

Light and soft: 2px gilt hairlines, curved frames, and gentle low-opacity shadows. Depth reads
as layered paper and plaster, not as elevation.

## Motion

Airy: 520ms fades and slight upward drifts, ribbons or garlands swaying almost imperceptibly.
Ambient motion stops under reduced-motion.

## Imagery

Pastel painting, florals, porcelain, silk and ribbon, patisserie. High-key lighting with soft
shadows. Portraits sit inside oval gilt frames.

## Components

- **Oval frame** — the signature container for imagery, with a gilt hairline and a scroll
  flourish at one corner.
- **Buttons** — pills with pastel fills, gilt hairline, ink label.
- **Nav** — cream bar with serif links and a small gilt ornament separating them.
- **Cards** — curved corners, cream fill, gilt hairline, ornament weighted to one side.
- **Dividers** — a garland or scroll motif rather than a rule.

## Do

- Weight ornament asymmetrically.
- Use oval and curved frames.
- Keep everything high-key and pastel.
- Restrict script type to accents.

## Don't

- Don't mirror ornament symmetrically — that's Baroque or Deco.
- Don't use dark grounds or heavy shadows.
- Don't set body copy or buttons in script.
- Don't use gilt for small text; it fails contrast.

## How Weave verifies it

Deterministic checks compare ornament distribution left versus right for asymmetry, read frame
radii for curves and ovals, sample the palette for high-key pastels and absence of dark grounds,
identify which elements use the script family and flag functional usage, detect scroll ornament,
measure contrast on pastel fills, and confirm ornament carries `aria-hidden`. The judged check
asks whether the page feels light and playful.

Reference pictures: `demo-design/rococo/`.
