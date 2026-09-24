---
slug: cyberpunk
title: Cyberpunk
aliases: [neon noir, high tech low life]
status: ready
summary: Rain-slick night city in a browser — neon magenta and cyan over black, glitching signage, dense HUD panels and dirty gradients.
best_for: [games, music, streetwear, hackathons, crypto and security products with attitude]
avoid_for: [healthcare, finance, government, anything needing calm authority]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: night, value: "#07050D" }
      - { name: panel, value: "#12101F" }
      - { name: foreground, value: "#EDE9FF" }
      - { name: muted, value: "#8C86A8" }
      - { name: neon-magenta, value: "#FF2E97" }
      - { name: neon-cyan, value: "#22E8FF" }
      - { name: acid-yellow, value: "#F5FF3D" }
      - { name: blood, value: "#B4123C" }
    gradients:
      - { name: skyline, value: "linear-gradient(160deg, #12101F 0%, #2A0B3A 55%, #07050D 100%)" }
      - { name: neon-edge, value: "linear-gradient(90deg, #FF2E97 0%, #22E8FF 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Chakra Petch, Rajdhani, Eurostile, sans-serif", weights: [600, 700] }
      - { role: mono, family: "JetBrains Mono, ui-monospace, monospace", weights: [400, 700] }
    heading_tracking_em: 0.04
    heading_case: uppercase
    heading_line_height: 1.0
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1400
    section_spacing_px: [32, 64, 96]
    overlay: scanlines, noise, HUD brackets and corner cuts
  shape:
    radius_px: 0
    clip: "polygon corner cuts of 12px"
    border_px: 1
    shadow: "0 0 18px rgba(255,46,151,0.45)"
  motion:
    duration_ms: 180
    easing: "steps(3, end)"
    properties: [transform, opacity, filter, clip-path]
    intensity: glitchy
  imagery:
    treatment: [night photography, rain and reflections, neon signage, chromatic aberration]
    illustration: hard-edged tech, wire diagrams
    icons: angular, cut corners, mono-weight
checks:
  - { id: cp.color.neon-pair, rule: "at least two neon accents from the palette are used together", kind: deterministic }
  - { id: cp.color.dark-ground, rule: "background luminance below 10%", kind: deterministic }
  - { id: cp.shape.corner-cuts, rule: "panels use angular clip-path corner cuts rather than rounded corners", kind: deterministic }
  - { id: cp.effect.glow, rule: "neon elements carry a coloured glow shadow of 12px or more", kind: deterministic }
  - { id: cp.effect.overlay, rule: "a scanline or noise overlay is present under 12% opacity", kind: deterministic }
  - { id: cp.type.uppercase-tech, rule: "headings are uppercase in the display face with tracking >= 0.03em", kind: deterministic }
  - { id: cp.a11y.neon-contrast, rule: "neon text on dark still meets 4.5:1; glow is not counted as contrast", kind: deterministic }
  - { id: cp.motion.glitch-stoppable, rule: "glitch, flicker and scanline motion stop under prefers-reduced-motion", kind: deterministic }
  - { id: cp.feel.grime, rule: "the page feels dense and lived-in, not like a clean dark theme with neon text", kind: judged }
---

# Cyberpunk

## The look in one paragraph

Night, rain and advertising. Near-black ground with a bruised purple gradient, magenta and cyan
signage glowing off panel edges, HUD brackets framing content, scanlines and noise over
everything, and uppercase technical type that occasionally glitches. Dense, grimy, and
deliberately overloaded — but the reading path still works.

## Layout

- Wide and compact: 1400px, tight 32–96px spacing, panels packed with labels, codes and
  readouts.
- Panels have cut corners (12px polygon clips) rather than rounded ones, with HUD brackets at
  the corners.
- Elements overlap and layer: a glowing sign crossing a panel edge, a vertical mono string
  running down a margin.

## Typography

- An angular technical display face, uppercase, wide-tracked, for headings and signage.
- Mono for everything functional: labels, codes, timestamps, numbers. There is a lot of it.
- Body copy stays 16px and readable on a solid panel, not on top of noise.

## Colour

Near-black night, bruised purple gradients, and neon magenta/cyan as the light sources. Acid
yellow for warnings, blood red for danger. Neon is used as light: glowing edges, thin lines,
text with a matching halo — never as a large flat fill.

## Surface and depth

Panels are dark fills with 1px neon-tinted borders and corner cuts. Depth comes from glow and
layering. Scanlines and noise sit over the whole page at low opacity.

## Motion

Glitchy and fast: 180ms stepped transitions, occasional RGB-split on hover, flickering signage,
text that briefly scrambles before settling. Every flicker, scramble and scanline must stop
completely under `prefers-reduced-motion`.

## Imagery

Wet night streets, reflections, neon signage, chromatic aberration, dense cityscapes. Cut-outs
of hardware and figures with hard edges and neon rim light.

## Components

- **Buttons** — cut-corner rectangles, neon border, glow on hover, uppercase mono label, often
  with a bracket prefix.
- **Nav** — a dark bar with bracketed uppercase links and a glowing active indicator.
- **Panels** — cut corners, hairline neon border, mono header strip with a code or ID.
- **Inputs** — dark fill, neon focus glow plus a solid focus ring that satisfies the base rules.
- **Readouts** — mono numerals with unit labels and a thin animated bar.

## Do

- Use two neons together — the magenta/cyan pair is the signature.
- Put long text on a solid panel above the noise layer.
- Keep glows coloured and tight rather than broad bloom.
- Fill margins with mono detail; density is the point.

## Don't

- Don't count glow as contrast — measure the text itself.
- Don't round corners.
- Don't leave glitch motion unstoppable.
- Don't use neon as a large flat background fill.

## How Weave verifies it

Deterministic checks sample background luminance and painted accent hues, look for `clip-path`
corner cuts versus radii, read shadow blur and colour to confirm glows, detect the scanline or
noise overlay opacity, check heading case and tracking, and measure neon-on-dark contrast with
glow excluded. Motion is verified by rendering under forced reduced-motion and diffing frames.
The judged check asks whether the result feels lived-in or just like a dark theme with neon text.

Reference pictures: `demo-design/cyberpunk/`.
