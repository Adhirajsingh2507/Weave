---
slug: aurora
title: Aurora
aliases: [aurora gradient, mesh gradient, northern lights]
status: ready
summary: Soft coloured light bleeding across a dark ground — huge blurred gradient blooms, minimal type and almost no hard edges.
best_for: [AI and SaaS marketing, developer platforms, launch pages, music and ambient products]
avoid_for: [dense applications, data tables, print-like editorial]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: base, value: "#080A12" }
      - { name: surface, value: "#101322" }
      - { name: foreground, value: "#F1F3FA" }
      - { name: muted, value: "#9AA1B8" }
      - { name: bloom-violet, value: "#7C4DFF" }
      - { name: bloom-teal, value: "#22D3C5" }
      - { name: bloom-rose, value: "#FF5C8A" }
    gradients:
      - { name: aurora, value: "radial-gradient(45% 40% at 25% 20%, rgba(124,77,255,0.55) 0%, transparent 70%), radial-gradient(40% 35% at 75% 25%, rgba(34,211,197,0.45) 0%, transparent 70%), radial-gradient(50% 45% at 55% 85%, rgba(255,92,138,0.40) 0%, transparent 70%)" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Geist, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.025
    heading_line_height: 1.08
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: spacious
    max_width_px: 1180
    section_spacing_px: [80, 128, 176]
  shape:
    radius_px: 16
    border_px: 1
    shadow: "0 24px 80px rgba(8, 10, 18, 0.7)"
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.37, 0, 0.63, 1)"
    properties: [transform, opacity]
    intensity: drifting
  imagery:
    treatment: [abstract light, blurred colour fields, dark product screenshots]
    illustration: soft glow shapes
    icons: 1.5px line, low contrast
checks:
  - { id: aurora.bg.bloom, rule: "the background carries at least 2 large blurred colour blooms", kind: deterministic }
  - { id: aurora.bg.soft-edges, rule: "bloom gradients fade to transparent; no visible gradient banding or hard stops", kind: deterministic }
  - { id: aurora.color.dark-ground, rule: "base background luminance below 10%", kind: deterministic }
  - { id: aurora.a11y.contrast-over-bloom, rule: "text contrast is measured over the rendered bloom at its brightest point and meets 4.5:1", kind: deterministic }
  - { id: aurora.layout.calm, rule: "at least 50% of the first viewport is ground or bloom rather than content", kind: deterministic }
  - { id: aurora.motion.drift, rule: "bloom motion is 500ms or slower, loops seamlessly, and stops under prefers-reduced-motion", kind: deterministic }
  - { id: aurora.perf.no-jank, rule: "blooms are rendered as static gradients or GPU-composited layers, not per-frame blur", kind: deterministic }
  - { id: aurora.feel.light, rule: "the colour reads as emitted light behind the interface, not as painted shapes", kind: judged }
---

# Aurora

## The look in one paragraph

Coloured light pooling behind a dark interface: three or four enormous blurred blooms — violet,
teal, rose — drifting slowly beneath near-black, with restrained type and softly rounded
surfaces floating on top. The interface itself is quiet; the background does the mood.

## Layout

- Centred, spacious, 1180px, with large section spacing (80–176px).
- The hero is mostly empty ground with one headline and one action, letting the bloom breathe.
- Content sections sit on slightly raised dark surfaces so the blooms stay in the background.

## Typography

- One neutral sans at 400/500. Headings large, tight (`-0.025em`, `1.08`), never bold-heavy.
- Body 17px at `1.6`, in near-white or the muted grey.
- No uppercase display, no decorative faces — the background is the only flourish.

## Colour

Near-black base, two raised surface tones, and three bloom hues used only as blurred light.
Blooms fade fully to transparent; they never resolve into a visible shape or a banded edge.

## Surface and depth

Rounded 16px surfaces with a 1px low-contrast border and a large soft ambient shadow. The
hierarchy is: bloom (furthest), ground, surface, content.

## Motion

Drifting: 600ms or longer, blooms translating and scaling slightly on a seamless loop. Content
fades up once. Everything ambient stops under reduced-motion.

## Imagery

Abstract light, blurred colour fields, and dark-background product screenshots with soft edges.
Nothing high-contrast or hard-edged competes with the blooms.

## Components

- **Buttons** — 16px radius; primary is a light fill on dark, secondary is a hairline outline.
- **Nav** — translucent dark bar, blurred backdrop, hairline underneath.
- **Cards** — raised dark surface, hairline border, soft shadow; blooms show through the gaps.
- **Inputs** — dark fill, hairline border, soft accent focus ring.

## Do

- Keep blooms enormous, soft and few.
- Let the hero be mostly empty.
- Measure contrast at the brightest part of the bloom.
- Render blooms as static gradients where possible.

## Don't

- Don't let a bloom read as a defined shape.
- Don't animate blur filters per frame.
- Don't stack bright blooms directly behind body text.
- Don't add a second decorative device; the light is the design.

## How Weave verifies it

Deterministic checks inspect background gradient declarations for bloom count and transparent
fade-out, sample ground luminance, screenshot the page to find the brightest pixels behind each
text run and measure contrast there, compute the content-to-ground ratio in the first viewport,
read animation durations and loop behaviour, and check for animated filter properties that would
cost frames. The judged check asks whether the colour reads as light rather than paint.

Reference pictures: `demo-design/aurora/`.
