---
slug: oled-black
title: OLED Black
aliases: [true dark, pure black, amoled theme]
status: ready
summary: True #000000 ground where the screen's pixels are actually off — content defined by hairlines and restrained light, not by grey panels.
best_for: [media players, mobile-first products, reading apps, photography and film portfolios, battery-conscious tools]
avoid_for: [print-like editorial, bright playful brands, high-density data tools]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: black, value: "#000000" }
      - { name: elevated, value: "#0B0B0B" }
      - { name: hairline, value: "#1C1C1C" }
      - { name: foreground, value: "#EDEDED" }
      - { name: muted, value: "#9B9B9B" }
      - { name: accent, value: "#E8E8E8" }
      - { name: signal, value: "#4DA3FF" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, SF Pro Text, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.02
    heading_line_height: 1.2
    body_size_px: 16
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    max_width_px: 1100
    section_spacing_px: [56, 88, 128]
  shape:
    radius_px: 12
    border_px: 1
    shadow: none
  motion:
    duration_ms: 200
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform]
    intensity: quiet
  imagery:
    treatment: [full-bleed photography on black, no white frames, film stills]
    illustration: line work in mid grey
    icons: 1.5px line, mid grey, brighten on focus
checks:
  - { id: oled.color.true-black, rule: "the page background is exactly #000000", kind: deterministic }
  - { id: oled.surface.hairline, rule: "surfaces are separated by 1px hairlines or subtle elevation, never by shadows", kind: deterministic }
  - { id: oled.color.no-grey-panels, rule: "no large panel is lighter than the elevated token", kind: deterministic }
  - { id: oled.a11y.contrast-ceiling, rule: "body text is near-white but not pure #FFFFFF, to limit halation on OLED", kind: deterministic }
  - { id: oled.a11y.contrast-floor, rule: "muted text still meets 4.5:1 against pure black", kind: deterministic }
  - { id: oled.image.no-white-frame, rule: "images have no white background or border that lights the whole panel", kind: deterministic }
  - { id: oled.perf.dark-first, rule: "the dark theme is the default rendering, not a filter applied over a light theme", kind: deterministic }
  - { id: oled.feel.depth-without-grey, rule: "the interface reads as layered despite the absence of grey panels", kind: judged }
---

# OLED Black

## The look in one paragraph

Pure black, so the screen's pixels are genuinely off. Structure comes from hairlines, spacing
and small amounts of light rather than from stacks of grey cards. Text is near-white but
deliberately not pure white, because maximum contrast on an OLED panel smears. It feels calm,
economical and modern, and it costs less battery.

## Layout

- Centred, 1100px, with comfortable spacing. Sections separated by space or a 1px hairline.
- Elevation is expressed by the faintest lift (`#0B0B0B`) plus a hairline — never by a shadow,
  which is invisible on black anyway.
- Full-bleed imagery works beautifully here; let photographs run edge to edge on black.

## Typography

- One sans at 400/500. Body 16px at `1.6`, in `#EDEDED` rather than `#FFFFFF`.
- Headings at `1.2` with slight negative tracking.
- Weight, not colour, marks emphasis; there's very little colour available.

## Colour

Black, one elevated near-black, one hairline grey, near-white text, mid grey for secondary, and
a single signal blue used only for links and focus. Everything else is restraint.

## Surface and depth

There are essentially no panels. What looks like a card is a hairline boundary with 12px radius
and, at most, a `#0B0B0B` fill. Shadows are pointless on true black and are omitted entirely.

## Motion

Quiet: 200ms fades and small rises. Avoid large bright areas flashing into view, which is
uncomfortable on OLED in the dark.

## Imagery

Photography and video shine here: full bleed, no white frames, no light backgrounds. Images with
white backgrounds must be re-cut or given a dark matte, otherwise they light up the whole screen.

## Components

- **Cards** — hairline border, optional near-black fill, 12px radius.
- **Nav** — black bar with a hairline beneath; the active item brightens rather than filling.
- **Buttons** — primary is a light fill with black label; secondary is a hairline outline.
- **Inputs** — near-black fill, hairline border, signal-blue focus ring.
- **Dividers** — single hairlines, used sparingly.

## Do

- Use exactly `#000000` for the ground.
- Keep body text just under pure white.
- Express elevation with hairlines and space.
- Cut white backgrounds out of imagery.

## Don't

- Don't stack grey panels — that's ordinary dark mode, not this.
- Don't use drop shadows.
- Don't flash large bright surfaces.
- Don't let muted greys fall under the contrast floor.

## How Weave verifies it

Deterministic checks sample the page background for exact `#000000`, read panel fills against
the elevated token, look for shadow declarations, check body text colour sits below pure white
while muted text stays above the contrast floor, inspect images for light backgrounds by
sampling edge pixels, and confirm the dark theme is authored rather than filtered. The judged
check asks whether the interface still reads as layered.

Reference pictures: `demo-design/oled-black/`.
