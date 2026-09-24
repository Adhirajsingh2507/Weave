---
slug: halftone
title: Halftone
aliases: [dot screen, newsprint dots, ben-day]
status: ready
summary: Tone built from dots — images and fills rendered as visible screens, celebrating the mechanics of printing.
best_for: [editorial and news, music and posters, streetwear, campaign sites, archives]
avoid_for: [product photography, luxury, fine detail imagery, small screens with fine screens]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: newsprint, value: "#EDE9E0" }
      - { name: ink, value: "#12110F" }
      - { name: dot, value: "#1B1A17" }
      - { name: spot, value: "#E23B2E" }
      - { name: muted, value: "#6F6A61" }
  typography:
    scale: display
    families:
      - { role: display, family: "Archivo Black, Anton, Impact, sans-serif", weights: [700, 900] }
      - { role: serif, family: "Georgia, Times New Roman, serif", weights: [400, 700] }
    heading_tracking_em: -0.03
    heading_case: uppercase
    heading_line_height: 0.92
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: grid
    density: compact
    columns: 12
    max_width_px: 1280
    section_spacing_px: [32, 64, 96]
  shape:
    radius_px: 0
    border_px: 2
    shadow: none
  motion:
    duration_ms: 160
    easing: "steps(3, end)"
    properties: [background-position, opacity]
    intensity: mechanical
  imagery:
    treatment: [halftone-converted photography, visible dot screens, newsprint texture]
    illustration: dot-screen fills and gradients
    icons: solid or dot-filled, high contrast
checks:
  - { id: half.screen.visible, rule: "dot screens are visible at normal viewing size, not sub-pixel", kind: deterministic }
  - { id: half.screen.consistent-angle, rule: "all dot screens share one angle (commonly 45 degrees)", kind: deterministic }
  - { id: half.image.converted, rule: "photography is halftone-converted rather than continuous tone", kind: deterministic }
  - { id: half.gradient.dots, rule: "tonal transitions use dot density rather than smooth CSS gradients", kind: deterministic }
  - { id: half.a11y.text-clear, rule: "no body text sits on top of a dot screen", kind: deterministic }
  - { id: half.a11y.contrast, rule: "ink on newsprint meets 4.5:1 with the texture applied", kind: deterministic }
  - { id: half.perf.pattern, rule: "screens are CSS/SVG patterns or pre-processed images, not per-frame canvas filters", kind: deterministic }
  - { id: half.feel.print, rule: "the page reads as printed matter rather than a photo with a dot overlay", kind: judged }
---

# Halftone

## The look in one paragraph

Tone made of dots you can see: photographs converted into dot screens, gradients built from
dot density, and flat areas broken up by a visible pattern. Newsprint colours, heavy uppercase
headlines, and a general air of something printed cheaply and at speed.

## Layout

- 12 columns at 1280px, compact and newspaper-like, with strong horizontal rules between blocks.
- Images are large and coarse; screens are set big enough to be clearly visible on a phone.
- Text columns are plain and sit clear of any screened area.

## Typography

- A heavy grotesque, uppercase, very tight (`0.92` line height, `-0.03em`) for headlines.
- A serif for body copy, newspaper-style, at 17px.
- Headlines may be filled with a dot screen at large sizes only, never below 48px.

## Colour

Newsprint stock, black ink, and one spot red. The dot colour is the ink; the paper shows
through between dots, which is what produces the mid-tones.

## Surface and depth

Flat. 2px rules, no radii, no shadows. Depth is dot density: denser screens read as darker and
closer.

## Motion

Mechanical: 160ms stepped shifts of the pattern position, as though the press advanced a frame.
Screens themselves should not animate continuously.

## Imagery

Every photograph converted to halftone with a consistent screen angle and frequency. Choose
high-contrast sources; subtle tonal photographs disappear into grey mush.

## Components

- **Screened image** — the main visual element, coarse and bold.
- **Headline block** — heavy uppercase type over a plain ground.
- **Rules** — 2px black rules separating stories.
- **Buttons** — solid ink rectangles or outlined blocks, never screened.
- **Pull quote** — serif italic in a boxed rule, plain background.

## Do

- Keep one screen angle throughout.
- Make dots visibly coarse.
- Use dot density for gradients.
- Keep text on plain ground.

## Don't

- Don't screen body text or small controls.
- Don't mix screen angles or frequencies.
- Don't use smooth CSS gradients.
- Don't apply screens per frame on a canvas.

## How Weave verifies it

Deterministic checks sample rendered regions to measure dot size and screen angle consistency,
analyse images for halftone conversion, look for smooth gradient declarations, compare text
bounding boxes against screened regions, measure contrast with texture applied, and confirm
screens are patterns or pre-processed assets. The judged check asks whether it reads as printed
matter.

Reference pictures: `demo-design/halftone/`.
