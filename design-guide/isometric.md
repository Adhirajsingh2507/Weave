---
slug: isometric
title: Isometric
aliases: [iso illustration, 2.5d, isometric scene]
status: ready
summary: Everything drawn at 30 degrees — tiny worlds of stacked cubes and buildings with no vanishing point and perfect parallel lines.
best_for: [infrastructure and devops products, logistics, city and property tech, explainer sections, games]
avoid_for: [fashion, editorial, emotional storytelling, anything needing photographic warmth]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#F4F6FB" }
      - { name: ink, value: "#1F2739" }
      - { name: muted, value: "#5E6A85" }
      - { name: face-top, value: "#8FB4FF" }
      - { name: face-left, value: "#5C86DB" }
      - { name: face-right, value: "#3C63AE" }
      - { name: accent, value: "#FFB020" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Geist, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [56, 96, 136]
    projection: true isometric, 30 degrees, no perspective convergence
  shape:
    radius_px: 10
    border_px: 1
    shadow: "0 8px 24px rgba(31, 39, 57, 0.10)"
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [transform, opacity]
    intensity: constructed
  imagery:
    treatment: [isometric vector scenes, stacked cubes, cutaway buildings, flat three-tone shading]
    illustration: iso scenes built from a shared cube module
    icons: isometric or flat line, consistent within a set
checks:
  - { id: iso.projection.angle, rule: "illustration edges run at 30 degrees; no perspective convergence", kind: deterministic }
  - { id: iso.shading.three-tone, rule: "each solid uses exactly three flat tones for top, left and right faces", kind: deterministic }
  - { id: iso.scale.module, rule: "scene elements share one cube module size so the world reads as consistent", kind: deterministic }
  - { id: iso.color.face-mapping, rule: "the same face always takes the same tone across every object", kind: deterministic }
  - { id: iso.a11y.scene-alt, rule: "informative isometric scenes carry a text description; decorative ones are hidden", kind: deterministic }
  - { id: iso.perf.svg, rule: "scenes are SVG or compressed raster under 200KB each", kind: deterministic }
  - { id: iso.layout.ui-flat, rule: "interface chrome stays flat and axis-aligned; only illustration is projected", kind: deterministic }
  - { id: iso.feel.world, rule: "the scene reads as a coherent miniature world rather than assorted 3D-ish icons", kind: judged }
---

# Isometric

## The look in one paragraph

Little worlds seen from a corner: cubes, buildings, servers and people drawn at exactly 30°
with no perspective, so parallel lines stay parallel forever. Three flat tones per solid — top,
left, right — and a consistent module size, which is what makes a scene look built rather than
assembled.

## Layout

- Ordinary 12-column layout at 1200px for the interface; the isometric world lives inside
  illustration areas.
- Scenes are wide and shallow, with the module grid running diagonally across them.
- Content sections alternate: scene, explanation, scene.

## Typography

- One neutral sans at 400/600, flat and axis-aligned. Type is never skewed into the projection —
  that reads as a mistake.
- Headings at `1.2`, body 17px at `1.6`.
- Labels inside a scene sit on flat callout chips connected by a thin leader line.

## Colour

Light ground, ink text, and a face palette: a light tone for top faces, a mid tone for left
faces, a dark tone for right faces. One warm accent picks out the important object in the scene.

## Surface and depth

The interface stays flat with 10px radii and soft shadows. Depth is entirely inside the
illustration, produced by the projection and the three-tone shading.

## Motion

Constructed: 400ms, objects sliding into place along the isometric axes as though being
assembled, or a subtle float on one element. Motion follows the same 30° axes.

## Imagery

SVG isometric scenes built from one cube module: data centres, city blocks, stacked platforms,
cutaway rooms. Every object obeys the same shading map.

## Components

- **Scene** — the illustration block, SVG, with optional labelled callouts.
- **Callout chip** — flat rounded label with a leader line into the scene.
- **Cards** — flat interface cards with an isometric thumbnail.
- **Buttons/nav** — completely conventional and flat.
- **Diagram stack** — layered iso planes showing architecture tiers.

## Do

- Keep the projection at a true 30° with no convergence.
- Use one module size across a scene.
- Map tones to faces consistently.
- Keep interface chrome flat.

## Don't

- Don't mix perspective and isometric in one scene.
- Don't skew type into the projection.
- Don't shade with gradients — three flat tones only.
- Don't leave informative scenes without a text description.

## How Weave verifies it

Deterministic checks analyse SVG path angles for 30° consistency and absence of convergence,
count distinct fill tones per solid and verify face-to-tone mapping, compare module dimensions
across objects, check accessible descriptions on scenes, measure asset sizes, and confirm UI
elements use no skew transforms. The judged check asks whether the scene reads as one coherent
world.

Reference pictures: `demo-design/isometric/`.
