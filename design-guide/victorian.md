---
slug: victorian
title: Victorian
aliases: [victoriana, 19th century print, ornamental revival]
status: ready
summary: Nineteenth-century printing house — ornamental borders, engraved serifs, centred compositions and layers of decorative rules.
best_for: [heritage brands, distilleries and apothecaries, museums, books and publishing, formal events]
avoid_for: [tech products, minimal brands, anything young or casual]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#EFE7D6" }
      - { name: ink, value: "#1F1A15" }
      - { name: oxblood, value: "#6E1F2A" }
      - { name: forest, value: "#2C4432" }
      - { name: gilt, value: "#A78B3C" }
      - { name: sepia, value: "#7A6A54" }
  typography:
    scale: display
    families:
      - { role: display, family: "Playfair Display, Bodoni Moda, Didot, serif", weights: [400, 700, 900] }
      - { role: serif, family: "EB Garamond, Georgia, serif", weights: [400, 600] }
    heading_tracking_em: 0.01
    heading_line_height: 1.15
    body_size_px: 18
    body_line_height: 1.7
  layout:
    system: centered
    density: comfortable
    max_width_px: 1080
    section_spacing_px: [56, 96, 136]
    composition: strict centre axis, framed blocks, stacked decorative rules
  shape:
    radius_px: 0
    border_px: 2
    border_style: double and ornamental rules
    shadow: none
  motion:
    duration_ms: 320
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [opacity]
    intensity: restrained
  imagery:
    treatment: [engravings, botanical plates, sepia portraits, ornamental frames]
    illustration: line engraving, filigree, crests
    icons: engraved, symmetrical, ornamental
checks:
  - { id: vic.layout.centred, rule: "headings and hero content are centred on a single vertical axis", kind: deterministic }
  - { id: vic.ornament.rules, rule: "sections are separated by ornamental or double rules, not plain hairlines", kind: deterministic }
  - { id: vic.type.serif-stack, rule: "all type is serif; display and text serifs are distinct families", kind: deterministic }
  - { id: vic.type.hierarchy-stack, rule: "hero uses a stacked hierarchy of at least 3 type sizes in one block", kind: deterministic }
  - { id: vic.color.muted-rich, rule: "palette uses paper, ink and deep muted colours; no bright or neon hues", kind: deterministic }
  - { id: vic.frame.ornament, rule: "key content sits inside an ornamental frame or border treatment", kind: deterministic }
  - { id: vic.a11y.decorative-hidden, rule: "filigree and ornament are decorative and hidden from assistive technology", kind: deterministic }
  - { id: vic.feel.printed, rule: "the page reads as 19th-century letterpress rather than a modern serif site", kind: judged }
---

# Victorian

## The look in one paragraph

A title page from 1885: everything centred, a stack of type in five sizes announcing the same
thing with increasing enthusiasm, ornamental rules between each line, engraved illustration,
and a border of filigree around the whole block. Rich muted colours on aged paper, and not a
rounded corner in sight.

## Layout

- Centred on a strict vertical axis at 1080px. Symmetry is mandatory.
- Content blocks are framed: double rules, corner ornaments, or a filigree border.
- Hero is a stacked composition — eyebrow, huge headline, rule, subtitle, rule, small caps
  detail — in the manner of a playbill.

## Typography

- A high-contrast display serif (Playfair, Bodoni) for headlines and a text serif (Garamond)
  for reading.
- Mixed sizes within one block, separated by rules, is the signature move.
- Body at 18px, `1.7` line height. Small caps, ligatures and old-style figures where available.

## Colour

Aged paper, dark ink, oxblood, forest green and gilt. Deep and muted — the colours of dyed
cloth and printed ink, never bright.

## Surface and depth

Flat print. Depth is layered rules and frames, not shadow. Borders are double or ornamental,
2px minimum, with corner flourishes.

## Motion

Restrained: 320ms opacity fades only. A 19th-century page does not slide.

## Imagery

Engravings, botanical plates, sepia portraits, crests and monograms. Illustrations sit inside
ornamental frames with an engraved caption beneath.

## Components

- **Hero block** — stacked type hierarchy with rules between the lines, centred.
- **Buttons** — square, 2px double border, small caps label, oxblood or gilt.
- **Cards** — framed blocks with an ornamental top rule and centred heading.
- **Dividers** — a centred ornament flanked by rules.
- **Inputs** — square fields with a double-rule border and sepia label.

## Do

- Centre everything on one axis.
- Stack type sizes with rules between them.
- Frame key content ornamentally.
- Keep serifs throughout, including labels.

## Don't

- Don't introduce a sans typeface.
- Don't round corners or add shadows.
- Don't use bright or saturated colour.
- Don't let filigree reach screen readers.

## How Weave verifies it

Deterministic checks measure horizontal centring of headings and hero blocks, detect ornamental
or double-rule separators, confirm every font role resolves to a serif and that display and body
serifs differ, count distinct type sizes within the hero block, sample the palette for muted
richness, look for framing ornament, and verify decorative nodes carry `aria-hidden`. The judged
check asks whether it reads as letterpress rather than a modern serif theme.

Reference pictures: `demo-design/victorian/`.
