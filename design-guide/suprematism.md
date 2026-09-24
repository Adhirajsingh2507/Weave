---
slug: suprematism
title: Suprematism
aliases: [malevich style, supermatism]
status: ready
summary: Pure geometric forms floating in white void — squares, bars and circles at deliberate angles, colour with no representation at all.
best_for: [art projects, galleries, experimental portfolios, conference and festival identities]
avoid_for: [content-heavy sites, commerce, anything needing imagery or warmth]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: void, value: "#FFFFFF" }
      - { name: black, value: "#0A0A0A" }
      - { name: red, value: "#D32D1F" }
      - { name: blue, value: "#1B4BA8" }
      - { name: yellow, value: "#E8B71A" }
      - { name: grey, value: "#B9B9B4" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Helvetica Neue, Arial, sans-serif", weights: [400, 700] }
    heading_tracking_em: 0
    heading_line_height: 1.05
    body_size_px: 17
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: spacious
    max_width_px: 1400
    section_spacing_px: [96, 144, 200]
    composition: forms floating in void, angles between 10 and 45 degrees
  shape:
    radius_px: 0
    circle_allowed: true
    border_px: 0
    shadow: none
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [transform, opacity]
    intensity: floating
  imagery:
    treatment: [none; geometry only]
    illustration: flat geometric forms
    icons: solid squares, bars, circles
checks:
  - { id: sup.layout.void, rule: "at least 65% of each viewport is pure white void", kind: deterministic }
  - { id: sup.shape.primitives, rule: "decorative elements are solid squares, bars or circles with no borders", kind: deterministic }
  - { id: sup.shape.angles, rule: "forms are rotated between 10 and 45 degrees; none sit perfectly square except text blocks", kind: deterministic }
  - { id: sup.color.flat-limited, rule: "forms use flat colour from the palette; no gradients or tints", kind: deterministic }
  - { id: sup.image.none, rule: "no photographic or illustrative imagery is loaded", kind: deterministic }
  - { id: sup.type.plain, rule: "one sans family, set horizontally and left-aligned", kind: deterministic }
  - { id: sup.motion.float, rule: "motion is slow translation or rotation, 400ms or longer", kind: deterministic }
  - { id: sup.a11y.decorative, rule: "geometric forms are marked decorative and hidden from assistive technology", kind: deterministic }
  - { id: sup.feel.weightless, rule: "forms appear to float in space rather than sit in a layout", kind: judged }
---

# Suprematism

## The look in one paragraph

A white void with a handful of flat geometric forms suspended in it at angles — a black square,
a red bar, a blue circle — arranged so the composition feels weightless and dynamic at once.
No imagery, no ornament, no depth. Text is plain and sits quietly among the forms.

## Layout

- Wide canvas, mostly empty: at least two-thirds pure white per screen.
- Forms are placed by composition rather than grid, at angles between 10° and 45°, with
  deliberate tension between a large form and a small one.
- Text blocks stay horizontal and left-aligned so the page remains readable.
- On scroll, new forms enter the void; sections are separated by 96–200px of nothing.

## Typography

- A single neutral sans, regular and bold. No angled, rotated or decorative text.
- Headings are larger but never enormous — the forms carry the drama, not the type.
- Body at 17px, `1.55`, held to a comfortable measure inside the void.

## Colour

Pure white void, near-black, and three flat primaries plus a neutral grey. Each form is a
single flat colour. No gradients, no tints, no transparency.

## Surface and depth

None whatsoever. Forms do not cast shadows or overlap with transparency; if they overlap, the
front form is simply opaque.

## Motion

Slow floating: 500ms translations and rotations, as if the forms are drifting in zero gravity.
Nothing accelerates sharply, nothing bounces.

## Imagery

There is none. That is the style. Photographs break suprematism immediately.

## Components

- **Buttons** — a solid rectangle of flat colour with a plain label, optionally angled slightly.
- **Nav** — small plain links in a corner; a solid square may mark the active item.
- **Cards** — replaced by a form plus adjacent text.
- **Forms (inputs)** — thin underlines in black, label above, no boxes.
- **Section markers** — a single form, repeated with varying colour and angle.

## Do

- Keep the void dominant.
- Give each screen one large form and one or two smaller counterweights.
- Keep text horizontal and quiet.
- Mark decorative forms `aria-hidden`.

## Don't

- Don't introduce photography, texture or gradient.
- Don't align forms into a tidy grid.
- Don't rotate text.
- Don't let forms obscure or reduce contrast on any text.

## How Weave verifies it

Deterministic checks measure the unpainted proportion of each viewport, inspect decorative
elements for solid fills and absent borders, read rotation transforms for the required angle
range, confirm no image requests are made, check the type stack and alignment, read transition
durations, and assert decorative nodes carry `aria-hidden`. The judged check asks whether the
forms read as floating in a void or as blocks arranged in a layout.

Reference pictures: `demo-design/suprematism/`.
