---
slug: botanical
title: Botanical
aliases: [herbarium, plant illustration, garden style]
status: ready
summary: Pressed-plant elegance — engraved botanical illustration, herbarium labels, soft greens and paper that looks archival.
best_for: [skincare and herbal brands, tea and apothecary, florists, gardens and museums, wellness]
avoid_for: [tech products, gaming, high-energy campaigns, dense dashboards]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#F6F2E7" }
      - { name: ink, value: "#2A2B24" }
      - { name: leaf, value: "#5B7A4B" }
      - { name: stem, value: "#8A9C6E" }
      - { name: bloom, value: "#C4788A" }
      - { name: bark, value: "#7A5C41" }
      - { name: label, value: "#EDE4CE" }
  typography:
    scale: large
    families:
      - { role: serif, family: "Cormorant Garamond, EB Garamond, Georgia, serif", weights: [300, 500] }
      - { role: sans, family: "Inter, Work Sans, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.02
    heading_line_height: 1.25
    body_size_px: 17
    body_line_height: 1.75
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1120
    section_spacing_px: [72, 120, 168]
    composition: specimen plates with handwritten-style labels and generous margins
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 480
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, transform]
    intensity: gentle
  imagery:
    treatment: [engraved botanical plates, pressed specimens, soft daylight photography, paper grain]
    illustration: line engraving with watercolour wash
    icons: thin botanical line work
checks:
  - { id: bot.illustration.botanical, rule: "botanical illustration or specimen photography appears in at least 2 sections", kind: deterministic }
  - { id: bot.color.muted-green, rule: "the palette is muted greens and earth tones on warm paper; no saturated hues", kind: deterministic }
  - { id: bot.texture.paper, rule: "a paper grain overlay is present at 3-8% opacity", kind: deterministic }
  - { id: bot.type.serif-light, rule: "headings use a light high-contrast serif with open tracking", kind: deterministic }
  - { id: bot.label.specimen, rule: "specimen-style labels (name, latin name, note) accompany illustrations", kind: deterministic }
  - { id: bot.layout.space, rule: "at least 45% of each viewport is unpainted paper", kind: deterministic }
  - { id: bot.a11y.contrast, rule: "ink on paper and text on the leaf and bloom fills meet 4.5:1", kind: deterministic }
  - { id: bot.feel.archival, rule: "the page reads as a herbarium plate rather than a generic green wellness site", kind: judged }
---

# Botanical

## The look in one paragraph

A page from a herbarium: a pressed specimen or engraved plate centred on warm archival paper,
with a small label giving its common and Latin names, light serif type, and a palette of muted
greens and earth. Calm, precise and slightly scholarly.

## Layout

- Asymmetric at 1120px with generous margins — specimens need white space around them.
- Each section presents one specimen plate with its label, and text sits in a narrow column
  beside it.
- Small botanical elements (a single stem, a leaf) may run off the page edge as a border.

## Typography

- A light high-contrast serif for headings with `0.02em` tracking — restrained and printed.
- Body in the same serif at 17px with `1.75` line height.
- Labels in small sans caps or italic serif, with the Latin name italicised, as convention
  requires.

## Colour

Warm paper, dark olive ink, muted leaf and stem greens, a soft bloom pink, and bark brown. The
label surface is a slightly deeper paper tone. Nothing saturated.

## Surface and depth

Flat archival print. No shadows or radii. Separation comes from hairline rules and space; a
label may sit inside a 1px box like a herbarium card.

## Motion

Gentle: 480ms fades and slight rises, as though a page has been turned. Nothing energetic.

## Imagery

Engraved botanical plates, pressed specimens photographed flat, soft daylight photography of
plants and ingredients, always with paper grain over the top.

## Components

- **Specimen plate** — an illustration with a labelled card beneath it.
- **Label card** — common name, Latin name in italic, a short note, and a reference number.
- **Buttons** — 1px outlined rectangles with serif labels; leaf fill for primary.
- **Nav** — serif links with a botanical glyph separator and a hairline rule.
- **Section opener** — a single stem illustration with a serif heading beside it.

## Do

- Label specimens with common and Latin names.
- Keep the palette muted and earthy.
- Leave plenty of paper visible.
- Keep illustration line work consistent in weight.

## Don't

- Don't use saturated greens or bright gradients.
- Don't add shadows or cards.
- Don't crowd multiple specimens into one section.
- Don't set body copy over illustration.

## How Weave verifies it

Deterministic checks look for botanical illustration assets across sections, convert the palette
to HSL to confirm muted saturation, measure paper grain opacity, read the heading type class and
tracking, detect specimen label structures including italicised Latin names, measure unpainted
area, and check contrast. The judged check asks whether it reads as archival rather than generic
wellness.

Reference pictures: `demo-design/botanical/`.
