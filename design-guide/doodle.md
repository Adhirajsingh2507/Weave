---
slug: doodle
title: Doodle
aliases: [napkin sketch, hand-drawn, marker sketch]
status: ready
summary: Drawn by hand in marker — wobbly outlines, arrows and circles around things, and the feeling of an idea sketched in a meeting.
best_for: [startup explainers, education, workshops and events, product onboarding, community tools]
avoid_for: [luxury, finance, enterprise procurement, anything needing authority]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#FFFDF8" }
      - { name: graphite, value: "#2E2B28" }
      - { name: marker-blue, value: "#2F6BD8" }
      - { name: marker-red, value: "#E24A3B" }
      - { name: highlighter, value: "#FFE86B" }
      - { name: muted, value: "#7D776F" }
  typography:
    scale: large
    families:
      - { role: hand, family: "Caveat, Patrick Hand, Comic Neue, cursive", weights: [400, 700] }
      - { role: sans, family: "Inter, Nunito, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [56, 96, 136]
    composition: sketch annotations, arrows connecting ideas, circled emphasis
  shape:
    radius_px: 12
    border_px: 2
    border_style: hand-drawn wobble
    shadow: none
  motion:
    duration_ms: 420
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [stroke-dashoffset, opacity, transform]
    intensity: sketching
  imagery:
    treatment: [marker sketches, napkin drawings, arrows and callouts, paper grain]
    illustration: loose hand-drawn figures and diagrams
    icons: hand-drawn, slightly uneven
checks:
  - { id: doodle.stroke.wobble, rule: "outlines and borders use hand-drawn irregular paths, not perfect rectangles", kind: deterministic }
  - { id: doodle.annotation.arrows, rule: "hand-drawn arrows or circles connect or emphasise at least 2 elements", kind: deterministic }
  - { id: doodle.type.hand-limited, rule: "the handwriting face is used for headings and annotations only; body copy uses the sans", kind: deterministic }
  - { id: doodle.paper.texture, rule: "paper grain or ruled-paper texture backs the page at 3-10% opacity", kind: deterministic }
  - { id: doodle.a11y.contrast, rule: "graphite and marker colours on paper meet 4.5:1; highlighter is never used as text colour", kind: deterministic }
  - { id: doodle.motion.draw, rule: "sketch elements animate by drawing their stroke and stop under prefers-reduced-motion", kind: deterministic }
  - { id: doodle.a11y.decorative, rule: "decorative doodles are hidden from assistive technology; meaningful diagrams have descriptions", kind: deterministic }
  - { id: doodle.feel.spontaneous, rule: "the page feels sketched by a person rather than assembled from a doodle icon pack", kind: judged }
---

# Doodle

## The look in one paragraph

An idea explained on a napkin: wobbly marker outlines, arrows pointing from one thing to
another, a word circled twice for emphasis, a highlighter streak under the important bit, and
handwriting for the headings. Friendly, unpolished and good at making complicated things feel
approachable.

## Layout

- Asymmetric at 1140px. Elements are placed as if sketched in order, with annotations added
  afterwards in the gaps.
- Arrows connect sections, so the page reads as one continuous train of thought.
- Comfortable spacing; the page shouldn't look crowded like a whiteboard at the end of a meeting.

## Typography

- A handwriting face for headings, labels and annotations — and nothing else.
- A friendly sans for body copy at 17px, because handwriting is unreadable in paragraphs.
- Emphasis is a circle, an underline squiggle or a highlighter streak rather than bold.

## Colour

Warm paper, graphite for the main line work, blue and red marker for annotation, and a yellow
highlighter used only as a background streak. Everything looks like desk supplies.

## Surface and depth

No shadows or true radii — boxes are hand-drawn with wobbling edges, so corners vary. Depth is
overlap: a sticky note over a sketch, an arrow crossing a box.

## Motion

Sketching: 420ms `stroke-dashoffset` so lines draw themselves in order, annotations appearing
after the thing they annotate. Stops under reduced-motion.

## Imagery

Marker sketches, napkin diagrams, stick figures, boxes and arrows. Photographs sit inside a
hand-drawn frame with a scribbled caption.

## Components

- **Sketch box** — a hand-drawn rectangle containing content.
- **Arrow** — a drawn connector between two elements, decorative and hidden from screen readers.
- **Circled emphasis** — a loop drawn around a word or number.
- **Highlighter** — a yellow streak behind a phrase; never the text colour itself.
- **Buttons** — hand-drawn outlines with handwritten labels and a clean rectangular hit area.

## Do

- Vary the wobble so no two boxes look identical.
- Use arrows to carry the argument.
- Keep body copy in the sans.
- Animate lines as though being drawn.

## Don't

- Don't set paragraphs in handwriting.
- Don't use highlighter yellow as a text colour.
- Don't let decorative doodles reach assistive technology.
- Don't use perfectly geometric shapes — that breaks the conceit.

## How Weave verifies it

Deterministic checks inspect SVG paths for irregular hand-drawn geometry versus perfect
rectangles, count arrow and circle annotation elements, identify where the handwriting face is
used and flag body usage, measure paper texture opacity, check contrast for marker colours and
confirm highlighter is background-only, read stroke animation behaviour, and verify decorative
hiding. The judged check asks whether it feels genuinely sketched.

Reference pictures: `demo-design/doodle/`.
