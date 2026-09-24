---
slug: risograph
title: Risograph
aliases: [riso print, spot colour print, mimeograph]
status: ready
summary: Spot-colour print charm — two or three fluorescent inks, visible misregistration, grain and overprint where colours multiply.
best_for: [arts and culture, zines and publishing, festivals, indie music, community projects]
avoid_for: [corporate software, luxury, ecommerce product detail, anything needing colour accuracy]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: stock, value: "#F3EFE2" }
      - { name: riso-pink, value: "#FF48B0" }
      - { name: riso-blue, value: "#0F5FD8" }
      - { name: riso-yellow, value: "#FFD21E" }
      - { name: overprint, value: "#6B2E86" }
      - { name: ink, value: "#1E1B18" }
  typography:
    scale: display
    families:
      - { role: display, family: "Archivo, Space Grotesk, Futura, sans-serif", weights: [600, 800] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [48, 88, 128]
    print_feel: elements offset 1-3px to imitate misregistration
  shape:
    radius_px: 0
    border_px: 2
    shadow: none
  motion:
    duration_ms: 180
    easing: "steps(2, end)"
    properties: [transform, opacity]
    intensity: printed
  imagery:
    treatment: [halftone-separated photos, two-ink overprint, paper grain, visible dot texture]
    illustration: flat spot-colour shapes with overprint areas
    icons: single-ink, chunky
checks:
  - { id: riso.color.spot-limited, rule: "at most 3 ink colours plus the stock and overprint blend", kind: deterministic }
  - { id: riso.effect.overprint, rule: "overlapping ink areas render as a multiplied blend, not as one ink covering the other", kind: deterministic }
  - { id: riso.effect.misregistration, rule: "at least 2 elements are offset 1-3px from their fill to imitate print misregistration", kind: deterministic }
  - { id: riso.texture.grain, rule: "grain or dot texture is present at 6-15% opacity", kind: deterministic }
  - { id: riso.image.halftone, rule: "photography is halftone-separated into the ink colours, not full colour", kind: deterministic }
  - { id: riso.a11y.contrast, rule: "ink on stock meets 4.5:1; fluorescent pink is not used for body text", kind: deterministic }
  - { id: riso.shape.flat, rule: "no gradients, radii or shadows — print has none", kind: deterministic }
  - { id: riso.feel.printed, rule: "the page reads as a risograph print rather than bright flat colours on white", kind: judged }
---

# Risograph

## The look in one paragraph

A print made on a duplicator: two or three fluorescent spot inks laid onto warm paper stock,
slightly out of register so edges show a sliver of the ink underneath, grain everywhere, and
areas where two inks overlap turning into a third darker colour. Cheap, bright, and physical.

## Layout

- 12 columns at 1200px, poster-like, with big type and flat colour blocks.
- Misregistration is the signature: an element's fill sits 1–3px off from its outline, exactly
  as a second pass of ink would.
- Compositions stay simple — riso can't hold fine detail.

## Typography

- A sturdy grotesque, heavy, tight (`1.0` line height). Type is often printed in one ink over a
  block of another.
- Body at 17px in near-black ink on stock.
- Headlines may show the same misregistration offset as the artwork.

## Colour

Warm paper stock with riso pink, blue and yellow — fluorescent, flat, and never more than three
per page. Where two inks overlap they multiply into a deeper colour, and that overprint is a
palette entry in its own right.

## Surface and depth

Flat print: no radii, no gradients, no shadows. Depth is overprint and layering only. Borders
are 2px, in ink.

## Motion

Printed: 180ms stepped transitions, elements arriving as if the next pass just came through the
machine. Slight offset shifts on hover are in character.

## Imagery

Photography separated into halftone dots per ink, so the dot pattern is visible. Illustration is
flat spot colour with deliberate overlaps.

## Components

- **Ink block** — a flat colour area holding type, offset from its outline.
- **Buttons** — flat ink fills with 2px outlines and a stepped hover.
- **Nav** — a single ink strip with contrasting labels.
- **Cards** — stock-coloured with a two-ink header block.
- **Dividers** — a thick ink rule with a misregistered ghost beneath.

## Do

- Keep to three inks.
- Show overprint where colours cross.
- Offset fills slightly from outlines.
- Halftone every photograph.

## Don't

- Don't use gradients, shadows or rounded corners.
- Don't set body copy in fluorescent pink.
- Don't use full-colour photography.
- Don't make misregistration so large it looks like a rendering bug.

## How Weave verifies it

Deterministic checks count distinct ink hues, sample overlapping regions for multiply blending,
measure offset distances between fills and outlines, detect grain texture opacity, analyse images
for halftone dot patterns, measure contrast, and flag gradients, radii and shadows. The judged
check asks whether it reads as a real print.

Reference pictures: `demo-design/risograph/`.
