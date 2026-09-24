---
slug: anti-design
title: Anti-Design
aliases: [ugly design, rule-breaking, dysfunctional aesthetic]
status: ready
summary: Every convention broken on purpose — clashing colour, arbitrary scale, collapsed hierarchy — while the page still works.
best_for: [art projects, fashion drops, music, zines, provocation campaigns]
avoid_for: [anything transactional, regulated, or used more than once by the same person]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#C7F400" }
      - { name: ink, value: "#1B1B1B" }
      - { name: clash-a, value: "#FF2E88" }
      - { name: clash-b, value: "#00E0C7" }
      - { name: clash-c, value: "#7A00FF" }
      - { name: dirt, value: "#8A7F5C" }
  typography:
    scale: display
    families:
      - { role: display, family: "Arial Black, Impact, sans-serif", weights: [700, 900] }
      - { role: serif, family: "Times New Roman, serif", weights: [400] }
      - { role: mono, family: "Courier New, monospace", weights: [400] }
    heading_tracking_em: -0.04
    heading_line_height: 0.85
    body_size_px: 16
    body_line_height: 1.45
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1600
    section_spacing_px: [8, 20, 64]
    composition: intentional misalignment within a hidden safe grid
  shape:
    radius_px: 0
    secondary_radius_px: 40
    border_px: 1
    shadow: "12px -6px 0 #7A00FF"
  motion:
    duration_ms: 90
    easing: "linear"
    properties: [transform, color]
    intensity: jarring
  imagery:
    treatment: [stretched photos, clip-art, screenshots of other interfaces, low-res crops]
    illustration: deliberately crude
    icons: mismatched sets on purpose
checks:
  - { id: anti.type.roles-clash, rule: "at least 3 type roles used in visibly clashing combinations", kind: deterministic }
  - { id: anti.layout.misalignment, rule: "elements deliberately break alignment, but none overflow the viewport horizontally", kind: deterministic }
  - { id: anti.color.clash, rule: "adjacent fills are from clashing hues, yet all text pairs still meet 4.5:1", kind: deterministic }
  - { id: anti.nav.reachable, rule: "primary navigation and the main action are reachable within one screen and by keyboard", kind: deterministic }
  - { id: anti.a11y.focus, rule: "focus order still follows a sensible reading path despite visual disorder", kind: deterministic }
  - { id: anti.a11y.motion, rule: "jarring motion stops entirely under prefers-reduced-motion", kind: deterministic }
  - { id: anti.function.forms, rule: "forms submit, validate and report errors normally", kind: deterministic }
  - { id: anti.feel.deliberate, rule: "the page reads as an intentional provocation, not as a broken layout", kind: judged }
---

# Anti-Design

## The look in one paragraph

Design conventions are broken one by one and in public: acid backgrounds, three fighting
typefaces, headings that collide with images, scale that makes no argument, shadows at the
wrong angle in the wrong colour. The trick is that usability survives — the thing you need is
still reachable, the form still submits, the keyboard still works. Ugly by choice, broken never.

## Layout

- Wide and cramped at once. Sections nearly touching, then a huge gap.
- Elements sit a few pixels off alignment on purpose, but a hidden safe grid keeps them inside
  the viewport with no horizontal scroll.
- Content order in the DOM stays logical even when visual position doesn't.

## Typography

- Three roles at minimum, chosen to clash: Arial Black, Times, Courier.
- Headings at `0.85` line height so lines overlap slightly. Tracking pulled tight to `-0.04em`.
- Body text remains a readable size — 16px minimum — because the provocation is visual, not a
  barrier to reading.

## Colour

An acid ground with clashing fills laid directly against each other. The one rule that holds:
every text and background pair is still measured for contrast. Clashing is allowed; illegible
is not.

## Surface and depth

Wrong on purpose: shadows offset upward or sideways in a saturated hue, borders inconsistent,
radii mismatched within one component set — a 0px corner next to a 40px one.

## Motion

Fast and jarring: 90ms linear jumps, colour flips on hover, elements that shift position
slightly. All of it disabled under `prefers-reduced-motion`.

## Imagery

Stretched and squashed photos, clip-art, screenshots of other websites, low-resolution crops
enlarged until the pixels show. Nothing is retouched.

## Components

- **Buttons** — mismatched shapes within the same page, but always ≥ 44px tall and obviously
  clickable.
- **Nav** — unconventional placement (mid-page, vertical, scattered), yet keyboard-reachable
  and present on every screen.
- **Cards** — inconsistent by design: one bordered, one filled, one floating.
- **Forms** — visually odd, functionally strict: real labels, real validation, real errors.

## Do

- Break one convention per element, not all of them at once.
- Keep the DOM order sane.
- Keep contrast and target sizes intact.
- Make the provocation legible as a choice.

## Don't

- Don't hide the primary action.
- Don't break keyboard navigation or focus order.
- Don't cause horizontal scrolling on mobile.
- Don't ship motion that can't be stopped.

## How Weave verifies it

This style inverts the usual check list: deterministic checks confirm the *disorder* is present
(multiple clashing type roles, deliberate misalignment, mismatched radii) while proving the
*function* survives — no horizontal overflow, contrast intact, focus order sensible, primary
action reachable, forms working, motion stoppable. The judged check asks whether the result
looks like an intentional provocation or an accident.

Reference pictures: `demo-design/anti-design/`.
