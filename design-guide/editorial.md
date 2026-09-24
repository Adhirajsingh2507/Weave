---
slug: editorial
title: Editorial
aliases: [magazine layout, publication style]
status: ready
summary: Magazine craft on screen — a serif voice, dramatic headline scale, columns, pull quotes and captions that carry weight.
best_for: [long-form content, essays, news, research, brand storytelling, newsletters]
avoid_for: [app dashboards, transactional flows, dense data tools]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: paper, value: "#FBFAF7" }
      - { name: ink, value: "#16130F" }
      - { name: muted, value: "#6E6A63" }
      - { name: rule, value: "#D8D3C8" }
      - { name: accent, value: "#9A2B1F" }
      - { name: highlight, value: "#F0E7D4" }
  typography:
    scale: display
    families:
      - { role: serif, family: "Canela, Freight Text, Georgia, serif", weights: [400, 600] }
      - { role: sans, family: "Inter, Untitled Sans, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.015
    heading_line_height: 1.05
    body_size_px: 19
    body_line_height: 1.65
    measure_ch: 66
  layout:
    system: grid
    density: comfortable
    columns: 12
    max_width_px: 1240
    text_column_px: 680
    section_spacing_px: [40, 72, 112]
  shape:
    radius_px: 0
    border_px: 1
    shadow: none
  motion:
    duration_ms: 180
    easing: "cubic-bezier(0.2, 0, 0, 1)"
    properties: [opacity]
    intensity: minimal
  imagery:
    treatment: [documentary photography, full-bleed openers, captioned figures]
    illustration: editorial illustration, one per article
    icons: minimal, text-first
checks:
  - { id: ed.type.serif-body, rule: "body copy uses the serif role at >= 18px", kind: deterministic }
  - { id: ed.type.measure, rule: "text column stays within 60-72 characters", kind: deterministic }
  - { id: ed.type.scale-jump, rule: "article headline is at least 3x body size", kind: deterministic }
  - { id: ed.layout.text-column, rule: "running text is capped near 680px even inside a wider grid", kind: deterministic }
  - { id: ed.content.captions, rule: "every figure has a visible caption element", kind: deterministic }
  - { id: ed.content.metadata, rule: "articles show byline, date and reading time", kind: deterministic }
  - { id: ed.shape.no-cards, rule: "article content is not wrapped in shadowed or rounded cards", kind: deterministic }
  - { id: ed.color.accent-sparing, rule: "the accent appears only on links, drop caps and section marks", kind: deterministic }
  - { id: ed.feel.hierarchy, rule: "the page reads like a publication spread, with a clear entry point and secondary stories", kind: judged }
---

# Editorial

## The look in one paragraph

The page behaves like a printed spread: a large serif headline, a standfirst, a byline, then
a single well-set column of text with figures and pull quotes breaking the rhythm. Paper-warm
background, ink-dark type, one restrained accent. Everything serves reading.

## Layout

- 12-column grid at 1240px, but running text is confined to a 680px column regardless.
- The opener earns the full width: full-bleed image or a headline that spans eight columns.
- Pull quotes, figures and sidenotes hang into the margin, breaking the column deliberately.
- Related articles sit in a two- or three-column grid at the foot, smaller in every way.

## Typography

- Serif for reading, sans for the furniture: labels, captions, metadata, nav.
- Headline at `1.05` line height and `-0.015em` tracking, 3×+ body size. Standfirst sits
  between the two, lighter and wider.
- Body at 19px, `1.65` line height, 66 characters. Drop caps and small caps are welcome.
- Captions are sans, small, muted, and always present.

## Colour

Warm paper (`#FBFAF7`) rather than white, ink rather than black, a muted grey for captions, a
hairline rule for separation, and one accent — a restrained red — for links, drop caps and
section markers.

## Surface and depth

No cards, no shadows, no radius. Separation comes from hairline rules and generous space. A
highlight tint may sit behind a sidebar, nothing more.

## Motion

Nearly none. 180ms opacity transitions, no motion on scroll beyond a progress indicator.
Reading is not an animation opportunity.

## Imagery

Documentary photography with real captions and credits, sized to the grid, occasionally
full-bleed for an opener. One editorial illustration per article is plenty.

## Components

- **Article header** — kicker, headline, standfirst, byline with date and reading time.
- **Pull quote** — serif, large, hanging into the margin, with a hairline above and below.
- **Figure** — image plus sans caption plus credit, never in a card.
- **Footnotes/sidenotes** — margin-placed on wide screens, inline collapsible on mobile.
- **Index cards** — for article lists: headline, kicker, thumbnail, separated by rules.

## Do

- Keep one column for reading no matter how wide the screen is.
- Caption every image.
- Use rules and space instead of boxes.
- Let the headline be genuinely big.

## Don't

- Don't set long text in the sans role.
- Don't wrap articles in rounded shadowed cards.
- Don't animate text in on scroll.
- Don't let the accent colour spread beyond links and marks.

## How Weave verifies it

Deterministic checks read computed styles for the body font role and size, measure the rendered
text measure and column width, compare headline size to body size, assert every `<figure>` has a
`<figcaption>`, look for byline/date/reading-time elements, and flag shadows or radii on article
containers. The judged check asks whether the page reads like a publication spread rather than a
blog template.

Reference pictures: `demo-design/editorial/`.
