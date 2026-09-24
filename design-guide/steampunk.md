---
slug: steampunk
title: Steampunk
aliases: [victorian sci-fi, clockpunk, brass and gears]
status: ready
summary: Brass, leather and clockwork — riveted panels, engraved type, exposed mechanisms and paper aged by gaslight.
best_for: [games and fiction, escape rooms and events, craft distilleries, maker tools, collectible merch]
avoid_for: [modern SaaS, healthcare, minimal brands, anything needing speed cues]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: leather, value: "#2B1B12" }
      - { name: parchment, value: "#E8D9B5" }
      - { name: brass, value: "#B08D2F" }
      - { name: copper, value: "#A85C32" }
      - { name: iron, value: "#4A4643" }
      - { name: ink, value: "#1A120B" }
      - { name: verdigris, value: "#3E7A6B" }
    gradients:
      - { name: brass-plate, value: "linear-gradient(160deg, #E4C76A 0%, #B08D2F 40%, #6F5618 70%, #D8B75B 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Cinzel, IM Fell English, Playfair Display, serif", weights: [400, 700] }
      - { role: sans, family: "Inter, Lato, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.04
    heading_case: uppercase
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: centered
    density: comfortable
    max_width_px: 1160
    section_spacing_px: [56, 96, 140]
    ornament: corner brackets, rivets, gear motifs, engraved rules
  shape:
    radius_px: 6
    border_px: 3
    border_style: bevelled metal with rivet dots
    shadow: "inset 0 1px 0 rgba(232,217,181,0.25), 0 8px 20px rgba(0,0,0,0.5)"
  motion:
    duration_ms: 420
    easing: "cubic-bezier(0.45, 0.05, 0.25, 1)"
    properties: [transform, rotate, opacity]
    intensity: mechanical
  imagery:
    treatment: [sepia photography, technical engravings, aged paper, machinery close-ups]
    illustration: engraved line art, cutaway diagrams
    icons: engraved outline with brass fill
checks:
  - { id: steam.color.brass-leather, rule: "palette is dominated by brass, copper, leather and parchment tones", kind: deterministic }
  - { id: steam.texture.aged, rule: "a paper or metal texture overlays surfaces at 5-15% opacity", kind: deterministic }
  - { id: steam.ornament.rivets, rule: "panels carry rivet, bracket or gear ornament rather than plain borders", kind: deterministic }
  - { id: steam.type.serif-caps, rule: "headings use the serif display face, uppercase, tracking >= 0.03em", kind: deterministic }
  - { id: steam.image.engraving, rule: "imagery is sepia, engraved or duotone; no modern flat illustration", kind: deterministic }
  - { id: steam.a11y.contrast-on-texture, rule: "parchment and brass text pairs meet 4.5:1 with texture applied", kind: deterministic }
  - { id: steam.motion.mechanical, rule: "decorative gears rotate linearly and stop under prefers-reduced-motion", kind: deterministic }
  - { id: steam.feel.built, rule: "surfaces read as fabricated metal and paper rather than brown gradients", kind: judged }
---

# Steampunk

## The look in one paragraph

An 1889 machine that somehow runs a website. Leather and iron grounds, brass plates with
rivets at the corners, parchment panels for reading, engraved serif capitals, gear motifs
turning slowly behind the content, and everything aged with texture. Ornate, heavy, and
unapologetically decorative.

## Layout

- Centred, 1160px, comfortable spacing, with content sitting on parchment panels mounted onto
  darker metal.
- Corners get ornament: brackets, rivets, small gear clusters. Nothing has a bare edge.
- Symmetry is common — this style descends from Victorian print, not modernism.

## Typography

- An engraved serif for headings, uppercase, with `0.04em` tracking.
- A plain sans for body copy on parchment, 17px at `1.65` — readability is the one modern
  concession.
- Small caps and decorative initial capitals suit section openings.

## Colour

Dark leather and iron grounds, parchment for reading surfaces, brass and copper for metal and
type, verdigris as the cool accent. Brass uses a banded gradient so it reads as a plate rather
than flat yellow.

## Surface and depth

Physical: 3px bevelled metal borders with rivet dots, inset top highlights, deep shadows
beneath panels. Parchment panels sit on top of metal frames, so the page reads as layers of
material.

## Motion

Mechanical: 420ms, gears rotating at constant speed, panels sliding on rails, dials sweeping.
Rotation is linear (machines don't ease), and all ambient movement stops under reduced-motion.

## Imagery

Sepia photography, technical engravings and cutaway diagrams, machinery close-ups, aged maps.
Modern flat illustration breaks the spell instantly.

## Components

- **Panels** — brass frame with rivets, parchment interior, engraved heading rule.
- **Buttons** — brass plates with bevel, rivet corners, engraved uppercase label, pressed state
  that darkens the bevel.
- **Nav** — an iron bar with brass lettering and a gear separator between links.
- **Inputs** — inset parchment fields with a copper focus glow plus a real focus ring.
- **Dials/gauges** — for numbers and progress: circular, engraved scale, brass needle.

## Do

- Mount reading content on parchment, not directly on metal.
- Use a banded brass gradient for metal surfaces.
- Add rivets and brackets at panel corners.
- Keep gear rotation linear and stoppable.

## Don't

- Don't use flat modern illustration or neon colour.
- Don't let texture push text under the contrast floor.
- Don't animate gears with easing curves.
- Don't ornament interactive targets so heavily that the label is hard to read.

## How Weave verifies it

Deterministic checks sample the palette for brass/leather dominance, detect texture overlays and
their opacity, look for rivet and bracket ornament on panel corners, read heading font class,
case and tracking, inspect imagery for sepia or engraved characteristics, measure contrast with
texture applied, and confirm gear animation is linear and reduced-motion aware. The judged check
asks whether the surfaces read as fabricated material.

Reference pictures: `demo-design/steampunk/`.
