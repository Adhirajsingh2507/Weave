---
slug: skeuomorphism
title: Skeuomorphism
aliases: [realistic ui, textured ui, ios 6 style]
status: ready
summary: Interfaces that imitate real materials — stitched leather, brushed metal, felt and glass, with real light and cast shadows.
best_for: [music and audio apps, notes and journals, games, device companions, nostalgia products]
avoid_for: [content sites, enterprise tools, anything needing fast loads or high density]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: leather, value: "#6B4A2F" }
      - { name: stitch, value: "#E8D9B8" }
      - { name: felt, value: "#2F6148" }
      - { name: metal-hi, value: "#F2F3F5" }
      - { name: metal-lo, value: "#9AA0A8" }
      - { name: paper, value: "#F6EFDF" }
      - { name: ink, value: "#2B2620" }
    gradients:
      - { name: brushed-metal, value: "linear-gradient(180deg, #F2F3F5 0%, #C9CED4 48%, #AEB4BC 52%, #E7EAEE 100%)" }
  typography:
    scale: default
    families:
      - { role: serif, family: "Georgia, Charter, serif", weights: [400, 700] }
      - { role: sans, family: "Inter, Helvetica Neue, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: centered
    density: comfortable
    max_width_px: 1080
    section_spacing_px: [40, 72, 104]
    structure: framed panels imitating physical objects
  shape:
    radius_px: 10
    border_px: 1
    shadow: "0 2px 0 rgba(255,255,255,0.5) inset, 0 10px 20px rgba(0,0,0,0.30)"
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.25, 0.8, 0.35, 1)"
    properties: [transform, box-shadow]
    intensity: physical
  imagery:
    treatment: [material textures — leather, linen, wood, metal, paper — plus real product photography]
    illustration: rendered objects with real shadows
    icons: rendered with material, bevel and shadow
checks:
  - { id: skeu.material.texture, rule: "surfaces carry a real material texture rather than flat colour", kind: deterministic }
  - { id: skeu.light.consistent, rule: "highlights and shadows follow one light direction across all components", kind: deterministic }
  - { id: skeu.depth.bevel, rule: "raised elements combine an inset top highlight with an outer cast shadow", kind: deterministic }
  - { id: skeu.a11y.contrast-on-texture, rule: "text over textures meets 4.5:1 measured against the rendered pixels", kind: deterministic }
  - { id: skeu.perf.texture-weight, rule: "texture images are tiled or compressed; total texture payload under 400KB", kind: deterministic }
  - { id: skeu.state.press, rule: "controls have a pressed state that inverts the bevel", kind: deterministic }
  - { id: skeu.a11y.labels, rule: "rendered icon controls still expose text labels or accessible names", kind: deterministic }
  - { id: skeu.feel.material, rule: "surfaces read as specific real materials rather than generic gradients", kind: judged }
---

# Skeuomorphism

## The look in one paragraph

The interface pretends to be an object: stitched leather around a notes app, brushed metal on a
toolbar, green felt behind the cards, torn paper at the top of a list. Light comes from above,
edges are bevelled, and everything casts a real shadow. Warm, tactile and heavy — the opposite
of flat.

## Layout

- Centred, 1080px, with content framed inside panels that imitate physical objects.
- The frame is part of the design: a leather binding, a metal bezel, a wooden shelf edge.
- Density is moderate — real objects need margins to read as objects.

## Typography

- A serif for content (echoing print) and a sans for controls, both at readable sizes.
- Type may be engraved (dark text with a 1px light shadow below) or embossed (the reverse) —
  applied to labels only, never to body copy.
- Body 17px at `1.65`.

## Colour

Material colours rather than brand colours: leather browns, felt greens, metal greys, paper
creams. Accents come from the materials themselves — a brass rivet, a red ribbon.

## Surface and depth

Every surface needs three things: a texture, a bevel (inset light top edge, dark bottom edge),
and a cast shadow consistent with a single overhead light. Radius stays modest (10px) because
real objects have small fillets.

## Motion

Physical: 300ms, buttons depressing into their bezel, panels sliding with weight, pages turning.
Motion mimics the object being imitated.

## Imagery

Real material textures — leather grain, linen weave, wood, brushed metal, paper fibre — plus
product photography lit from the same direction as the interface.

## Components

- **Panel** — textured surface inside a material frame with stitching or a bezel.
- **Buttons** — bevelled caps with engraved labels and a genuine pressed state.
- **Toggles** — physical switches with a travel path and a state label.
- **Lists** — paper rows with a torn or perforated edge and a subtle drop shadow.
- **Toolbar** — brushed metal strip with recessed controls.

## Do

- Choose specific materials and stay consistent.
- Keep one light direction everywhere.
- Give every control a pressed state.
- Keep texture files small and tiled.

## Don't

- Don't mix light directions between components.
- Don't emboss body copy.
- Don't let texture eat text contrast.
- Don't ship megabytes of texture imagery.

## How Weave verifies it

Deterministic checks look for background texture images or patterns on surfaces, compare
highlight and shadow offsets across components to confirm one light direction, read bevel and
cast-shadow pairs, measure contrast over rendered textures, total texture payload from network
requests, confirm pressed states invert the bevel, and check accessible names on rendered icon
controls. The judged check asks whether surfaces read as specific materials.

Reference pictures: `demo-design/skeuomorphism/`.
