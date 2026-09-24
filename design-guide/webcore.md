---
slug: webcore
title: Web 1.0 / Webcore
aliases: [web 1.0, geocities style, old web, netscape era]
status: ready
summary: The 1997 personal homepage — tiled backgrounds, table layouts, visitor counters, animated GIFs and a guestbook.
best_for: [personal sites, fan pages, zines, net-art, playful community projects, april launches]
avoid_for: [commerce, enterprise, anything claiming to be modern]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#000080" }
      - { name: page, value: "#C0C0C0" }
      - { name: ink, value: "#000000" }
      - { name: link, value: "#0000FF" }
      - { name: visited, value: "#800080" }
      - { name: hot, value: "#FF00FF" }
      - { name: lime, value: "#00FF00" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Verdana, Tahoma, Geneva, sans-serif", weights: [400, 700] }
      - { role: serif, family: "Times New Roman, serif", weights: [400] }
      - { role: mono, family: "Courier New, monospace", weights: [400] }
    heading_tracking_em: 0
    heading_line_height: 1.2
    body_size_px: 16
    body_line_height: 1.5
  layout:
    system: centered
    density: compact
    max_width_px: 800
    section_spacing_px: [8, 16, 32]
    structure: centred content column with visible section dividers
  shape:
    radius_px: 0
    border_px: 3
    border_style: outset/inset bevel
    shadow: none
  motion:
    duration_ms: 0
    easing: none
    properties: []
    intensity: gif-only
  imagery:
    treatment: [tiled background patterns, animated GIFs, clip-art, under-construction signs]
    illustration: clip-art and dingbats
    icons: tiny GIF buttons and badges
checks:
  - { id: web1.layout.narrow-centred, rule: "content is a centred column no wider than 800px", kind: deterministic }
  - { id: web1.shape.bevel, rule: "panels use outset/inset bevel borders, not flat 1px lines", kind: deterministic }
  - { id: web1.color.web-safe, rule: "painted colours come from the web-safe style palette; links use blue/purple defaults", kind: deterministic }
  - { id: web1.type.system-classics, rule: "type is Verdana, Times or Courier; no webfonts loaded", kind: deterministic }
  - { id: web1.a11y.gif-motion, rule: "animated GIFs are paused or swapped for static frames under prefers-reduced-motion", kind: deterministic }
  - { id: web1.a11y.no-flash, rule: "no element flashes more than 3 times per second", kind: deterministic }
  - { id: web1.semantics.modern, rule: "the markup is semantic HTML; the table-layout look is achieved with CSS, not layout tables", kind: deterministic }
  - { id: web1.feel.authentic, rule: "the page reads as a genuine 1997 homepage rather than a modern site with pixel decorations", kind: judged }
---

# Web 1.0 / Webcore

## The look in one paragraph

A centred 800px column on a tiled background, grey bevelled panels, Verdana and Times mixed
without guilt, blue underlined links, an animated "under construction" GIF, a hit counter at
the bottom and a guestbook link. Charmingly ugly, and completely sincere.

## Layout

- One centred column, 800px maximum, with everything stacked vertically.
- Sections divided by `<hr>` rules, bevelled panels or a row of tiny GIF buttons.
- Sidebars, when present, look like table columns — implemented with CSS grid, not real layout
  tables.
- Content is dense: small margins, tight spacing.

## Typography

- Verdana for body, Times for headings or vice versa, Courier for anything technical. No
  webfonts.
- Headings are often centred and sometimes coloured. `<b>`-style bold emphasis is in character.
- Body at 16px minimum, even though 1997 would have used 12.

## Colour

Navy or tiled backgrounds, silver-grey page panels, black text, default blue and purple links,
plus shocking magenta and lime for highlights. Web-safe boldness, no subtlety.

## Surface and depth

Bevels: 3px outset borders on panels and buttons, inset on pressed states and input fields.
No radius, no soft shadows — depth is two-tone edges only.

## Motion

GIFs only: spinning icons, marching ants, blinking "new" badges. No CSS transitions. Under
reduced-motion, animated GIFs are replaced with a static first frame, and nothing flashes more
than three times a second.

## Imagery

Tiled background patterns (stars, clouds, bricks), clip-art, animated dividers, award badges,
webring banners, and a visitor counter. Images are small and unoptimised-looking.

## Components

- **Buttons** — grey bevelled rectangles with system-font labels, or 88×31 GIF badges.
- **Nav** — a centred row of text links separated by `|`, or a column of GIF buttons.
- **Panels** — bevelled grey boxes with a centred heading.
- **Forms** — native controls, inset borders, a plain submit button.
- **Footer** — hit counter, last-updated date, email link, webring navigation.

## Do

- Keep the column narrow and centred.
- Use bevels for every raised or inset surface.
- Include the period furniture: counter, last-updated, guestbook.
- Keep markup semantic underneath the retro look.

## Don't

- Don't use real layout tables — the look is retro, the code isn't.
- Don't load webfonts or use modern radii and shadows.
- Don't let GIFs flash past the safety limit.
- Don't break keyboard navigation with image-only links; every GIF button needs alt text.

## How Weave verifies it

Deterministic checks measure the content column width, read border styles for outset/inset
bevels, sample the palette and link colours, confirm no font files are requested, test GIF
behaviour and flash rate under forced reduced-motion, and inspect the DOM for layout tables
versus semantic markup with CSS grid. The judged check asks whether it reads as genuinely of
its era.

Reference pictures: `demo-design/webcore/`.
