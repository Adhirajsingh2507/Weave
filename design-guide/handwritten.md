---
slug: handwritten
title: Handwritten
aliases: [handlettered, personal note, script-led]
status: ready
summary: A page that looks written rather than typeset — pen strokes, margin notes and the texture of paper under the ink.
best_for: [personal sites and newsletters, coaching and therapy, artisan food, invitations, small brands]
avoid_for: [enterprise, data tools, anything with dense text or many controls]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#FCF8F0" }
      - { name: ruled, value: "#DCD3C4" }
      - { name: ink-blue, value: "#2B3A6B" }
      - { name: ink-black, value: "#262220" }
      - { name: pencil, value: "#8A8377" }
      - { name: accent, value: "#B5462F" }
  typography:
    scale: large
    families:
      - { role: hand, family: "Caveat, Kalam, Patrick Hand, cursive", weights: [400, 700] }
      - { role: serif, family: "Source Serif 4, Georgia, serif", weights: [400] }
    heading_tracking_em: 0
    heading_line_height: 1.25
    body_size_px: 18
    body_line_height: 1.8
  layout:
    system: centered
    density: comfortable
    max_width_px: 960
    section_spacing_px: [56, 96, 136]
    composition: single column like a letter, margin notes to one side
  shape:
    radius_px: 4
    border_px: 1
    shadow: none
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [stroke-dashoffset, opacity]
    intensity: writing
  imagery:
    treatment: [scanned paper, pen sketches, photographed notes, subtle ruling]
    illustration: pen line drawings and margin doodles
    icons: hand-drawn, thin pen weight
checks:
  - { id: hand.type.roles, rule: "handwriting is used for headings, signatures and margin notes; body copy uses the serif", kind: deterministic }
  - { id: hand.paper.texture, rule: "paper grain or faint ruling is present at 4-10% opacity", kind: deterministic }
  - { id: hand.layout.letter, rule: "content is a single readable column of 60-75 characters, like a letter", kind: deterministic }
  - { id: hand.margin.notes, rule: "at least one margin note or annotation appears, offset from the main column", kind: deterministic }
  - { id: hand.a11y.contrast, rule: "ink colours on paper meet 4.5:1; pencil grey is not used for body text", kind: deterministic }
  - { id: hand.a11y.hand-size, rule: "handwritten text renders at 24px or larger, where the face stays legible", kind: deterministic }
  - { id: hand.motion.write, rule: "signature or heading strokes animate once and stop under prefers-reduced-motion", kind: deterministic }
  - { id: hand.feel.personal, rule: "the page reads as written by a specific person rather than as a template with a script font", kind: judged }
---

# Handwritten

## The look in one paragraph

A letter rather than a webpage: warm paper with faint ruling, a handwritten heading, a serif
body set generously, a note in the margin, and a signature at the bottom that draws itself.
Personal, quiet and slow — the design equivalent of being written to rather than marketed at.

## Layout

- A single centred column at 960px, like a sheet of writing paper.
- Margin notes sit to one side, slightly rotated, in a lighter ink.
- Generous spacing between sections; the page should never feel administrative.

## Typography

- Handwriting for headings, signatures and margin notes — always at 24px or larger, where the
  letterforms stay legible.
- A comfortable serif for body copy at 18px with `1.8` line height.
- Emphasis is an underline squiggle or a change of ink colour, not bold.

## Colour

Warm paper, faint ruled lines, blue and black ink, pencil grey for secondary marks, and one
red accent used the way a person underlines something twice.

## Surface and depth

Essentially flat: faint ruling, a hairline where a card is genuinely needed, no shadows. Depth
comes from the paper texture and the ink sitting on it.

## Motion

Writing: 600ms `stroke-dashoffset` on the signature or a heading, drawn once on arrival. Stops
immediately under reduced-motion.

## Imagery

Scanned paper, pen sketches, photographed handwritten notes, small margin doodles. Photographs
look like they were taped or glued in.

## Components

- **Letter block** — the main column with a handwritten heading and serif body.
- **Margin note** — a rotated handwritten annotation beside the column.
- **Signature** — a drawn SVG signature, animated once.
- **Buttons** — serif or handwritten labels with a hand-drawn underline; clean hit areas.
- **Divider** — a drawn squiggle rather than a rule.

## Do

- Keep handwriting large.
- Set body copy in the serif.
- Add one or two margin notes for personality.
- Let the paper texture show.

## Don't

- Don't set paragraphs, forms or navigation in handwriting.
- Don't use pencil grey for body text.
- Don't add shadows or modern card treatments.
- Don't animate the signature on every scroll.

## How Weave verifies it

Deterministic checks map font families to element roles and flag handwriting on body or UI text,
measure rendered handwriting size, detect paper texture and ruling opacity, measure the text
measure in characters, look for offset margin-note elements, check contrast for each ink, and
verify signature animation runs once and respects reduced-motion. The judged check asks whether
the page feels written by a person.

Reference pictures: `demo-design/handwritten/`.
