---
slug: bold-editorial
title: Bold Editorial
aliases: [poster web, one-colour editorial, contemporary grotesque]
status: ready
summary: One loud colour, type at poster scale, cut-out imagery and a visible grid — campaign energy held inside strict structure.
best_for: [product launches, agencies and studios, conferences and events, fashion and eyewear, editorial campaigns]
avoid_for: [dense dashboards, documentation, anything needing a quiet institutional voice]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: cream, value: "#F2EFE8" }
      - { name: ink, value: "#111111" }
      - { name: loud, value: "#1B2CE8" }
      - { name: loud-alt, value: "#F0410E" }
      - { name: loud-crimson, value: "#E01B3C" }
      - { name: paper, value: "#FFFFFF" }
      - { name: muted, value: "#8A8781" }
  typography:
    scale: display
    families:
      - { role: display, family: "Archivo Expanded, Druk, Anton, Helvetica Now Display, sans-serif", weights: [700, 800, 900] }
      - { role: sans, family: "Inter, Neue Haas Grotesk, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.03
    heading_line_height: 0.92
    display_size_vw: 9
    body_size_px: 16
    body_line_height: 1.6
    label_size_px: 12
    label_tracking_em: 0.1
    label_case: uppercase
  layout:
    system: grid
    density: comfortable
    columns: 12
    gutter_px: 24
    max_width_px: 1360
    section_spacing_px: [48, 88, 128]
    structure: visible column rules, section indices, vertical edge labels
  shape:
    radius_px: 2
    border_px: 1
    shadow: none
  motion:
    duration_ms: 380
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform, clip-path]
    intensity: decisive
  imagery:
    treatment: [cut-out subjects on flat ground, duotone or dithered photography, flat illustration]
    illustration: flat vector or stencil, in the loud colour and ink
    icons: 1.5px line or solid, geometric
checks:
  - { id: bold.color.single-loud, rule: "exactly one saturated hue is used alongside the neutrals", kind: deterministic }
  - { id: bold.color.large-field, rule: "the loud colour fills at least one full-bleed field or panel, not only small accents", kind: deterministic }
  - { id: bold.type.display-scale, rule: "the hero headline is at least 5x body size with line-height at or below 1.0", kind: deterministic }
  - { id: bold.type.labels-tracked, rule: "labels and metadata are 11-13px uppercase with tracking >= 0.08em", kind: deterministic }
  - { id: bold.layout.visible-structure, rule: "column rules, section indices or vertical edge labels are present as visible structure", kind: deterministic }
  - { id: bold.image.cutout, rule: "imagery is cut-out, duotone or dithered rather than full-colour rectangular photography", kind: deterministic }
  - { id: bold.shape.flat, rule: "radii stay at or below 4px, with no shadows or gradients on interface surfaces", kind: deterministic }
  - { id: bold.a11y.contrast-on-loud, rule: "text on the loud colour field meets 4.5:1", kind: deterministic }
  - { id: bold.feel.campaign, rule: "reads as a campaign poster held in a grid, not as institutional Swiss or magazine editorial", kind: judged }
---

# Bold Editorial

## The look in one paragraph

A cream or white page, one saturated colour used without apology, and a headline set so large
it becomes the layout. Imagery is cut out from its background or reduced to duotone, so it sits
*in* the composition rather than in a box. Underneath the noise is a strict grid with its rules
left visible, section numbers in the margins, and small tracked labels doing the quiet work.

Neighbours worth knowing: `swiss-design` shares the grid but forbids this scale and this
imagery; `editorial` is serif and magazine-shaped; `maximalism` has no single dominant colour.

## Layout

- 12 columns at 1360px with 24px gutters, and the column rules often drawn rather than implied.
- Section indices (`01 / 05`) and vertical labels run along the page edges.
- The hero is one composition: oversized headline, a cut-out subject overlapping it, one loud
  field anchoring a corner.
- Sections alternate between cream ground and full-bleed loud colour.

## Typography

- One expanded or condensed grotesque, heavy, set at 8–10vw with `0.92` line height and
  `-0.03em` tracking. The headline is allowed to collide with imagery.
- Body in a neutral sans at 16px.
- Labels at 11–13px, uppercase, tracked to `0.1em`: indices, coordinates, dates, captions.
- Numerals are a feature — step numbers, countdowns, statistics set large in the display face.

## Colour

Cream or white, ink, and **one** saturated hue — electric blue, orange-red or crimson. That hue
has to appear as a large field somewhere on the page, not just on buttons; a loud colour used
only in 40px doses reads as timid. Everything else stays neutral.

## Surface and depth

Flat. Radii at 2px or none, hairline borders, no shadows or gradients. Depth comes from overlap:
a cut-out figure crossing a rule, a headline passing behind a subject.

## Motion

Decisive: 380ms clip reveals and short translations. Type can wipe in from its baseline;
imagery scales slightly on entry. Nothing bounces, nothing loops.

## Imagery

Subjects cut out from their backgrounds and placed on flat colour, or photography reduced to
duotone or a coarse dither. Flat illustration in the loud colour works equally well. A
full-colour rectangular photograph immediately breaks the style.

## Components

- **Hero** — oversized headline, cut-out subject, one loud field, index label.
- **Loud band** — full-bleed section in the brand hue carrying a statement in cream.
- **Step row** — numbered steps in the display face with short labels beneath.
- **Cards** — hairline borders on cream, no radius, label plus heading plus one line.
- **Buttons** — square-ish, loud fill with cream label, or ink outline.
- **Edge labels** — vertical uppercase tracked text running up the page margin.

## Do

- Commit to one hue and use it at full field size.
- Let the headline be genuinely enormous.
- Cut out or duotone every photograph.
- Keep the grid visible.

## Don't

- Don't add a second saturated colour.
- Don't place full-colour rectangular photos.
- Don't soften with radii, shadows or gradients.
- Don't let the display face drop into body copy.

## How Weave verifies it

Deterministic checks count saturated hues and measure the largest contiguous area the loud
colour occupies, compare hero headline size against body size and read its line height, check
label size, case and tracking, look for drawn column rules or index elements, classify imagery
as cut-out, duotone or dithered versus rectangular full-colour, assert flat surfaces, and
measure contrast on the loud field. The judged check separates campaign energy from
institutional Swiss.

Reference pictures: `demo-design/bold-editorial/`.
