---
slug: duotone
title: Duotone
aliases: [two-tone, bicolour gradient map, spotify duotone]
status: ready
summary: Every image mapped to exactly two colours — shadows in one hue, highlights in another, so photography becomes brand.
best_for: [music and events, sports, agencies, campaign microsites, editorial features]
avoid_for: [ecommerce product detail, food photography, anything where true colour matters]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: shadow-tone, value: "#1B1140" }
      - { name: highlight-tone, value: "#FF4D6D" }
      - { name: background, value: "#120C2A" }
      - { name: foreground, value: "#F6F2FF" }
      - { name: muted, value: "#A79CC4" }
      - { name: alt-shadow, value: "#08313B" }
      - { name: alt-highlight, value: "#4DFFD0" }
  typography:
    scale: display
    families:
      - { role: sans, family: "Inter, Archivo, system-ui, sans-serif", weights: [400, 700] }
    heading_tracking_em: -0.025
    heading_line_height: 1.0
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1280
    section_spacing_px: [56, 96, 136]
  shape:
    radius_px: 8
    border_px: 0
    shadow: none
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, filter]
    intensity: crisp
  imagery:
    treatment: [all photography gradient-mapped to two tones, high contrast, no true colour]
    illustration: two-tone flat shapes
    icons: single tone, high contrast
checks:
  - { id: duo.image.two-tone, rule: "every photograph resolves to two hues plus their blend, with no third hue present", kind: deterministic }
  - { id: duo.image.consistent-pair, rule: "one tone pair is used across a section; pairs change only at section boundaries", kind: deterministic }
  - { id: duo.contrast.image, rule: "duotone images retain full tonal range from shadow to highlight, not a flat mid band", kind: deterministic }
  - { id: duo.a11y.text-on-image, rule: "text over duotone imagery meets 4.5:1 against the lightest area it covers", kind: deterministic }
  - { id: duo.ui.tone-derived, rule: "interface colours are drawn from the same tone pair", kind: deterministic }
  - { id: duo.shape.simple, rule: "no borders or shadows compete with the imagery; containers stay flat", kind: deterministic }
  - { id: duo.perf.css-mapping, rule: "duotone is applied via CSS/SVG filters or pre-processed assets, not per-frame canvas work", kind: deterministic }
  - { id: duo.feel.branded, rule: "imagery reads as one branded visual system rather than assorted photos with a filter", kind: judged }
---

# Duotone

## The look in one paragraph

Photography is reduced to two colours: shadows take one hue, highlights take another, and
everything in between is a blend. Because every image obeys the same mapping, a page of
unrelated photographs suddenly looks like one brand. The interface borrows the same two tones,
so nothing sits outside the system.

## Layout

- 12 columns at 1280px, ordinary rhythm. The imagery does the differentiating.
- Full-bleed duotone images work well as section openers, with type sitting directly on them.
- Sections can switch to an alternate tone pair, but never mid-section.

## Typography

- One sans at 400/700, set large and tight for headings so it holds against high-contrast
  imagery.
- Body 17px at `1.6` in the light foreground tone.
- Type over images sits in the darkest region or on a solid band.

## Colour

A tone pair defines everything: a deep shadow hue and a bright highlight hue, plus the ground
and text colours derived from them. A second pair may be used for an alternate section. Three
or more hues in one image breaks the effect.

## Surface and depth

Flat. 8px radii at most, no borders, no shadows — anything decorative competes with the
imagery, which is the whole design.

## Motion

Crisp: 260ms fades and slides. Hovering an image may shift the mapping toward the highlight
tone, which is a cheap and very effective interaction.

## Imagery

High-contrast source photography with a clear subject and real tonal range. Flat or low-contrast
originals turn to mud when mapped. Apply the mapping with a CSS or SVG filter, or pre-process
the assets — never per frame on a canvas.

## Components

- **Image band** — full-bleed duotone photograph with an overlaid headline.
- **Cards** — duotone thumbnail with text beneath, no border.
- **Buttons** — highlight-tone fill with dark label, or an outline in the highlight tone.
- **Nav** — transparent over imagery, solid shadow tone when scrolled.
- **Tone pair swap** — an alternate pair marking a different content type.

## Do

- Map every photograph, without exception.
- Keep the tonal range wide.
- Derive interface colours from the same pair.
- Pre-process or filter efficiently.

## Don't

- Don't mix mapped and unmapped photography.
- Don't change tone pairs within a section.
- Don't put text over the mid-tones of an image.
- Don't use duotone where accurate product colour matters.

## How Weave verifies it

Deterministic checks sample rendered images for hue clustering to confirm two-tone mapping and
detect any third hue, compare tone pairs within and across sections, measure the tonal histogram
for range, check contrast where text overlays imagery, verify interface colours belong to the
pair, and confirm mapping is done by filter or pre-processed asset. The judged check asks whether
imagery reads as one system.

Reference pictures: `demo-design/duotone/`.
