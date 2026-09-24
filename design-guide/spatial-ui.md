---
slug: spatial-ui
title: Spatial UI
aliases: [vision os style, xr interface, depth ui]
status: ready
summary: Interfaces that behave like objects in space — translucent layers at real depths, soft ambient shadows and content that responds to attention.
best_for: [XR and device products, premium hardware, 3D configurators, next-gen app marketing]
avoid_for: [dense data tools, text-heavy reading, low-powered devices]
inherits: _base.md
tokens:
  colors:
    mode: both
    palette:
      - { name: environment, value: "#141318" }
      - { name: glass, value: "rgba(255, 255, 255, 0.12)" }
      - { name: glass-raised, value: "rgba(255, 255, 255, 0.18)" }
      - { name: border, value: "rgba(255, 255, 255, 0.22)" }
      - { name: foreground, value: "#F6F6F8" }
      - { name: muted, value: "#B9B9C4" }
      - { name: accent, value: "#7FA8FF" }
  typography:
    scale: large
    families:
      - { role: sans, family: "SF Pro Display, Inter, system-ui, sans-serif", weights: [400, 500, 600] }
    heading_tracking_em: -0.015
    heading_line_height: 1.15
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: spacious
    max_width_px: 1200
    section_spacing_px: [80, 128, 184]
    depth_levels: [background, content, raised, modal]
  shape:
    radius_px: 28
    border_px: 1
    shadow: "0 30px 80px rgba(0, 0, 0, 0.45)"
    blur_px: 24
  motion:
    duration_ms: 400
    easing: "cubic-bezier(0.32, 0.72, 0, 1)"
    properties: [transform, opacity, scale]
    intensity: physical
  imagery:
    treatment: [environment photography, depth-of-field blur, floating objects, soft light]
    illustration: soft 3D with real shadows
    icons: rounded, 2px, slightly dimensional
checks:
  - { id: spatial.depth.levels, rule: "surfaces map to defined depth levels with consistent blur, opacity and shadow per level", kind: deterministic }
  - { id: spatial.shape.large-radius, rule: "container radii are 24px or larger and uniform within a level", kind: deterministic }
  - { id: spatial.a11y.contrast-over-env, rule: "text on translucent surfaces meets 4.5:1 over the rendered environment", kind: deterministic }
  - { id: spatial.a11y.reduced-transparency, rule: "surfaces become opaque under prefers-reduced-transparency", kind: deterministic }
  - { id: spatial.motion.origin, rule: "elements scale and translate from their origin point rather than fading in place", kind: deterministic }
  - { id: spatial.focus.hover-lift, rule: "hover or focus raises an element by a consistent depth step with a matching shadow change", kind: deterministic }
  - { id: spatial.perf.layer-count, rule: "at most 6 blurred layers are composited in the initial viewport", kind: deterministic }
  - { id: spatial.feel.presence, rule: "panels read as objects occupying space, not as flat cards with blur", kind: judged }
---

# Spatial UI

## The look in one paragraph

Content floats in an environment rather than sitting on a page. Panels are large-radius
translucent slabs at defined depths, each with its own blur, opacity and ambient shadow; they
lift toward you on attention and settle back when you leave. Type is generous, imagery is soft
and atmospheric, and nothing has a hard edge.

## Layout

- Centred, spacious, 1200px, with very large section spacing (80–184px) so panels don't crowd
  each other in depth.
- Four depth levels — environment, content, raised, modal — each with fixed blur, opacity and
  shadow values. A panel belongs to exactly one level.
- Panels are wide and shallow; deep stacks of nested containers break the illusion.

## Typography

- One system-grade sans at 400/500/600, set slightly larger than usual (17px body) because
  spatial interfaces are read at a distance.
- Headings at `1.15` line height with mild negative tracking.
- Text sits on the panel, never directly on the environment.

## Colour

A dark neutral environment, white-alpha glass at two levels, a light border to catch the edge,
near-white text, and one cool accent for interactive states. Colour comes mostly from what's
behind the glass.

## Surface and depth

Each level defines: fill opacity, backdrop blur (24px at content level), border alpha and
shadow spread. Radius is large — 28px — and uniform within a level. Shadows are wide, soft and
low-opacity, like ambient occlusion rather than a drop shadow.

## Motion

Physical: 400ms with a spatial easing curve. Elements scale up from their own origin, raise a
depth step on hover or focus, and settle with no bounce. Modal content pushes the layer beneath
it back and blurs it further.

## Imagery

Environment photography with real depth of field, floating objects with contact shadows, soft
light. Product imagery is rendered with the same lighting direction across the page.

## Components

- **Panel** — the base object: glass fill, border, ambient shadow, large radius.
- **Buttons** — capsule glass at raised level; primary is a solid accent fill for certainty.
- **Nav** — a floating capsule bar at raised level, more blur than content panels.
- **Modal** — highest level; everything below gets extra blur and a dimming scrim.
- **Cards in a row** — same level, same radius, same shadow. Never mix levels in one row.

## Do

- Assign every surface an explicit depth level.
- Keep hover and focus lifts consistent with the level system.
- Put text on panels, not on the environment.
- Match lighting direction across all imagery.

## Don't

- Don't nest glass inside glass more than once.
- Don't vary radius within a level.
- Don't fade elements in place — spatial motion comes from an origin.
- Don't exceed the blur-layer budget; it costs frames on real devices.

## How Weave verifies it

Deterministic checks group surfaces by their blur/opacity/shadow values and assert they form a
consistent level system, compare radii within levels, measure contrast over the rendered
environment, force `prefers-reduced-transparency` and re-check opacity, inspect transform
origins and hover shadow deltas, and count composited blur layers in the first viewport. The
judged check asks whether panels read as objects with presence.

Reference pictures: `demo-design/spatial-ui/`.
