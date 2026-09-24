---
slug: dark-academia
title: Dark Academia
aliases: [academia aesthetic, library gothic, scholarly]
status: ready
summary: Old library melancholy — oxblood and tobacco tones, classical serifs, archival photography and lamplight in the corners.
best_for: [publishing and bookshops, courses and universities, literary projects, podcasts, archives]
avoid_for: [consumer tech, children's products, high-energy brands, dashboards]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: walnut, value: "#20191A" }
      - { name: leather, value: "#3A2A25" }
      - { name: parchment, value: "#E7DCC6" }
      - { name: oxblood, value: "#6B2230" }
      - { name: tobacco, value: "#8A6A3E" }
      - { name: sage, value: "#5E6B52" }
      - { name: muted, value: "#A99B84" }
  typography:
    scale: display
    families:
      - { role: serif, family: "EB Garamond, Cormorant Garamond, Georgia, serif", weights: [400, 600] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400] }
    heading_tracking_em: 0.01
    heading_line_height: 1.25
    body_size_px: 18
    body_line_height: 1.8
  layout:
    system: centered
    density: comfortable
    max_width_px: 1060
    section_spacing_px: [64, 104, 148]
    composition: book-like column, rules, marginalia, plates with captions
  shape:
    radius_px: 2
    border_px: 1
    shadow: "0 20px 50px rgba(0,0,0,0.45)"
  motion:
    duration_ms: 420
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [opacity]
    intensity: quiet
  imagery:
    treatment: [archival photography, sepia and desaturated tones, statuary, libraries, handwriting]
    illustration: engravings, anatomical and astronomical plates
    icons: thin serif-compatible line work
checks:
  - { id: acad.type.serif-throughout, rule: "headings and body both use serif faces; sans is limited to small labels", kind: deterministic }
  - { id: acad.color.warm-dark, rule: "grounds are warm dark browns, not neutral black or grey", kind: deterministic }
  - { id: acad.reading.measure, rule: "body text is 18px or larger with a 60-72 character measure", kind: deterministic }
  - { id: acad.image.archival, rule: "photography is desaturated or sepia-toned, not modern full colour", kind: deterministic }
  - { id: acad.plate.captions, rule: "images are presented as plates with captions and, where relevant, a figure number", kind: deterministic }
  - { id: acad.a11y.contrast, rule: "parchment on walnut and tobacco accents meet 4.5:1", kind: deterministic }
  - { id: acad.motion.quiet, rule: "transitions are opacity-only; nothing slides or scales", kind: deterministic }
  - { id: acad.feel.scholarly, rule: "the page reads as a scholarly artefact rather than a dark theme with a serif font", kind: judged }
---

# Dark Academia

## The look in one paragraph

A reading room after dark: warm walnut and leather grounds, parchment text, an oxblood accent,
archival photographs presented as captioned plates, and a classical serif set generously. The
mood is studious and slightly melancholy, and everything is built around long-form reading.

## Layout

- Centred at 1060px — book proportions rather than screen proportions.
- A main text column with marginalia to one side: dates, references, annotations.
- Plates (images) interrupt the column with a caption and figure number beneath.

## Typography

- Serif throughout: an old-style face for both headings and body, with sans reserved for the
  smallest labels.
- Body at 18px with `1.8` line height and a 60–72 character measure — this style exists to be
  read.
- Small caps for section openers, italics for titles and asides, drop caps where appropriate.

## Colour

Warm dark browns rather than neutral black, parchment for text, oxblood for links and accents,
tobacco and sage as supporting tones. Warmth is what separates this from generic dark mode.

## Surface and depth

Nearly flat: 2px radii, hairline borders, and deep soft shadows only where something genuinely
sits above the page. Texture — paper, leather grain — carries more weight than elevation.

## Motion

Quiet: 420ms opacity fades. Nothing slides, scales or parallaxes; the page behaves like paper.

## Imagery

Archival photography in sepia or desaturated tone, statuary, libraries, manuscripts, anatomical
and astronomical engravings. Every image is a captioned plate.

## Components

- **Plate** — image, caption, figure number, hairline rule above.
- **Marginalia** — small notes in the margin beside the text column.
- **Buttons** — hairline outline with serif small-caps label; oxblood fill for primary.
- **Footnotes** — numbered, linked, and readable at the foot of a section.
- **Nav** — serif links with wide spacing and a hairline beneath.

## Do

- Keep serif type throughout.
- Present images as captioned plates.
- Use warm dark tones, never neutral black.
- Give body text real reading comfort.

## Don't

- Don't use cool greys or pure black.
- Don't add motion beyond fades.
- Don't use modern saturated photography.
- Don't tighten the measure to fit more on screen.

## How Weave verifies it

Deterministic checks map font families to roles and flag sans usage in body text, sample grounds
for warmth in HSL, measure body size and character measure, analyse image saturation for archival
treatment, confirm figures carry captions, measure contrast, and check transition properties. The
judged check asks whether it reads as a scholarly artefact.

Reference pictures: `demo-design/dark-academia/`.
