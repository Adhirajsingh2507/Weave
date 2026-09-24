---
slug: terminal-ui
title: Terminal UI
aliases: [tui, text-mode interface, phosphor terminal, console ui]
status: ready
summary: A page built out of characters — box-drawing frames, an 80-column monospace grid, phosphor text and a blinking cursor.
best_for: [developer tools, CLIs and terminals, status pages, documentation, hacker-culture sites]
avoid_for: [consumer commerce, image-led brands, anything with a non-technical audience]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: terminal-bg, value: "#0B0E0C" }
      - { name: phosphor, value: "#8FE388" }
      - { name: dim, value: "#4C7A4A" }
      - { name: foreground, value: "#D9E8D6" }
      - { name: amber, value: "#E8B84B" }
      - { name: alert, value: "#E8564B" }
  typography:
    scale: default
    families:
      - { role: mono, family: "IBM Plex Mono, JetBrains Mono, ui-monospace, monospace", weights: [400, 700] }
    heading_tracking_em: 0
    heading_line_height: 1.2
    body_size_px: 15
    body_line_height: 1.6
    character_grid: true
  layout:
    system: grid
    density: compact
    max_width_px: 960
    column_ch: 80
    section_spacing_px: [24, 48, 72]
  shape:
    radius_px: 0
    border_px: 0
    border_style: box-drawing characters
    shadow: none
  motion:
    duration_ms: 0
    easing: "steps(1, end)"
    properties: [opacity]
    intensity: cursor-only
  imagery:
    treatment: [character-built diagrams; no bitmaps by default]
    illustration: figures and diagrams drawn in characters
    icons: text glyphs
checks:
  - { id: term.type.mono-only, rule: "every text element uses the mono family", kind: deterministic }
  - { id: term.layout.char-grid, rule: "the content column is capped near 80 characters", kind: deterministic }
  - { id: term.border.box-drawing, rule: "frames are drawn with box-drawing characters, not CSS borders", kind: deterministic }
  - { id: term.a11y.art-labelled, rule: "character art sits in a figure with a text alternative and is hidden from screen readers", kind: deterministic }
  - { id: term.color.limited, rule: "at most 4 colours painted, from the terminal palette", kind: deterministic }
  - { id: term.shape.flat, rule: "no radius, no shadow, no gradient", kind: deterministic }
  - { id: term.responsive.reflow, rule: "character blocks scroll inside their own container rather than breaking the page at 360px", kind: deterministic }
  - { id: term.motion.cursor, rule: "the only animation is a cursor blink, and it rests solid under prefers-reduced-motion", kind: deterministic }
  - { id: term.feel.authentic, rule: "the page reads as a real terminal surface, not a themed website with a mono font", kind: judged }
---

# Terminal UI

## The look in one paragraph

The whole interface is made of characters. Frames are box-drawing corners and lines, headings
are banner text, diagrams are built from hashes and dots, and a block cursor blinks at the end
of the prompt. Phosphor green on near-black, one text size, and an 80-column measure that never
widens.

> Sibling style: `ascii-art` uses character rendering as an **image technique** inside modern
> editorial layouts — light grounds, serif headlines, colour. If the page has a serif headline,
> it isn't this style.

## Layout

- A character grid: one monospace size, 80 columns, everything aligned to character cells.
- Sections separated by rules made of line characters rather than CSS borders.
- Panels are boxes drawn with corner and line characters, padded by spaces.
- Character blocks that exceed the viewport scroll inside their own container — the page itself
  never scrolls sideways.

## Typography

- One monospace family, regular and bold. That's the entire type system.
- Headings are the same size as body text but bold, uppercase, or rendered as a banner.
- Body at 15px with `1.6` line height so the character grid stays readable.

## Colour

Terminal palette: near-black ground, phosphor green primary, a dim green for secondary text,
amber for highlights and red for errors. At most four colours on screen.

## Surface and depth

None. There are no CSS borders, shadows or radii — every frame is literally text. Emphasis
comes from bold, inversion (background and foreground swapped) or bracketed markers.

## Motion

A blinking block cursor, and typewriter reveal for short strings. Nothing else moves. The
cursor blink rests solid under reduced-motion.

## Imagery

Character-built diagrams only, by default. Every art block sits inside a `<figure>` with a real
text alternative, and the art itself is hidden from assistive technology so screen readers
don't announce a thousand punctuation marks.

## Components

- **Buttons** — bracketed labels such as `[ RUN ]`, inverted on hover, with a visible focus state.
- **Nav** — a single line of bracketed links separated by pipe characters.
- **Panels** — box-drawn frames with a title interrupting the top rule.
- **Inputs** — a prompt character followed by the field, with a block cursor.
- **Tables** — aligned with box-drawing characters and consistent column widths.
- **Progress** — a bracketed bar built from hashes and dashes with a percentage.

## Do

- Keep to one type size and an 80-column measure.
- Draw every frame with characters.
- Give character art a text alternative and hide it from screen readers.
- Let inversion carry emphasis.

## Don't

- Don't mix in a proportional typeface.
- Don't use CSS borders, radii or shadows.
- Don't let art blocks break the page layout on mobile.
- Don't rely on colour alone for state — this palette is nearly monochrome.

## How Weave verifies it

Deterministic checks confirm every text node resolves to the mono family, measure the rendered
column in characters, look for box-drawing characters where frames appear (and flag CSS
borders), check that preformatted art blocks carry a hidden role plus an accessible
alternative, count painted colours, and test 360px for page-level horizontal overflow. The
judged check asks whether it feels like a real terminal surface.

Reference pictures: `demo-design/terminal-ui/`.
