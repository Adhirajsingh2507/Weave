---
slug: inflated-3d
title: 3D Inflated
aliases: [3d inflated, balloon 3d, puffy type, blow-up]
status: ready
summary: Type and objects blown up like balloons — glossy inflated forms, soft studio light and shapes that look full of air.
best_for: [app launches, music and merch, kids and toys, campaign microsites, AI product marketing]
avoid_for: [editorial, enterprise, data-heavy products, anything formal]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#F2F0FF" }
      - { name: ink, value: "#221B3D" }
      - { name: balloon-pink, value: "#FF79C6" }
      - { name: balloon-blue, value: "#5AA9FF" }
      - { name: balloon-lime, value: "#B4F25F" }
      - { name: balloon-cream, value: "#FFE9C7" }
      - { name: highlight, value: "#FFFFFF" }
  typography:
    scale: display
    families:
      - { role: display, family: "Bagel Fat One, Rubik Bubbles, Poppins, sans-serif", weights: [700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [64, 104, 144]
    composition: one inflated hero object per section, floating with a contact shadow
  shape:
    radius_px: 999
    border_px: 0
    shadow: "0 30px 50px rgba(34, 27, 61, 0.18)"
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.37, 0, 0.35, 1)"
    properties: [transform, rotate]
    intensity: floating
  imagery:
    treatment: [3D renders with soft studio light, glossy inflated materials, soft contact shadows]
    illustration: inflated letterforms, balloon objects, puffy icons
    icons: 3D inflated or thick rounded line
checks:
  - { id: inf.object.3d, rule: "the hero contains a rendered inflated 3D object or inflated lettering", kind: deterministic }
  - { id: inf.light.studio, rule: "3D assets share one soft studio light direction and a soft contact shadow", kind: deterministic }
  - { id: inf.shape.rounded, rule: "UI containers use fully rounded or 24px+ radii to match the inflated language", kind: deterministic }
  - { id: inf.color.candy, rule: "palette is bright candy pastels on a light ground", kind: deterministic }
  - { id: inf.a11y.text-flat, rule: "body copy is flat vector text, never rendered into a 3D image", kind: deterministic }
  - { id: inf.perf.asset-weight, rule: "3D renders are compressed images or a single lightweight canvas; total under 800KB", kind: deterministic }
  - { id: inf.motion.float, rule: "objects drift or rotate slowly at 500ms+, stopping under prefers-reduced-motion", kind: deterministic }
  - { id: inf.feel.air, rule: "forms look full of air with taut surfaces rather than merely rounded", kind: judged }
---

# 3D Inflated

## The look in one paragraph

Letters and objects blown up until their surfaces go taut: rounded seams, glossy highlights,
soft studio light and a contact shadow underneath. Bright candy colours on a pale ground, with
one big inflated object per section floating just above the page.

## Layout

- Centred at 1140px with generous spacing — inflated objects need air around them.
- One hero object per section, floating, with a soft contact shadow directly beneath it
  grounding it in space.
- Flat UI elements sit around the object in ordinary layout; the 3D is scenery, not structure.

## Typography

- Inflated display lettering for the hero word, rendered in 3D or set in a puffy rounded face.
- A plain sans for everything readable at 17px.
- Body copy is never rendered as 3D — it stays flat, selectable text.

## Colour

Pale lilac ground with candy pastels: pink, blue, lime, cream. Highlights are pure white and
sit at the same angle on every object.

## Surface and depth

Glossy but soft: broad specular highlights, gentle falloff, rounded seams where the form would
be welded. UI containers are fully rounded so the flat elements agree with the inflated ones.

## Motion

Floating: 600ms, objects drifting up and down a few pixels and rotating slowly, as though
suspended. Stops under reduced-motion.

## Imagery

3D renders of inflated forms — letters, hearts, clouds, product shapes — lit by a single soft
studio source with a large key and a gentle fill.

## Components

- **Hero object** — the inflated centrepiece, floating with a contact shadow.
- **Buttons** — fully rounded, flat candy fill with a subtle top highlight, no heavy 3D.
- **Cards** — white fills, large radii, soft shadows, an inflated icon on top.
- **Icons** — small inflated renders or thick rounded line work.
- **Sticker badges** — inflated pills with short labels.

## Do

- Keep one light direction across every 3D asset.
- Ground floating objects with a contact shadow.
- Keep UI flat and let the objects carry the dimension.
- Compress renders aggressively.

## Don't

- Don't render text into images.
- Don't scatter many small 3D objects — one big one reads better.
- Don't mix light directions.
- Don't let a heavy 3D canvas block first paint.

## How Weave verifies it

Deterministic checks confirm a 3D asset or inflated lettering loads in the hero, compare highlight
and shadow positions across assets for a shared light direction, read container radii, sample the
palette, verify body text is DOM text, total 3D asset transfer size, and read motion duration plus
reduced-motion behaviour. The judged check asks whether forms look genuinely inflated.

Reference pictures: `demo-design/inflated-3d/`.
