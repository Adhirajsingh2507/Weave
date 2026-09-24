---
slug: ukiyo-e
title: Ukiyo-e
aliases: [japanese woodblock, edo print, floating world]
status: ready
summary: Woodblock print logic — flat colour fields, confident outlines, layered depth without perspective and paper grain throughout.
best_for: [tea and sake, travel and ryokan, galleries and exhibitions, publishing, apparel]
avoid_for: [tech dashboards, corporate SaaS, anything needing photographic realism]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: washi, value: "#EFE5D2" }
      - { name: sumi, value: "#1F1B18" }
      - { name: indigo, value: "#28456B" }
      - { name: prussian, value: "#16334F" }
      - { name: vermilion, value: "#C4452F" }
      - { name: ochre, value: "#C79A4B" }
      - { name: moss, value: "#5C7355" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Noto Serif JP, Shippori Mincho, Georgia, serif", weights: [400, 600] }
      - { role: sans, family: "Noto Sans JP, Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.02
    heading_line_height: 1.4
    body_size_px: 16
    body_line_height: 1.85
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1160
    section_spacing_px: [64, 104, 148]
    composition: layered planes, off-centre focal point, generous empty sky
  shape:
    radius_px: 0
    border_px: 2
    border_style: sumi outline
    shadow: none
  motion:
    duration_ms: 420
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: gentle
  imagery:
    treatment: [flat colour fields, bold outlines, gradient bokashi skies, paper grain]
    illustration: woodblock style — waves, mountains, cranes, blossom
    icons: brush-drawn, flat, outlined
checks:
  - { id: ukiyo.color.flat-fields, rule: "illustration uses flat colour fields with outlines; no soft photographic shading", kind: deterministic }
  - { id: ukiyo.depth.layers, rule: "depth is built from overlapping planes rather than perspective or shadow", kind: deterministic }
  - { id: ukiyo.texture.washi, rule: "a paper grain texture overlays the ground at 4-10% opacity", kind: deterministic }
  - { id: ukiyo.color.limited, rule: "at most 6 colours painted, drawn from the woodblock palette", kind: deterministic }
  - { id: ukiyo.layout.asymmetry, rule: "the focal element is off-centre with a large area of empty ground", kind: deterministic }
  - { id: ukiyo.type.jp-pairing, rule: "if Japanese text appears it uses the matching Noto family and is paired with a readable translation", kind: deterministic }
  - { id: ukiyo.a11y.contrast, rule: "sumi on washi and text on indigo or vermilion meet 4.5:1", kind: deterministic }
  - { id: ukiyo.feel.print, rule: "the page reads as a woodblock print rather than flat vector illustration", kind: judged }
---

# Ukiyo-e

## The look in one paragraph

A woodblock print: flat fields of indigo and vermilion bounded by confident sumi outlines,
depth built by stacking planes rather than by perspective or shadow, a graded *bokashi* sky at
the top of the composition, and paper grain over the whole thing. Asymmetric, calm, and
graphic.

## Layout

- Asymmetric at 1160px: the focal element sits off-centre with a large empty area — sky, water
  or ground — balancing it.
- Depth is layered: foreground plane, middle plane, distant plane, each a flat field, partially
  overlapping.
- Vertical proportions and tall image crops suit the style, echoing print formats.

## Typography

- A Japanese-capable serif (Noto Serif JP, Shippori Mincho) for headings, with open tracking and
  a relaxed `1.4` line height.
- Body at 16px with a generous `1.85` line height.
- Where Japanese text is used decoratively, a readable translation sits alongside it — never as
  the only label for a control.

## Colour

Washi paper ground with sumi black, indigo and prussian blue, vermilion, ochre and moss. Six
colours at most, all flat. Gradients appear only as a *bokashi* band at the top or bottom of an
illustration.

## Surface and depth

Completely flat. Outlines (2px sumi) define shapes; overlap defines depth. No shadows, no
radius, no elevation.

## Motion

Gentle: 420ms fades and slow parallax between the layered planes — the one place motion adds to
the illusion of depth. Stops under reduced-motion.

## Imagery

Woodblock-style illustration: waves, mountains, cranes, blossom, figures in flowing robes. Flat
fills with outlines. Photography, if used, is posterised into the palette.

## Components

- **Plane stack** — the hero: three overlapping flat fields with a subject in the middle plane.
- **Buttons** — flat fill with a 2px sumi outline, serif label.
- **Nav** — washi bar with sumi links and a vermilion seal marking the active item.
- **Cards** — flat fields with outlines; a small seal-style badge in one corner.
- **Seal** — a vermilion square stamp used as an accent and for section markers.

## Do

- Build depth from overlapping flat planes.
- Keep the focal point off-centre.
- Use the bokashi gradient sparingly, at an edge.
- Outline shapes rather than shading them.

## Don't

- Don't use photographic shading or perspective.
- Don't exceed the six-colour palette.
- Don't centre the composition.
- Don't use Japanese text as the only label for an interactive element.

## How Weave verifies it

Deterministic checks sample illustration regions for flat fills and outline edges, analyse
element stacking for overlapping planes, measure paper texture opacity, count distinct painted
colours, compute the focal element's offset from centre, check font families where Japanese
characters appear, and measure contrast. The judged check asks whether it reads as a print
rather than generic flat vector art.

Reference pictures: `demo-design/ukiyo-e/`.
