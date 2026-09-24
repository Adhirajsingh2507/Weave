---
slug: clay-style
title: Clay Style
aliases: [claymorphism, soft 3d, plasticine ui]
status: ready
summary: Soft moulded 3D — puffy rounded forms with inner light and two-tone shadows, like an interface pressed from modelling clay.
best_for: [onboarding flows, kids and education, fintech apps, playful SaaS, app store marketing]
avoid_for: [dense dashboards, editorial, enterprise, anything needing precision]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#EFE9FB" }
      - { name: surface, value: "#FBF8FF" }
      - { name: ink, value: "#332B4A" }
      - { name: muted, value: "#7C7396" }
      - { name: lilac, value: "#9C7BF5" }
      - { name: peach, value: "#FF9F7E" }
      - { name: mint, value: "#7BE0C0" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Poppins, Nunito, DM Sans, sans-serif", weights: [500, 700] }
    heading_tracking_em: -0.015
    heading_line_height: 1.15
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1120
    section_spacing_px: [64, 104, 148]
  shape:
    radius_px: 32
    border_px: 0
    shadow: "0 18px 40px rgba(51, 43, 74, 0.16), inset 0 -8px 16px rgba(51, 43, 74, 0.10), inset 0 8px 16px rgba(255, 255, 255, 0.85)"
  motion:
    duration_ms: 320
    easing: "cubic-bezier(0.34, 1.4, 0.64, 1)"
    properties: [transform, box-shadow]
    intensity: squishy
  imagery:
    treatment: [soft 3D renders, matte clay materials, rounded props with soft shadows]
    illustration: plasticine-style 3D objects and characters
    icons: soft 3D or thick rounded line
checks:
  - { id: clay.shape.radius-large, rule: "container radii are 24px or greater", kind: deterministic }
  - { id: clay.depth.dual-inset, rule: "surfaces combine an outer soft shadow with inset light and dark shadows", kind: deterministic }
  - { id: clay.color.pastel-matte, rule: "fills are matte pastels; no gradients with visible banding or gloss highlights", kind: deterministic }
  - { id: clay.a11y.contrast, rule: "ink on every pastel surface meets 4.5:1", kind: deterministic }
  - { id: clay.a11y.affordance, rule: "interactive clay elements are distinguishable from static ones by more than depth alone", kind: deterministic }
  - { id: clay.motion.squish, rule: "press states compress the element and reduce its outer shadow", kind: deterministic }
  - { id: clay.perf.shadow-count, rule: "at most 3 shadow layers per element", kind: deterministic }
  - { id: clay.feel.moulded, rule: "surfaces read as soft moulded material rather than flat cards with big radii", kind: judged }
---

# Clay Style

## The look in one paragraph

Everything looks pressed from soft modelling clay: fat rounded corners, matte pastel colour,
a bright inner highlight along the top edge and a soft inner shadow along the bottom, with a
wide diffuse shadow underneath. Objects look squeezable, and pressing one should squash it
slightly.

## Layout

- Centred, 1120px, comfortable spacing, with large elements — clay forms need room to read.
- Composition is simple: a few big objects rather than many small ones. Detail is carried by
  the material, not the arrangement.
- Illustrations and UI share the same material language.

## Typography

- A rounded geometric sans at 500/700 — the letterforms should match the softness of the shapes.
- Headings at `1.15`, body 17px at `1.6`, all in a deep muted ink rather than black.
- No thin weights; clay has no thin edges.

## Colour

Soft lilac background, near-white surfaces, and matte pastels — lilac, peach, mint. Flat matte
fills only: gloss highlights turn this into skeuomorphism, and hard gradients turn it into
plastic.

## Surface and depth

The three-part recipe: a wide soft outer shadow, an inset dark shadow at the bottom, and an
inset white highlight at the top. Radius 32px. No borders — the shadow defines the edge.

## Motion

Squishy: 320ms with a slight overshoot. Hover lifts and widens the outer shadow; press
compresses the element (`scale(0.97)`) and pulls the shadow in, so it feels physically pushed.

## Imagery

Soft 3D renders in matte clay materials, rounded characters and props, consistent soft lighting
from above. Photography rarely fits; when used, mask it into a heavily rounded shape.

## Components

- **Cards** — clay slabs with the full shadow recipe and generous padding.
- **Buttons** — smaller clay forms in an accent colour, with a real squish on press.
- **Inputs** — inverted clay: inset shadow on all sides so the field looks pressed in.
- **Icons** — soft 3D or thick rounded line work, never sharp.
- **Nav** — a floating clay bar with pill-shaped items.

## Do

- Use the full inner-light plus inner-shadow recipe on every clay surface.
- Keep fills matte.
- Give interactive elements a visible press state.
- Keep objects large.

## Don't

- Don't add gloss highlights or reflections.
- Don't rely on depth alone to signal interactivity — the base rules still need labels and
  focus states.
- Don't stack more than three shadow layers; it costs paint time.
- Don't use small text on clay surfaces; the soft edges reduce apparent contrast.

## How Weave verifies it

Deterministic checks read radii and shadow declarations to confirm the outer-plus-dual-inset
recipe, look for gradient or gloss highlights that break the matte rule, measure contrast on
each pastel surface, compare hover and active shadow/scale values for the squish, count shadow
layers, and confirm interactive elements carry affordances beyond depth. The judged check asks
whether surfaces read as moulded material.

Reference pictures: `demo-design/clay-style/`.
