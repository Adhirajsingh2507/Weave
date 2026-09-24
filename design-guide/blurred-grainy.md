---
slug: blurred-grainy
title: Blurred + Grainy
aliases: [grain and blur, soft noise, analogue haze]
status: ready
summary: A combination layer — heavy blur under coarse grain, turning any palette into soft analogue haze. Applies over a base style.
best_for: [music and fashion, moody landing pages, photography portfolios, atmospheric hero sections]
avoid_for: [data tools, documentation, anything where crisp edges carry meaning]
inherits: _base.md
combination: true
tokens:
  colors:
    mode: dark
    palette:
      - { name: haze-base, value: "#12121A" }
      - { name: bloom-a, value: "#6A5ACD" }
      - { name: bloom-b, value: "#C05A78" }
      - { name: bloom-c, value: "#2E8B87" }
      - { name: foreground, value: "#F1EFF5" }
      - { name: muted, value: "#A8A4B4" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Neue Montreal, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.02
    heading_line_height: 1.12
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: spacious
    max_width_px: 1120
    section_spacing_px: [72, 120, 168]
  shape:
    radius_px: 16
    border_px: 1
    shadow: none
  motion:
    duration_ms: 700
    easing: "cubic-bezier(0.37, 0, 0.35, 1)"
    properties: [opacity, transform]
    intensity: drifting
  imagery:
    treatment: [out-of-focus photography, blurred colour fields, heavy film grain, halation]
    illustration: soft blurred shapes
    icons: simple, crisp — the one sharp element
  combination:
    applies_over: any base style
    layers: ["blur base imagery or colour fields", "overlay grain at 8-18% opacity", "keep text and controls perfectly sharp"]
checks:
  - { id: grain.layer.noise, rule: "a grain or noise overlay is present at 8-18% opacity across the page", kind: deterministic }
  - { id: grain.blur.background, rule: "background imagery or colour fields carry a blur of 20px or more", kind: deterministic }
  - { id: grain.text.sharp, rule: "no blur or grain filter is applied to text, controls or icons", kind: deterministic }
  - { id: grain.a11y.contrast-with-grain, rule: "contrast is measured with the grain overlay applied and still meets 4.5:1", kind: deterministic }
  - { id: grain.perf.static-noise, rule: "grain is a static tiled asset or SVG filter, not regenerated per frame", kind: deterministic }
  - { id: grain.motion.stillness, rule: "if grain animates, it stops under prefers-reduced-motion and never flickers above 3Hz", kind: deterministic }
  - { id: grain.base.preserved, rule: "the underlying style's palette, type and layout rules still hold beneath the treatment", kind: deterministic }
  - { id: grain.feel.analogue, rule: "the result reads as analogue film haze rather than a low-quality blurred render", kind: judged }
---

# Blurred + Grainy

## The look in one paragraph

This is a treatment, not a style of its own: take any base style, blur its background imagery
and colour fields heavily, then lay coarse film grain over the whole page. The result is soft,
atmospheric and slightly nostalgic — and the one rule that keeps it usable is that text and
controls stay perfectly sharp on top.

## How to combine it

1. Pick a base style and keep its palette, type and layout rules.
2. Replace crisp background imagery with out-of-focus versions, or blur colour fields by 20px+.
3. Overlay grain at 8–18% opacity across the entire page, including over imagery.
4. Leave every text node, icon and control unfiltered.
5. Re-measure contrast with the grain applied — it typically costs 5–10% and can push
   borderline pairs under the floor.

## Layout

- Spacious, centred, with large soft background fields behind content.
- Content sits on subtly bordered panels so the sharp layer reads as separate from the haze.

## Typography

- Unchanged from the base style, but avoid thin weights — grain eats fine strokes.
- Minimum body size 17px for the same reason.

## Colour

Blurred colour blooms carry the palette; the sharp layer stays neutral. Because blur averages
colour, the visible palette tends to shift toward the mean — compensate by making blooms more
saturated than the target.

## Surface and depth

Depth is atmospheric: the blurred field recedes, the grain unifies, the sharp layer advances.
Borders stay hairline; shadows are unnecessary since the haze already separates layers.

## Motion

Drifting: 700ms, blurred fields moving slowly. Grain should ideally be static — animated grain
is expensive and can flicker.

## Imagery

Out-of-focus photography, blurred gradients, halation around light sources. The blur should
look optical, with bright areas blooming, rather than like a uniform Gaussian smear.

## Do

- Keep text and controls sharp.
- Use a static grain asset.
- Re-check contrast after applying grain.
- Over-saturate blooms to survive blurring.

## Don't

- Don't blur text, icons or focus rings.
- Don't regenerate noise per frame.
- Don't animate grain fast enough to flicker.
- Don't lose the base style's rules under the treatment.

## How Weave verifies it

Deterministic checks detect the grain overlay and measure its opacity, read blur filter values on
background layers, confirm no filter applies to text or interactive elements, re-measure contrast
on the rendered page with grain present, inspect how grain is produced, and check animation
frequency. One check confirms the base style's own rules still pass. The judged check asks
whether it reads as analogue film.

Reference pictures: `demo-design/blurred-grainy/`.
