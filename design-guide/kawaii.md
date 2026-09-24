---
slug: kawaii
title: Kawaii
aliases: [soft pastel, cute aesthetic, sanrio style]
status: ready
summary: Deliberate cuteness — soft pastels, rounded everything, tiny faces on objects and a page that wants to be liked.
best_for: [youth and community apps, games, stationery and merch, food and drink, K-pop and fandom]
avoid_for: [enterprise, finance, security products, anything needing gravitas]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cloud, value: "#FFF7FB" }
      - { name: bubblegum, value: "#FFB3D1" }
      - { name: sky, value: "#AEDBFF" }
      - { name: mint, value: "#B7F0D8" }
      - { name: lemon, value: "#FFF0A8" }
      - { name: lilac, value: "#D9C2FF" }
      - { name: ink, value: "#4A3A44" }
  typography:
    scale: large
    families:
      - { role: display, family: "Baloo 2, Quicksand, Nunito, sans-serif", weights: [600, 800] }
      - { role: sans, family: "Nunito, Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: centered
    density: comfortable
    max_width_px: 1100
    section_spacing_px: [56, 96, 136]
    motifs: stars, hearts, clouds, sparkles, tiny mascot characters
  shape:
    radius_px: 28
    pill_radius_px: 999
    border_px: 3
    shadow: "0 8px 0 rgba(74, 58, 68, 0.12)"
  motion:
    duration_ms: 300
    easing: "cubic-bezier(0.34, 1.5, 0.64, 1)"
    properties: [transform, rotate]
    intensity: bouncy
  imagery:
    treatment: [pastel photography, soft focus, plush and stationery, sparkle overlays]
    illustration: rounded mascots with simple faces, sparkles and hearts
    icons: rounded filled with a face or sparkle accent
checks:
  - { id: kawaii.shape.rounded, rule: "every container radius is 20px or greater; nothing square", kind: deterministic }
  - { id: kawaii.color.pastel, rule: "all fills are pastels between 20% and 60% saturation on a near-white ground", kind: deterministic }
  - { id: kawaii.motif.cute, rule: "hearts, stars, sparkles or mascot characters appear as recurring motifs", kind: deterministic }
  - { id: kawaii.type.rounded, rule: "type is a rounded sans at medium or bold weight; no thin or condensed faces", kind: deterministic }
  - { id: kawaii.a11y.contrast, rule: "ink on every pastel fill meets 4.5:1 — the usual failure of this palette", kind: deterministic }
  - { id: kawaii.a11y.decorative, rule: "sparkles and mascots are decorative and hidden from assistive technology", kind: deterministic }
  - { id: kawaii.motion.bounce, rule: "hover bounces are under 350ms and stop under prefers-reduced-motion", kind: deterministic }
  - { id: kawaii.feel.charm, rule: "the page reads as genuinely charming rather than pastel-by-default", kind: judged }
---

# Kawaii

## The look in one paragraph

Soft, round and friendly: near-white ground, bubblegum and sky pastels, 28px corners on
everything, chunky rounded type, and small characters with dot eyes tucked into the corners.
Sparkles drift past. The whole page is trying to be liked, and the only discipline required is
keeping the text readable on all that pastel.

## Layout

- Centred at 1100px, comfortable spacing, with content in big rounded cards.
- Motifs — stars, hearts, clouds — float around content at low opacity.
- A mascot appears at section openers or in empty states, never blocking content.

## Typography

- A rounded sans at 600/800 for headings and 400/600 for body. No thin weights, no condensed
  faces, no serifs.
- Headings at `1.2`, body 17px at `1.65`, in a soft plum-toned ink rather than black.
- Emphasis is colour and weight; exclamation marks are part of the voice.

## Colour

Near-white cloud ground with bubblegum pink, sky blue, mint, lemon and lilac. All pastels, all
soft — and all of them fail contrast with light text, so the ink stays dark and is checked
everywhere.

## Surface and depth

Very rounded: 28px cards, pill buttons, 3px borders in a darker tint of the fill, and a flat
offset shadow beneath (no blur) so elements look like soft stickers.

## Motion

Bouncy: 300ms with overshoot, elements wobbling slightly on hover, sparkles drifting upward.
All ambient motion stops under reduced-motion.

## Imagery

Soft-focus pastel photography of stationery, plush toys, desserts and small objects, with
sparkle overlays. Illustration is rounded mascots with minimal faces.

## Components

- **Mascot** — a small character marking section openers and empty states.
- **Cards** — 28px radius, pastel fill, tinted border, flat offset shadow.
- **Buttons** — pills with pastel fill, dark ink label, bounce on hover.
- **Badges** — small pill labels with a star or heart.
- **Sparkle layer** — decorative, drifting, `aria-hidden`.

## Do

- Round everything generously.
- Keep the ink dark enough to pass contrast on every pastel.
- Use motifs consistently rather than scattering random cute assets.
- Give the mascot a real job — empty states, confirmations, errors.

## Don't

- Don't use light text on pastel fills.
- Don't mix in sharp corners or thin type.
- Don't let sparkles or mascots reach assistive technology.
- Don't let cuteness obscure the primary action.

## How Weave verifies it

Deterministic checks read every container radius, convert fills to HSL to confirm the pastel
band, detect recurring motif elements, check the font stack for rounded medium-plus weights,
measure contrast on each pastel fill, confirm decorative elements are hidden, and read motion
timing and reduced-motion behaviour. The judged check asks whether the charm feels intentional.

Reference pictures: `demo-design/kawaii/`.
