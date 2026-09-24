---
slug: low-poly
title: Low Poly
aliases: [faceted 3d, polygon art, triangulated]
status: ready
summary: Geometry reduced to visible facets — flat-shaded triangles, hard edges between planes and colour that shifts per face.
best_for: [games and indie studios, tech and crypto brands, event graphics, abstract hero visuals]
avoid_for: [editorial, luxury, anything needing realism or fine detail]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: base, value: "#0C1220" }
      - { name: facet-1, value: "#2E4C8A" }
      - { name: facet-2, value: "#3F6FBF" }
      - { name: facet-3, value: "#63A0E8" }
      - { name: facet-4, value: "#9BCBFF" }
      - { name: foreground, value: "#EAF1FB" }
      - { name: accent, value: "#FF9F1C" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Inter, Space Grotesk, system-ui, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.02
    heading_line_height: 1.1
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [56, 96, 136]
    composition: faceted hero object or terrain, flat UI around it
  shape:
    radius_px: 4
    border_px: 1
    shadow: none
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: rotating
  imagery:
    treatment: [flat-shaded polygon meshes, faceted terrain, crystalline forms]
    illustration: triangulated shapes with per-face colour
    icons: angular, faceted or flat
checks:
  - { id: poly.shading.flat, rule: "meshes use flat per-face shading with no smooth normals or gradients", kind: deterministic }
  - { id: poly.facets.visible, rule: "facet edges are clearly visible at rendered size", kind: deterministic }
  - { id: poly.palette.ramp, rule: "face colours come from one tonal ramp so the object reads as a single material", kind: deterministic }
  - { id: poly.light.consistent, rule: "brighter facets consistently face one light direction", kind: deterministic }
  - { id: poly.perf.budget, rule: "3D assets are SVG or a light canvas; total under 600KB and 60fps on mid hardware", kind: deterministic }
  - { id: poly.a11y.decorative, rule: "decorative 3D canvases are hidden from assistive technology and never trap focus", kind: deterministic }
  - { id: poly.motion.rotate, rule: "rotation is slow and continuous, and stops under prefers-reduced-motion", kind: deterministic }
  - { id: poly.feel.crystal, rule: "forms read as deliberately faceted rather than as low-quality 3D", kind: judged }
---

# Low Poly

## The look in one paragraph

Three-dimensional forms simplified until you can count the triangles: flat-shaded facets,
hard edges between planes, colour stepping across the surface as each face catches the light
differently. Crystalline and synthetic, with the interface staying flat and quiet around it.

## Layout

- Centred at 1200px with one faceted object or terrain per section.
- Faceted terrain works well as a hero band across the full width, with the interface above it.
- UI elements stay flat and conventional — the geometry is the visual interest.

## Typography

- One sans at 400/700. Headings `1.1` with slight negative tracking.
- Body 17px at `1.6` in near-white on the dark ground.
- No angular or faceted typefaces; that doubles the effect and looks amateur.

## Colour

Dark blue ground with a four-step tonal ramp for facets, plus one warm accent. Every face takes
a colour from the ramp according to its angle to the light, which is what makes the object read
as one material rather than a mosaic.

## Surface and depth

Flat shading only — no gradients across a face, no specular highlights, no smoothing. Edges
between facets are hard. UI surfaces are flat with 4px radii and hairline borders.

## Motion

Rotating: 500ms transitions, with the hero object turning slowly and continuously so facets
catch the light in sequence. Stops under reduced-motion.

## Imagery

Polygon meshes: terrain, crystals, animals, abstract forms. Render to SVG or a lightweight
canvas; heavy WebGL scenes are rarely worth the cost for a decorative hero.

## Components

- **Hero object** — the faceted centrepiece, rotating.
- **Terrain band** — a faceted landscape strip behind a section.
- **Cards** — flat dark surfaces with a small faceted thumbnail.
- **Buttons** — conventional flat fills; never faceted.
- **Dividers** — a triangulated edge between two sections.

## Do

- Keep shading flat and per-face.
- Derive face colours from one ramp.
- Keep one light direction.
- Watch the asset budget.

## Don't

- Don't smooth normals or add gradients across faces.
- Don't facet the typography or the UI.
- Don't let a 3D canvas block first paint or trap focus.
- Don't animate without a reduced-motion stop.

## How Weave verifies it

Deterministic checks sample rendered surfaces for flat per-face colour and hard edges, measure
facet size at rendered scale, compare face colours against the ramp, check brightness against a
single light direction, measure asset weight and frame rate, verify canvas accessibility, and
read motion behaviour. The judged check asks whether the faceting looks deliberate.

Reference pictures: `demo-design/low-poly/`.
