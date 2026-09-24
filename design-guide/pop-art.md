---
slug: pop-art
title: Pop Art
aliases: [lichtenstein style, warhol style, comic pop]
status: ready
summary: Comic-book loudness — Ben-Day dots, thick black outlines, primary colour blocks and speech bubbles shouting at you.
best_for: [youth brands, music and merch, campaigns, food and drink, exhibitions, playful ecommerce]
avoid_for: [enterprise, finance, luxury, anything subtle]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#FFF8E7" }
      - { name: ink, value: "#0D0D0D" }
      - { name: pop-red, value: "#ED1C24" }
      - { name: pop-blue, value: "#0057B8" }
      - { name: pop-yellow, value: "#FFD400" }
      - { name: pop-pink, value: "#FF5DA2" }
      - { name: halftone, value: "#FF9BB0" }
  typography:
    scale: display
    families:
      - { role: display, family: "Bangers, Anton, Impact, sans-serif", weights: [400, 700] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 700] }
    heading_tracking_em: 0.01
    heading_case: uppercase
    heading_line_height: 0.95
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1280
    section_spacing_px: [32, 64, 96]
    structure: comic panels with gutters
  shape:
    radius_px: 0
    border_px: 4
    shadow: "6px 6px 0 #0D0D0D"
  motion:
    duration_ms: 140
    easing: "steps(2, end)"
    properties: [transform, background-position]
    intensity: punchy
  imagery:
    treatment: [halftone dots, hard black outlines, high-contrast portraits, colour separations]
    illustration: comic panels, speech bubbles, action bursts
    icons: bold outlined with dot fills
checks:
  - { id: pop.texture.bendayd, rule: "a Ben-Day dot or halftone pattern fill appears on at least one surface", kind: deterministic }
  - { id: pop.shape.outline, rule: "panels and controls carry a 3px or thicker ink outline", kind: deterministic }
  - { id: pop.color.primaries, rule: "fills use the pop primary palette, flat and unblended", kind: deterministic }
  - { id: pop.type.uppercase-comic, rule: "headings are uppercase in the comic display face", kind: deterministic }
  - { id: pop.layout.panels, rule: "content is arranged in comic-style panels with consistent gutters", kind: deterministic }
  - { id: pop.shadow.hard, rule: "shadows are hard ink offsets with zero blur", kind: deterministic }
  - { id: pop.a11y.bubble-text, rule: "speech-bubble text is real text with 4.5:1 contrast, not baked into images", kind: deterministic }
  - { id: pop.feel.comic, rule: "the page reads as a comic spread rather than flat cards in bright colours", kind: judged }
---

# Pop Art

## The look in one paragraph

A comic page blown up to screen size: thick black outlines around everything, flat primary
fills, Ben-Day dot patterns filling shapes, speech bubbles and action bursts carrying the
headlines, and type shouting in uppercase. Loud, graphic, and completely unsubtle.

## Layout

- Comic panels: a 12-column grid divided into panels with consistent ink gutters between them.
- Panels vary in size across a row, like a comic page, and one "splash panel" dominates the hero.
- Speech bubbles and bursts overlap panel borders, which is what stops it feeling like a card grid.

## Typography

- A comic display face (Bangers, or Anton for a harder edge), uppercase, `0.95` line height.
- Body copy in a plain sans, often set inside a white bubble or panel for contrast.
- Onomatopoeia — POW, ZAP — is legitimate decoration, used as an image with a text alternative.

## Colour

Warm paper ground, ink outlines, and flat primary red/blue/yellow plus pop pink. Halftone dots
use a lighter tint of the fill colour. No gradients, no blending.

## Surface and depth

Flat fills with heavy ink outlines and a hard 6px ink offset shadow. Depth is comic layering:
bubbles above panels, bursts above bubbles.

## Motion

Punchy and stepped: 140ms with `steps()`, elements popping in at a slightly larger scale, dot
patterns shifting on hover. Nothing eases smoothly.

## Imagery

High-contrast portraits posterised into two or three flat colours, halftone dot overlays,
colour-separation offsets. Every image gets an ink outline.

## Components

- **Panel** — ink border, flat fill or dot pattern, hard shadow.
- **Speech bubble** — rounded bubble with a tail, white fill, ink outline, real text inside.
- **Buttons** — thick outline, flat primary fill, hard shadow, uppercase label, press effect.
- **Burst badge** — starburst shape for prices and offers.
- **Nav** — an ink bar with uppercase links and a yellow active fill.

## Do

- Outline everything in ink.
- Use dot patterns as a fill, not as background noise.
- Let bubbles and bursts break panel borders.
- Keep fills flat and primary.

## Don't

- Don't bake headline text into images without an alternative.
- Don't use gradients or soft shadows.
- Don't set long paragraphs inside bubbles.
- Don't let the dot pattern sit directly behind body text.

## How Weave verifies it

Deterministic checks look for repeating dot/halftone background patterns, read border widths and
shadow blur, sample fills against the pop palette, check heading case and family, measure panel
gutters for consistency, and confirm bubble text is real DOM text meeting contrast. The judged
check asks whether the page reads as a comic spread.

Reference pictures: `demo-design/pop-art/`.
