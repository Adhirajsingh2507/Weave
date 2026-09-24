---
slug: ascii-art
title: ASCII Art
aliases: [aski, character art, text-mode imagery, ASCII rendering]
status: ready
summary: Photographs translated into grids of characters, set inside modern editorial layouts — the technique is retro, the design around it is not.
best_for: [music and event posters, design studios, culture and archive projects, album art, developer brands with taste]
avoid_for: [dense product UI, long-form reading, ecommerce product detail]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#F4F2ED" }
      - { name: ink, value: "#121212" }
      - { name: char, value: "#1B1B1B" }
      - { name: muted, value: "#7C7A75" }
      - { name: accent-a, value: "#1B3FD8" }
      - { name: accent-b, value: "#E8243F" }
  typography:
    scale: display
    families:
      - { role: display, family: "Didot, Bodoni Moda, Playfair Display, serif", weights: [400, 700] }
      - { role: grotesque, family: "Helvetica Neue, Archivo, Inter, sans-serif", weights: [400, 700] }
      - { role: mono, family: "IBM Plex Mono, ui-monospace, monospace", weights: [400] }
    heading_tracking_em: -0.02
    heading_line_height: 1.0
    body_size_px: 16
    body_line_height: 1.6
    label_tracking_em: 0.08
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1240
    section_spacing_px: [56, 96, 144]
    composition: one character-rendered subject per section, corner labels, generous margins
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 600
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [opacity, clip-path]
    intensity: resolving
  imagery:
    treatment: [photographs converted to character or dot grids, partial dissolves, halftone screens]
    illustration: character-rendered subjects over paper or photographic grounds
    icons: simple line or glyph, never character-built
  render:
    ramp: "dense to sparse, e.g. @ % # S ? * . (dark to light)"
    cell_aspect: "monospace cell, consistently sized across a page"
checks:
  - { id: ascii.render.character-grid, rule: "character art sits on a consistent monospace cell grid; cell size is uniform within one piece", kind: deterministic }
  - { id: ascii.render.density-tone, rule: "denser glyphs map to darker areas of the source image, following one ramp", kind: deterministic }
  - { id: ascii.type.display-not-mono, rule: "display headings use the serif or grotesque role; monospace is never the headline face", kind: deterministic }
  - { id: ascii.type.mono-support, rule: "monospace is used for captions, labels and metadata only", kind: deterministic }
  - { id: ascii.ground.not-terminal, rule: "the ground is light, textured or photographic; a black terminal ground belongs to terminal-ui", kind: deterministic }
  - { id: ascii.color.limited, rule: "at most 2 ink colours over the ground, or one ink over a full-colour photograph", kind: deterministic }
  - { id: ascii.a11y.art-alternative, rule: "character art is hidden from assistive technology and carries a text alternative naming the subject", kind: deterministic }
  - { id: ascii.a11y.contrast, rule: "text overlapping character art meets 4.5:1 against the rendered pixels behind it", kind: deterministic }
  - { id: ascii.responsive.locked, rule: "character art renders as an image, SVG or locked grid so it never reflows into garbage at 360px", kind: deterministic }
  - { id: ascii.feel.conversion, rule: "the art reads as a photograph translated into characters, not as a monospace theme", kind: judged }
---

# ASCII Art

## The look in one paragraph

A photograph is run through a character ramp until it becomes a grid of glyphs — dense marks
where the image was dark, sparse where it was light — and that rendering is then placed into a
perfectly contemporary poster: a Didone serif headline, small tracked labels in the corners,
wide margins, paper texture. The technique is thirty years old; nothing else on the page is.

## Layout

- Asymmetric, 1240px, one character-rendered subject per section with room around it.
- Poster logic: a dominant headline, the rendered subject, and small mono labels parked at the
  margins — date, index, credit.
- The rendering may bleed off an edge or sit inside a generous field of paper.
- A partial dissolve is often stronger than a full conversion: the subject readable as a photo
  at one end, resolving into characters at the other.

## Typography

- The headline is a **high-contrast serif** or a **heavy grotesque** — never the monospace.
  This is the single decision that separates the style from a terminal.
- Monospace appears at small sizes: captions, credits, timestamps, index numbers, with open
  tracking.
- Body copy at 16px in the grotesque, on plain ground.

## Colour

Warm paper and near-black characters is the default. Two inks is the loud version — blue
characters with red display type on cream, for instance. Over a photograph, the characters take
a single ink and let the photo supply the colour.

## Surface and depth

Flat print. No radii, shadows or gradients. Depth is the character grid itself: density reads
as tone, so the rendering carries its own modelling.

## Motion

Resolving: 600ms, the art arriving character-block by character-block via a `clip-path` wipe,
or a photo dissolving into its character version once on entry. It resolves and then stops —
no looping scramble.

## Imagery

Photographs with strong tonal range convert best; flat lighting turns to mush. Choose a ramp of
six to ten glyphs and keep it consistent across the page. Portraits, flowers, hands, birds,
machinery all work because their silhouettes survive the loss of detail.

## Components

- **Rendered subject** — the centrepiece: an image or SVG of the character grid, with a text
  alternative naming what it depicts.
- **Headline** — serif or grotesque, large, tight, ordinary DOM text.
- **Corner label** — mono, uppercase, tracked, carrying index or credit.
- **Caption** — mono, small, muted, beneath the rendering.
- **Buttons and nav** — plain and contemporary; the interface never joins the conceit.

## Do

- Keep one glyph ramp per page and map density to tone.
- Set headlines in the serif or grotesque.
- Give every rendering a text alternative.
- Let a partial dissolve show the source photograph.

## Don't

- Don't set the headline, navigation or body copy in monospace.
- Don't use a black terminal ground — that's `terminal-ui`.
- Don't let live text reflow inside a character grid on small screens.
- Don't loop a scramble animation; it resolves once.

## How Weave verifies it

Deterministic checks measure the character cell grid for uniformity, sample the rendering
against its source tone to confirm the density ramp, map font roles to elements and flag
monospace headlines, sample the page ground to separate this from the terminal style, count ink
colours, confirm the art is hidden from assistive technology with an alternative present,
measure contrast where text overlaps the art, and re-render at 360px to catch reflow. The judged
check asks whether it reads as a converted photograph.

Reference pictures: `demo-design/ascii-art/`.
