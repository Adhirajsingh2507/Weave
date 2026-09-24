---
slug: brutalism
title: Brutalism
aliases: [web brutalism, raw html]
status: ready
summary: The web with its clothes off — system fonts, default links, visible structure, zero polish, and it loads instantly.
best_for: [personal sites, manifestos, zines, developer tools, archives, art projects]
avoid_for: [commerce, enterprise trust-building, anything selling comfort]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFFFF" }
      - { name: ink, value: "#000000" }
      - { name: link, value: "#0000EE" }
      - { name: visited, value: "#551A8B" }
      - { name: alert, value: "#FF0000" }
      - { name: surface, value: "#D9D9D9" }
  typography:
    scale: default
    families:
      - { role: system, family: "Times New Roman, Georgia, serif", weights: [400, 700] }
      - { role: mono, family: "Courier New, ui-monospace, monospace", weights: [400] }
    heading_tracking_em: 0
    heading_line_height: 1.1
    body_size_px: 16
    body_line_height: 1.4
    measure_ch: 90
  layout:
    system: centered
    density: compact
    max_width_px: 760
    section_spacing_px: [16, 24, 40]
    alignment: document flow, minimal CSS
  shape:
    radius_px: 0
    border_px: 2
    shadow: none
  motion:
    duration_ms: 0
    easing: none
    properties: []
    intensity: none
  imagery:
    treatment: [unoptimised-looking photos, screenshots, scans, GIFs]
    illustration: none
    icons: text characters and dingbats
checks:
  - { id: brut.type.system-only, rule: "no webfonts are loaded; only system font stacks", kind: deterministic }
  - { id: brut.shape.radius-zero, rule: "every computed border-radius is 0px", kind: deterministic }
  - { id: brut.shape.no-shadow, rule: "no box-shadow anywhere including hover states", kind: deterministic }
  - { id: brut.color.no-gradient, rule: "no gradients; flat colour only", kind: deterministic }
  - { id: brut.link.underlined, rule: "links are underlined and use the link/visited colours", kind: deterministic }
  - { id: brut.motion.none, rule: "no CSS transitions or animations are declared", kind: deterministic }
  - { id: brut.perf.weight, rule: "total page weight under 300KB including images", kind: deterministic }
  - { id: brut.structure.semantic, rule: "page is readable with CSS disabled, in correct document order", kind: deterministic }
  - { id: brut.feel.raw, rule: "the page reads as deliberately raw, not as a broken or unfinished build", kind: judged }
---

# Brutalism

## The look in one paragraph

A document, not an interface. Times New Roman, blue underlined links, black rules, a 760px
column, and no attempt to be pleasant. Structure is exposed rather than styled: headings look
like headings because they are, and the page works with CSS switched off. It is fast, honest,
and slightly hostile.

## Layout

- One narrow column, left-aligned, in normal document flow. Margins are small and blunt.
- Sections separated by `<hr>` rules or plain space, not by cards.
- Tables look like tables. Lists look like lists. Nothing is restyled to look like an app.

## Typography

- System faces only: a serif for reading, monospace for anything technical. No webfonts, ever.
- Headings are simply larger and bold. No tracking, no case transforms, no display sizing.
- Body at 16px, `1.4` line height, measure allowed to run wide — up to 90 characters.

## Colour

White, black, and browser-default link colours: `#0000EE` unvisited, `#551A8B` visited. Red
for warnings. A flat grey surface where a block genuinely needs separation. No accent palette.

## Surface and depth

None. 2px black borders when a boundary is needed, otherwise nothing. No radius, no shadow,
no hover elevation.

## Motion

Zero. No transitions, no scroll effects, no loading animation. Interactions happen instantly
because nothing is animating them.

## Imagery

Screenshots, scans, diagrams and GIFs, placed inline at their natural size. Images are not
cropped to a golden ratio or given rounded corners.

## Components

- **Buttons** — `<button>` with a 2px black border, or a plain underlined link.
- **Nav** — a line of underlined links separated by pipes or slashes.
- **Cards** — don't exist. Use a heading and a paragraph.
- **Forms** — native controls with visible labels and borders; no custom styling.
- **Footer** — a rule, a line of text, maybe an email address.

## Do

- Keep the HTML semantic enough to read without CSS.
- Let links look like links.
- Ship under 300KB.
- Use the ugly default when the default works.

## Don't

- Don't load a webfont "just for the headings".
- Don't add a transition, a shadow or a radius.
- Don't fake rawness with a heavy framework underneath — brutalism that ships 2MB of JavaScript is a costume.
- Don't sacrifice the focus ring or contrast; raw is not inaccessible.

## How Weave verifies it

Deterministic checks scan network requests for font files, read computed radii, shadows,
transitions and gradients across the DOM, confirm link styling and colours, total the transferred
bytes, and re-render with stylesheets disabled to confirm the document still reads in order. The
judged check distinguishes deliberate rawness from something that merely looks broken.

Reference pictures: `demo-design/brutalism/`.
