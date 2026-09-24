---
slug: kinetic-typography
title: Kinetic Typography
aliases: [motion type, animated lettering, type-in-motion]
status: ready
summary: The type is the interface — oversized words that scroll, stretch, mask and reveal, with almost nothing else on screen.
best_for: [agency and studio sites, campaign microsites, music and film, product manifestos]
avoid_for: [documentation, dashboards, ecommerce, low-powered devices]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: base, value: "#0B0B0B" }
      - { name: foreground, value: "#FAFAFA" }
      - { name: muted, value: "#8A8A8A" }
      - { name: accent, value: "#FF4A1C" }
      - { name: surface, value: "#151515" }
  typography:
    scale: display
    families:
      - { role: display, family: "Monument Extended, Druk, Archivo Expanded, sans-serif", weights: [700, 800] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.04
    heading_line_height: 0.85
    display_size_vw: 12
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: spacious
    max_width_px: 1600
    section_spacing_px: [100vh, 120, 180]
    structure: full-viewport type stages separated by calm reading blocks
  shape:
    radius_px: 0
    border_px: 0
    shadow: none
  motion:
    duration_ms: 800
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    properties: [transform, clip-path, opacity, font-variation-settings]
    intensity: choreographed
  imagery:
    treatment: [type as image, masked video inside letterforms, minimal photography]
    illustration: none
    icons: none or a single arrow glyph
checks:
  - { id: kin.type.dominant, rule: "display type occupies at least 40% of the hero viewport", kind: deterministic }
  - { id: kin.motion.scroll-linked, rule: "type animation is tied to scroll progress or a timeline, not random loops", kind: deterministic }
  - { id: kin.motion.reduced, rule: "under prefers-reduced-motion all type animation resolves to its final state immediately", kind: deterministic }
  - { id: kin.a11y.real-text, rule: "animated words are real text in the DOM, readable with CSS disabled", kind: deterministic }
  - { id: kin.a11y.no-trap, rule: "scroll is never hijacked or blocked; keyboard scrolling reaches every section", kind: deterministic }
  - { id: kin.perf.transform-only, rule: "animations use transform, opacity or clip-path only; no layout-triggering properties", kind: deterministic }
  - { id: kin.content.reading-blocks, rule: "each kinetic stage is followed by a static readable block explaining it", kind: deterministic }
  - { id: kin.feel.choreography, rule: "the motion reads as one choreographed sequence rather than assorted effects", kind: judged }
---

# Kinetic Typography

## The look in one paragraph

Words at the scale of the screen, moving with the scroll: lines sliding past each other,
letters masked by a shape, a single word stretched from condensed to expanded as you move.
Almost no imagery and no decoration — the typography carries meaning and motion at once, with
quiet readable blocks between the stages.

## Layout

- Full-viewport "stages": each holds one line or one word, and scroll advances the sequence.
- Between stages, calm blocks of normal-size text explain what the big words are about.
- Wide canvas (1600px), heavy horizontal bleed — words may run past the viewport edge.

## Typography

- One expressive display face, ideally variable so weight and width can animate. Set enormous:
  10–14vw, `0.85` line height, `-0.04em`.
- A plain sans for reading blocks at 17px.
- Type is real text in the DOM — never an image or a canvas — so it remains selectable and
  readable with styles off.

## Colour

Near-black ground, near-white type, one hot accent used on a single word or an underline per
stage. Colour is minimal so the motion reads clearly.

## Surface and depth

None. No panels, borders or shadows. Depth is created by type scale and overlap alone.

## Motion

Choreographed and scroll-linked: 800ms segments tied to scroll progress, words entering by
`clip-path` reveal, lines counter-scrolling, variable-font axes animating between stages. The
sequence should feel authored, with one idea per stage. Under reduced-motion, every stage
renders in its final state immediately and the page becomes a normal scrolling document.

## Imagery

Type is the image. Where photography or video appears, it is masked inside letterforms rather
than placed beside them.

## Components

- **Stage** — one full-viewport type composition with a scroll-linked animation.
- **Reading block** — a normal centred column of 17px text following each stage.
- **Marquee** — a horizontally scrolling line of words, pausable and reduced-motion aware.
- **Nav** — minimal, fixed, small; it must never be covered by moving type.
- **Buttons** — plain text with an animated underline, at standard sizes.

## Do

- Tie motion to scroll progress so it feels authored.
- Keep a static reading block after each stage.
- Animate only transform, opacity and clip-path.
- Keep the words as real, selectable text.

## Don't

- Don't hijack or block scrolling.
- Don't set body copy in the display face.
- Don't render type into canvas or images.
- Don't animate width, height, margin or font-size directly — they trigger layout.

## How Weave verifies it

Deterministic checks measure the display text's share of the hero viewport, inspect animation
drivers for scroll linkage, force reduced-motion and confirm final-state rendering, disable CSS
to verify the words are real text, test keyboard scrolling reaches the footer, scan animated
properties for layout-triggering values, and confirm each stage is followed by a static block.
The judged check asks whether the sequence reads as one choreography.

Reference pictures: `demo-design/kinetic-typography/`.
