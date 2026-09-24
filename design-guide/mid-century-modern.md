---
slug: mid-century-modern
title: Mid-Century Modern
aliases: [mcm, atomic age design, 1950s modernism]
status: ready
summary: Warm optimism from 1955 — mustard and teal, organic geometry, friendly slab and grotesque type, textured paper ground.
best_for: [hospitality, furniture and homeware, coffee and food brands, podcasts, boutique agencies]
avoid_for: [high-tech products, luxury minimal, anything needing a contemporary edge]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#F6EFE2" }
      - { name: ink, value: "#2B2622" }
      - { name: mustard, value: "#E0A324" }
      - { name: teal, value: "#2F7E79" }
      - { name: rust, value: "#C1502E" }
      - { name: olive, value: "#7A8450" }
      - { name: cream, value: "#FFFBF2" }
  typography:
    scale: large
    families:
      - { role: display, family: "Poppins, Futura, Jost, sans-serif", weights: [500, 700] }
      - { role: serif, family: "Bitter, Rockwell, Georgia, serif", weights: [400] }
    heading_tracking_em: -0.01
    heading_line_height: 1.1
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: asymmetric
    density: comfortable
    columns: 12
    max_width_px: 1240
    section_spacing_px: [56, 96, 140]
  shape:
    radius_px: 4
    organic_radius: "50% 50% 50% 50% / 60% 60% 40% 40%"
    border_px: 2
    shadow: "0 2px 0 rgba(43, 38, 34, 0.18)"
  motion:
    duration_ms: 240
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: gentle
  imagery:
    treatment: [grain texture, warm colour photography, screen-print illustration]
    illustration: flat with grain, atomic and boomerang motifs
    icons: rounded 2px, slightly quirky
checks:
  - { id: mcm.color.warm-palette, rule: "painted colours come from the warm palette; no cool greys or pure white backgrounds", kind: deterministic }
  - { id: mcm.color.paper-ground, rule: "page background is the paper token, not #FFFFFF", kind: deterministic }
  - { id: mcm.shape.organic, rule: "at least one decorative element uses an organic or capsule shape", kind: deterministic }
  - { id: mcm.shape.soft-flat, rule: "shadows are subtle single-offset, never large blurs", kind: deterministic }
  - { id: mcm.type.pairing, rule: "geometric sans for headings paired with a slab or bracketed serif for accents", kind: deterministic }
  - { id: mcm.texture.grain, rule: "a subtle grain or paper texture overlays backgrounds at low opacity", kind: deterministic }
  - { id: mcm.layout.asymmetry, rule: "sections alternate image and text sides rather than repeating one arrangement", kind: deterministic }
  - { id: mcm.feel.warmth, rule: "the page feels warm and optimistic rather than corporate retro pastiche", kind: judged }
---

# Mid-Century Modern

## The look in one paragraph

Warm paper ground, mustard and teal and rust, shapes that are geometric but rounded at the
corners, a friendly geometric sans, and a light grain over everything so it reads as printed
rather than rendered. Optimistic, domestic and unhurried — the design language of a 1955
travel poster applied to a website.

## Layout

- 12-column grid at 1240px, composed asymmetrically: image left then right, text blocks offset
  rather than centred.
- Generous spacing, but warmer and tighter than minimalism — 56–140px.
- Shapes overlap gently: a capsule behind a heading, a circle peeking from behind an image.

## Typography

- Geometric sans (Poppins, Futura, Jost) for headings at medium and bold; a slab or bracketed
  serif for quotes, numbers and accents.
- Headings `1.1` line height with slight negative tracking. Body 17px at `1.6`.
- Small caps and wide-tracked labels suit section markers.

## Colour

Paper (`#F6EFE2`) instead of white, warm near-black ink, and the mustard/teal/rust/olive family
used in flat blocks. Two accents per screen. Nothing neon, nothing cool-grey.

## Surface and depth

Almost flat: 4px radius on rectangles, capsule and organic shapes for decoration, 2px borders,
and shadows limited to a 2px single offset at low opacity. Depth reads as printed layers, not
as elevation.

## Motion

Gentle and slightly springy: 240ms, elements easing into place, decorative shapes drifting a
few pixels on scroll. Nothing bounces hard.

## Imagery

Warm colour photography with grain, screen-print style illustration, atomic starbursts,
boomerang and kidney shapes. Photos often sit inside an organic mask rather than a rectangle.

## Components

- **Buttons** — capsule, flat warm fill, 2px border optional, medium-weight label.
- **Nav** — paper background, ink links, active item marked by a mustard capsule.
- **Cards** — cream fill on paper ground, 4px radius, hairline border, minimal shadow.
- **Forms** — cream inputs with 2px ink borders and rounded corners.
- **Dividers** — a repeated geometric motif rather than a plain rule.

## Do

- Use paper, never pure white.
- Keep a grain overlay at 3–6% opacity.
- Alternate composition sides down the page.
- Let one organic shape appear per section.

## Don't

- Don't use cool greys or blue-black text.
- Don't add glassy or heavily blurred shadows.
- Don't over-round everything into blobs — geometry still leads.
- Don't let the grain reduce text contrast.

## How Weave verifies it

Deterministic checks sample the page background and painted colours against the warm palette,
detect the grain overlay and its opacity, look for at least one organic or capsule shape, read
shadow values for blur radius, confirm the two type roles are both present, and compare section
layouts for alternation. Contrast is re-measured with the grain overlay applied. The judged
check asks whether it feels warm and intentional rather than like retro clip art.

Reference pictures: `demo-design/mid-century-modern/`.
