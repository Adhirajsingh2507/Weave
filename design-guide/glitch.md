---
slug: glitch
title: Glitch
aliases: [databending, corruption aesthetic, RGB split]
status: ready
summary: Signal failure as decoration — RGB channel splits, torn scanlines, displaced blocks and type that won't hold still.
best_for: [music and album sites, streetwear, art projects, security and hacking themes, event teasers]
avoid_for: [anything requiring trust, medical, finance, accessibility-sensitive audiences]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: black, value: "#050505" }
      - { name: foreground, value: "#F2F2F2" }
      - { name: channel-red, value: "#FF003C" }
      - { name: channel-cyan, value: "#00F0FF" }
      - { name: muted, value: "#7A7A7A" }
      - { name: alert, value: "#FFE600" }
  typography:
    scale: display
    families:
      - { role: display, family: "Helvetica Neue, Archivo, Arial, sans-serif", weights: [700, 900] }
      - { role: mono, family: "ui-monospace, SFMono-Regular, monospace", weights: [400] }
    heading_tracking_em: -0.02
    heading_case: uppercase
    heading_line_height: 0.95
    body_size_px: 16
    body_line_height: 1.5
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1400
    section_spacing_px: [24, 56, 88]
    overlay: horizontal tear lines, block displacement, noise
  shape:
    radius_px: 0
    border_px: 1
    shadow: "3px 0 0 #FF003C, -3px 0 0 #00F0FF"
  motion:
    duration_ms: 120
    easing: "steps(2, end)"
    properties: [transform, clip-path, filter, opacity]
    intensity: erratic
  imagery:
    treatment: [databent photos, channel-split portraits, torn scan strips, static frames]
    illustration: corrupted vector shapes
    icons: mono, occasionally displaced
checks:
  - { id: glitch.effect.rgb-split, rule: "at least one element uses offset red/cyan channel shadows or filters", kind: deterministic }
  - { id: glitch.effect.tear, rule: "a clip-path or transform tear effect displaces part of an element", kind: deterministic }
  - { id: glitch.effect.noise, rule: "a static or noise overlay is present under 12% opacity", kind: deterministic }
  - { id: glitch.a11y.stable-text, rule: "body copy and form labels never animate or split; only display elements glitch", kind: deterministic }
  - { id: glitch.a11y.reduced-motion, rule: "all glitch animation stops completely under prefers-reduced-motion", kind: deterministic }
  - { id: glitch.a11y.no-flash, rule: "nothing flashes more than 3 times per second", kind: deterministic }
  - { id: glitch.shape.hard, rule: "no rounded corners or soft shadows", kind: deterministic }
  - { id: glitch.feel.intent, rule: "the corruption reads as designed, not as a rendering bug", kind: judged }
---

# Glitch

## The look in one paragraph

Black ground, hard white type, and the constant suggestion that the signal is failing: red and
cyan channels pulling apart, horizontal tears displacing strips of an image, blocks jumping a
few pixels, static crawling over everything. The discipline is knowing which elements are
allowed to break — display elements glitch, functional elements never do.

## Layout

- Wide, dense, asymmetric, with tight 24–88px spacing.
- Horizontal tear lines cut across sections, displacing the strip above or below.
- Blocks sit a few pixels out of alignment, as if the page were mid-refresh.

## Typography

- A heavy grotesque, uppercase, tight, with RGB-split shadows on the biggest words only.
- Mono for labels, error codes and captions — often deliberately styled like system output.
- Body copy is plain, stable and fully legible. It never splits or jitters.

## Colour

Black, white, and the two channel colours — red `#FF003C` and cyan `#00F0FF` — which appear
almost exclusively as offsets rather than fills. Yellow exists for alert moments.

## Surface and depth

No depth. The signature "shadow" is a pair of hard channel offsets (`3px 0` red, `-3px 0` cyan).
No blur, no radius, no elevation.

## Motion

Erratic and brief: 120ms stepped jumps, bursts of displacement every few seconds, text
scrambling once before settling. Three hard rules — nothing flashes more than three times per
second, nothing glitches while being read, and all of it stops under `prefers-reduced-motion`.

## Imagery

Databent photographs, channel-split portraits, strips of an image displaced horizontally,
frames of static. Keep one clean version of the key image available; corrupt copies, not
originals.

## Components

- **Buttons** — square, 1px border, channel-split on hover only, never while focused.
- **Nav** — mono uppercase links; the active item carries a static channel offset.
- **Cards** — plain bordered panels; only the heading inside may glitch.
- **Forms** — completely stable: no jitter, no split, no animation. Errors use the alert colour
  and plain text.
- **Loading states** — static bars and scrambling characters, capped at the flash limit.

## Do

- Glitch display type and imagery only.
- Keep one stable reading layer.
- Respect the three-flashes-per-second ceiling.
- Use channel offsets rather than coloured blurs.

## Don't

- Don't animate anything a user is trying to read or fill in.
- Don't rely on glitching to indicate state.
- Don't round or soften anything.
- Don't ship effects that ignore reduced-motion.

## How Weave verifies it

Deterministic checks look for channel-offset shadows or filters, detect tear/displacement
effects, measure noise overlay opacity, confirm that body and form elements carry no animation,
count flashes per second by sampling frames, and re-render under forced reduced-motion to
confirm full stillness. The judged check asks whether the corruption looks deliberate.

Reference pictures: `demo-design/glitch/`.
