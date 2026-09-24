---
slug: vintage-photo-modern-type
title: Vintage Photos + Modern Typography
aliases: [archival photo modern type, retro image contemporary layout]
status: ready
summary: A combination layer — archival or film photography under sharp contemporary type, so the tension between eras becomes the design.
best_for: [heritage brands with a modern story, fashion, restaurants, museums, documentary projects]
avoid_for: [futuristic tech products, illustration-led brands, anything without good archive imagery]
inherits: _base.md
combination: true
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#F4F1EB" }
      - { name: ink, value: "#111111" }
      - { name: sepia, value: "#9C8467" }
      - { name: faded-blue, value: "#7C93A6" }
      - { name: muted, value: "#6E6A63" }
      - { name: accent, value: "#B03A2E" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Inter, Neue Haas Grotesk, Helvetica Neue, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.03
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1280
    section_spacing_px: [56, 96, 140]
    composition: archival imagery full-bleed with contemporary type locked to the grid
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, clip-path]
    intensity: crisp
  imagery:
    treatment: [archival photography, film grain, faded colour or sepia, period detail]
    illustration: none — photography carries the past
    icons: contemporary hairline
  combination:
    applies_over: any modern base style
    layers: ["archival or film photography, unretouched", "contemporary grotesque type at the grid", "no period-style typography anywhere"]
checks:
  - { id: vpm.image.archival, rule: "photography is archival, film-grained or colour-faded rather than modern digital", kind: deterministic }
  - { id: vpm.type.contemporary, rule: "all typography is a contemporary grotesque; no period or retro faces", kind: deterministic }
  - { id: vpm.contrast.eras, rule: "type sits crisply on or beside the aged imagery without imitating its era", kind: deterministic }
  - { id: vpm.layout.grid, rule: "type is locked to a strict grid even when imagery is loose or full-bleed", kind: deterministic }
  - { id: vpm.a11y.text-on-photo, rule: "text over photography meets 4.5:1 against the actual pixels behind it", kind: deterministic }
  - { id: vpm.image.credits, rule: "archival images carry a caption or credit line where the source requires it", kind: deterministic }
  - { id: vpm.base.preserved, rule: "the base style's layout and colour rules still hold beneath the treatment", kind: deterministic }
  - { id: vpm.feel.tension, rule: "the era gap reads as a deliberate contrast rather than as a mismatch", kind: judged }
---

# Vintage Photos + Modern Typography

## The look in one paragraph

Old pictures, new type. Archival photography — faded colour, film grain, period clothing and
cars — sits under a sharp contemporary grotesque locked to a strict grid. Neither side imitates
the other: the photographs are not filtered to look modern, and the type never borrows a retro
face. The gap between them is the design.

## How to combine it

1. Keep the base style's layout, grid and colour rules.
2. Replace its imagery with archival or film photography, unretouched and uncropped-looking.
3. Set all type in a contemporary grotesque, tightly tracked, aligned to the grid.
4. Resist every temptation to add period ornament, retro faces or heavy texture overlays.

## Layout

- 12 columns at 1280px. Imagery may run full-bleed and loose; type stays rigidly on the grid.
- Captions in small contemporary type sit beneath or beside images, never in a period style.
- Large headlines can overlap photographs, provided contrast holds.

## Typography

- One neutral grotesque, regular and bold, set tight (`-0.03em`, `0.95` line height) for
  headlines.
- Body at 17px. Captions and credits small, plain, modern.
- No serifs, no scripts, no period lettering anywhere.

## Colour

Warm paper ground, near-black type, and whatever the photographs bring — sepia, faded blue,
washed reds. Interface colour stays neutral so the imagery carries the era.

## Surface and depth

Flat and modern: no radii, no shadows. Images sit directly on the ground, full-bleed or
grid-aligned.

## Motion

Crisp and contemporary: 400ms clip reveals and fades. The motion belongs to the present, like
the type.

## Imagery

Archival photography with real grain, faded dye layers, dust and scratches left in. Modern
photographs processed to look old rarely survive scrutiny — use genuine archive material where
you can, and respect its licensing.

## Do

- Keep type strictly contemporary.
- Let photographs show their age.
- Align type to the grid even when imagery is loose.
- Caption and credit archive material.

## Don't

- Don't add retro typefaces or ornament.
- Don't heavily filter modern photos to fake the effect.
- Don't overlay text on the busiest part of an image.
- Don't let the treatment override the base style's layout rules.

## How Weave verifies it

Deterministic checks analyse images for grain, dye fade and tonal characteristics of archival
material, confirm every font resolves to a contemporary grotesque, compare type alignment against
the grid, measure contrast where text overlays photography, look for caption/credit elements, and
re-run the base style's own checks. The judged check asks whether the era gap reads as deliberate.

Reference pictures: `demo-design/vintage-photo-modern-type/`.
