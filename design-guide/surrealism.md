---
slug: surrealism
title: Surrealism
aliases: [surreal design, dreamlike, magritte style]
status: ready
summary: Dream logic rendered plainly — ordinary objects in impossible relationships, sharp realism, unsettling scale and calm empty skies.
best_for: [fashion and fragrance, music and film, art institutions, campaign microsites, AI product marketing]
avoid_for: [utility software, healthcare, finance, anything needing immediate clarity]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: sky, value: "#BFD4E6" }
      - { name: sand, value: "#E2D5BE" }
      - { name: ink, value: "#1C1A18" }
      - { name: stone, value: "#8E8A82" }
      - { name: dusk, value: "#3E4A63" }
      - { name: flesh, value: "#D9A88C" }
      - { name: accent, value: "#C0392B" }
  typography:
    scale: display
    families:
      - { role: serif, family: "Cormorant Garamond, Didot, Georgia, serif", weights: [300, 500] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.02
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.7
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1200
    section_spacing_px: [80, 128, 184]
    composition: one impossible image per section, large empty sky, unexpected scale
  shape:
    radius_px: 0
    border_px: 1
    shadow: "0 30px 60px rgba(28, 26, 24, 0.22)"
  motion:
    duration_ms: 700
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [transform, opacity, clip-path]
    intensity: dreamlike
  imagery:
    treatment: [photoreal composites, impossible scale, floating objects, long shadows, empty skies]
    illustration: realistic rendering of impossible scenes
    icons: plain, understated, never surreal
checks:
  - { id: surr.image.impossible, rule: "at least one composite shows an impossible relationship (scale, gravity, or context)", kind: deterministic }
  - { id: surr.render.realistic, rule: "composites are photoreal with consistent lighting and shadow direction", kind: deterministic }
  - { id: surr.space.sky, rule: "large calm empty areas surround the focal image in each section", kind: deterministic }
  - { id: surr.type.restrained, rule: "typography stays plain and serif; the imagery carries the strangeness", kind: deterministic }
  - { id: surr.a11y.alt-describes, rule: "composite images have alt text describing what is depicted, including the impossible part", kind: deterministic }
  - { id: surr.a11y.contrast, rule: "text over imagery meets 4.5:1 or sits on plain ground", kind: deterministic }
  - { id: surr.motion.slow, rule: "motion is 600ms or slower, drifting rather than reacting, and stops under prefers-reduced-motion", kind: deterministic }
  - { id: surr.feel.uncanny, rule: "the composition reads as calmly uncanny rather than as a chaotic collage", kind: judged }
---

# Surrealism

## The look in one paragraph

Everything is rendered plainly and precisely, and nothing is possible: a door standing in a
desert, a cloud indoors, an apple the size of a room. The lighting is consistent, the shadows
are long, the sky is empty, and the type is quiet. The strangeness comes from relationships
between ordinary things, not from visual noise.

## Layout

- Asymmetric at 1200px with very generous spacing — each impossible image needs calm around it.
- One composite per section, large, with sky or plain ground filling the rest.
- Scale is the main tool: an object far too large or small for its setting.

## Typography

- A light serif set large with open tracking for headings; a plain sans for small labels.
- Body at 17px with `1.7` line height, always on plain ground.
- Type never distorts or floats — it stays the rational element on the page.

## Colour

Pale sky blue, warm sand, stone grey, dusk blue, with one red accent used like an object in the
scene rather than as interface colour. Everything slightly muted, as if painted.

## Surface and depth

Realistic: long soft shadows anchoring floating objects, consistent light direction, no UI
gloss or gradients. Containers are plain with hairline borders.

## Motion

Dreamlike: 700ms drifts, an object rotating imperceptibly, a shadow lengthening as you scroll.
Nothing reacts quickly; nothing bounces. Stops under reduced-motion.

## Imagery

Photoreal composites: floating rocks, doors in landscapes, objects at impossible scale, mirrors
showing the wrong thing. Lighting and grain must match across all composited elements or the
effect collapses into obvious collage.

## Components

- **Composite scene** — the section's centrepiece with its shadow and empty surroundings.
- **Caption** — a small plain label naming the scene, like a gallery card.
- **Buttons** — completely ordinary; the interface stays sane.
- **Nav** — minimal, plain serif, never overlapping the scene.
- **Quote block** — serif over plain ground beside a scene.

## Do

- Match lighting and grain across composited elements.
- Use scale as the primary device.
- Leave large calm areas.
- Describe the impossible part in alt text.

## Don't

- Don't distort the typography.
- Don't crowd multiple impossible ideas into one image.
- Don't use obvious filters or glow — realism sells the illusion.
- Don't let the interface become surreal too; it must stay usable.

## How Weave verifies it

Deterministic checks look for composite imagery and analyse shadow directions and grain
consistency across elements, measure the calm area around each focal image, confirm typography
stays plain, check alt text length and content, measure contrast, and read motion timing. The
judged check asks whether the result is calmly uncanny rather than chaotic.

Reference pictures: `demo-design/surrealism/`.
