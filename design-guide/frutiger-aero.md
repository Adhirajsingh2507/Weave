---
slug: frutiger-aero
title: Frutiger Aero
aliases: [frutigerr aero, aero glass, 2007 optimism]
status: ready
summary: Mid-2000s optimism — glossy glass, water droplets, bright skies, green grass and humanist type that promises everything will be fine.
best_for: [nostalgia products, wellness and eco brands, music, indie software, community sites]
avoid_for: [luxury, serious enterprise, anything wanting a contemporary edge]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: sky, value: "#BFE6FF" }
      - { name: deep-sky, value: "#1F8FE0" }
      - { name: grass, value: "#5FC94A" }
      - { name: white, value: "#FFFFFF" }
      - { name: ink, value: "#173A4D" }
      - { name: aqua, value: "#8FE3E8" }
      - { name: sun, value: "#FFE27A" }
    gradients:
      - { name: glass, value: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0.08) 52%, rgba(255,255,255,0.45) 100%)" }
      - { name: sky-wash, value: "linear-gradient(180deg, #BFE6FF 0%, #FFFFFF 70%)" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Frutiger, Myriad Pro, Segoe UI, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0
    heading_line_height: 1.2
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1120
    section_spacing_px: [48, 80, 120]
  shape:
    radius_px: 14
    pill_radius_px: 999
    border_px: 1
    shadow: "0 6px 16px rgba(23, 58, 77, 0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
  motion:
    duration_ms: 280
    easing: "cubic-bezier(0.25, 0.8, 0.35, 1)"
    properties: [transform, opacity, box-shadow]
    intensity: bouncy-light
  imagery:
    treatment: [water droplets, bubbles, blue skies, grass, tropical fish, lens flare]
    illustration: glossy 3D orbs and leaves
    icons: glossy filled with a highlight
checks:
  - { id: aero.gloss.highlight, rule: "glossy surfaces carry an inset top highlight and a two-stage gradient", kind: deterministic }
  - { id: aero.color.sky-nature, rule: "the palette centres on sky blue, white and green", kind: deterministic }
  - { id: aero.shape.rounded, rule: "radii are 14px or fully rounded; nothing square", kind: deterministic }
  - { id: aero.image.nature, rule: "imagery includes water, sky or foliage elements", kind: deterministic }
  - { id: aero.type.humanist, rule: "type is a humanist sans at 400/600, sentence case", kind: deterministic }
  - { id: aero.a11y.contrast-on-glass, rule: "text over glossy translucent surfaces meets 4.5:1 against the rendered backdrop", kind: deterministic }
  - { id: aero.effect.bubbles, rule: "decorative bubble or droplet elements are marked decorative and hidden from assistive tech", kind: deterministic }
  - { id: aero.feel.optimism, rule: "the page feels bright and optimistic rather than sterile corporate blue", kind: judged }
---

# Frutiger Aero

## The look in one paragraph

Windows Vista wallpaper as an interface: glossy translucent panels with a bright highlight
across the top half, bubbles and water droplets, a sky-to-white background wash, green grass
and tropical blues, and a friendly humanist sans. Relentlessly optimistic and slightly damp.

## Layout

- Centred, 1120px, comfortable spacing. Content sits in glossy panels floating over a sky wash.
- Decorative elements — bubbles, droplets, leaves, a lens flare — drift near the edges without
  crowding the content.
- Rounded everything; no sharp corner exists anywhere on the page.

## Typography

- A humanist sans (Frutiger, Myriad, Segoe UI) at 400 and 600, sentence case, `1.2` heading
  line height.
- Headings are friendly rather than dramatic — modest sizes, no tight tracking.
- Body at 16px with `1.6` line height, usually in the deep ink blue rather than black.

## Colour

Sky blue to white, grass green, aqua and a warm sun yellow. Ink is a deep blue-teal, not black.
Everything is bright and high-key; there are no dark grounds in this style.

## Surface and depth

The gloss recipe: a light translucent fill, a two-stage gradient with a hard break at the
midpoint (the classic "aero" highlight), a 1px inset white top edge, and a soft blue-tinted
shadow below. Panels look like wet glass.

## Motion

Light and slightly bouncy: 280ms, panels lifting on hover, bubbles drifting upward slowly,
highlights sliding across glass. Ambient drift stops under reduced-motion.

## Imagery

Water droplets on glass, bubbles, blue skies with soft clouds, grass, tropical fish, leaves,
lens flares. Photographic and glossy, never matte or muted.

## Components

- **Buttons** — pills with the gloss gradient, inset highlight, soft blue shadow, sentence-case label.
- **Nav** — a glossy translucent bar with rounded ends floating over the sky wash.
- **Cards** — glass panels with a highlight and a rounded thumbnail.
- **Inputs** — rounded, white fill, inner top shadow, blue focus glow plus a real focus ring.
- **Decorative layer** — bubbles and droplets, `aria-hidden`, behind content.

## Do

- Put the hard highlight break at the midpoint of glossy surfaces.
- Keep the background a sky-to-white wash.
- Use nature imagery — water especially.
- Keep ink a deep blue rather than black.

## Don't

- Don't use dark or neutral-grey grounds.
- Don't flatten the gloss into a single soft gradient.
- Don't let decorative bubbles reach assistive technology.
- Don't set text over the brightest part of a highlight.

## How Weave verifies it

Deterministic checks read gradient stops for the hard midpoint break and the inset top highlight,
sample the palette for sky/white/green dominance, assert radii, inspect loaded imagery for
water/sky/foliage content, check the type stack and case, measure contrast over the rendered
glossy surfaces, and confirm decorative elements carry `aria-hidden`. The judged check asks
whether it feels optimistic rather than sterile.

Reference pictures: `demo-design/frutiger-aero/`.
