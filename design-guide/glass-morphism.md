---
slug: glass-morphism
title: Glassmorphism
aliases: [glassmorphism, frosted glass, acrylic, vision-os style]
status: ready
summary: Frosted translucent panels floating over a vivid blurred backdrop, held together by hairline light borders.
best_for: [dashboards, fintech and crypto products, music and media apps, device or OS-adjacent marketing]
avoid_for: [text-heavy reading, documentation, low-end device audiences, anything needing printed-page calm]
inherits: _base.md
tokens:
  colors:
    mode: both
    palette:
      - { name: backdrop-a, value: "#3B1E7E" }
      - { name: backdrop-b, value: "#0E7C86" }
      - { name: backdrop-c, value: "#F25C9A" }
      - { name: base, value: "#0B0F1A" }
      - { name: foreground, value: "#F7F8FC" }
      - { name: muted, value: "#C3C8D8" }
      - { name: accent, value: "#5B8DEF" }
    surfaces:
      - { name: glass-dark, value: "rgba(255, 255, 255, 0.10)" }
      - { name: glass-light, value: "rgba(255, 255, 255, 0.62)" }
      - { name: glass-border, value: "rgba(255, 255, 255, 0.24)" }
      - { name: scrim, value: "rgba(8, 12, 24, 0.38)" }
    gradients:
      - { name: backdrop-mesh, value: "radial-gradient(60% 60% at 20% 20%, #3B1E7E 0%, transparent 60%), radial-gradient(50% 50% at 80% 30%, #0E7C86 0%, transparent 60%), radial-gradient(60% 60% at 60% 90%, #F25C9A 0%, transparent 60%)" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, SF Pro Display, Satoshi, system-ui", weights: [400, 500, 600] }
    heading_tracking_em: -0.01
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: centered
    density: spacious
    max_width_px: 1200
    card_padding_px: 28
    section_spacing_px: [56, 96, 128]
  shape:
    radius_px: 20
    border_px: 1
    shadow: "0 8px 32px rgba(8, 12, 24, 0.28)"
    blur_px: 16
    saturate: 1.4
  motion:
    duration_ms: 220
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform]
    intensity: subtle
  imagery:
    treatment: [vivid blurred gradients, soft mesh, out-of-focus photography]
    illustration: soft 3d, translucent shapes
    icons: rounded line, 1.5px
checks:
  - { id: glass.surface.backdrop-filter, rule: "glass surfaces use backdrop-filter blur between 8px and 24px", kind: deterministic }
  - { id: glass.surface.fallback, rule: "an @supports fallback gives an opaque background where backdrop-filter is unsupported", kind: deterministic }
  - { id: glass.surface.border, rule: "every glass surface has a 1px translucent light border", kind: deterministic }
  - { id: glass.surface.layers-max, rule: "no more than 2 glass layers stacked on top of each other", kind: deterministic }
  - { id: glass.a11y.contrast-over-backdrop, rule: "text on glass meets 4.5:1 against the rendered backdrop at its worst point", kind: deterministic }
  - { id: glass.a11y.reduced-transparency, rule: "under prefers-reduced-transparency, surfaces become opaque", kind: deterministic }
  - { id: glass.perf.blur-budget, rule: "at most 6 blurred surfaces are painted in the initial viewport", kind: deterministic }
  - { id: glass.shape.radius-consistent, rule: "all card radii come from the same token, 16-24px", kind: deterministic }
  - { id: glass.feel.depth, rule: "panels read as floating glass over a scene, not as flat translucent rectangles", kind: judged }
---

# Glassmorphism

## The look in one paragraph

A vivid, blurred scene sits behind everything, and the interface floats above it as panes of
frosted glass: translucent fill, hairline light border catching the edge, soft shadow below.
Depth comes from blur and light rather than from heavy shadows. It lives or dies on one
detail — text on glass has to stay readable no matter what drifts behind it.

## Layout

- Centred, spacious, up to 1200px. Cards are generous: 28px padding, 20px radius.
- The backdrop is a real composition, not a flat colour: two or three coloured blobs on a
  dark base, heavily blurred, occasionally drifting.
- Keep glass panels apart from each other. Two panes overlapping is an accent; three is soup.
- Content on glass gets more padding than it would on solid, because the edge is soft.

## Typography

- One modern sans, weights 400/500/600. No serif, no display face.
- Headings sit at `-0.01em` tracking; body at 16px, `1.55` line height.
- Text on glass is near-white on dark mode, near-black on light. If a passage needs more than
  a weight bump to stay legible, put a scrim behind it instead of thickening the type.

## Colour

Three saturated backdrop hues over a near-black base, one accent for interactive elements,
and white-alpha for the glass itself. The glass has no hue of its own — its colour is whatever
shows through, which is why the backdrop has to be good.

## Surface and depth

The recipe for a pane:

```css
background: rgba(255, 255, 255, 0.10);      /* 0.62 in light mode */
backdrop-filter: blur(16px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.24);
border-radius: 20px;
box-shadow: 0 8px 32px rgba(8, 12, 24, 0.28);
```

Always pair it with a fallback:

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgba(16, 20, 34, 0.92); }
}
```

A brighter 1px inner top edge sells the glass. Blur stays between 8px and 24px: below 8 it
looks like plain transparency, above 24 it costs real frames on mid-range phones.

## Motion

Subtle, 220ms, ease-out. The backdrop may drift slowly; the glass itself stays still, or
lifts a couple of pixels on hover. Never animate `backdrop-filter` — it repaints the blur
every frame. Under `prefers-reduced-motion`, the backdrop stops entirely.

## Imagery

Blurred vivid gradients, soft mesh, out-of-focus photography. Anything sharp behind glass
turns into visual noise under text. Product screenshots sit **on** the glass, not behind it.

## Components

- **Cards** — the pane recipe above; headers use weight, not a divider line.
- **Nav** — a floating glass bar with more blur (20px) and slightly higher opacity than cards,
  so it stays readable while content scrolls behind it.
- **Buttons** — primary is solid accent, not glass, so the main action isn't translucent.
  Secondary is glass with a light border.
- **Inputs** — darker translucent fill than the card they sit on, 1px border, accent focus ring.
- **Modals** — one glass layer over a dimmed scrim; the page behind gets extra blur.

## Do

- Put a scrim under long text before weakening the frost.
- Keep the primary action opaque.
- Vary blur by layer: nav > modal > card, so the stack reads as depth.
- Test over the busiest part of the backdrop, not the calm part.

## Don't

- Don't stack three glass layers.
- Don't ship without the `@supports` fallback.
- Don't put small or light-weight text on glass over a moving backdrop.
- Don't animate the blur.

## How Weave verifies it

Deterministic checks parse the built CSS for `backdrop-filter` values, the `@supports`
fallback, border and radius tokens, and count blurred surfaces painted in the first viewport.
The contrast check is the important one: it screenshots the page, samples the real pixels
behind each text run, and takes the worst case rather than assuming a flat background.
Reduced transparency and reduced motion are verified by re-rendering with those media features
forced. `glass.feel.depth` is judged from a screenshot. `_base.md` applies on top.

Reference pictures: `demo-design/glass-morphism/`.
