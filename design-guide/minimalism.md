---
slug: minimalism
title: Minimalism
aliases: [modern minimal, reductive design, restraint]
status: ready
summary: Restraint and space as the whole argument — in light, true-dark, grainy or soft-gradient form, with one idea per screen.
best_for: [product marketing, portfolios, agencies, fashion and retail, pricing pages, documentation]
avoid_for: [dense dashboards, marketplaces, anything with genuinely complex navigation]
inherits: _base.md
variants:
  - id: light
    summary: Near-white ground, ink text, flat surfaces. The default reading of the style.
    ground: "#FFFFFF to #F7F7F5"
    references: [01-fashion-monochrome-full-page, 02-coffee-white-full-page, 06-dot-matrix-type-full-page, 07-botanical-editorial-full-page]
  - id: true-dark
    summary: Near-black or pure black ground with light text; separation by hairline and space, not stacked grey cards.
    ground: "#000000 to #0B0B0B"
    references: [04-true-dark-particle-landscape, 09-hud-annotated-three-variants]
    see_also: oled-black
  - id: grain
    summary: Light or dark ground carrying a dither, grain or halftone texture across the whole page.
    ground: "any, plus texture at 3-18% opacity"
    references: [03-dither-texture-hero, 05-grain-monochrome-collage]
    see_also: blurred-grainy
  - id: soft-gradient
    summary: A muted gradient field as ground, with translucent surfaces floating on it.
    ground: "desaturated gradient, saturation <= 45%"
    references: [08-soft-gradient-glass-cards, 10-glass-card-3d-render]
    see_also: aurora
tokens:
  colors:
    mode: both
    palette:
      - { name: background, value: "#FFFFFF" }
      - { name: surface, value: "#F7F7F5" }
      - { name: foreground, value: "#1A1A1A" }
      - { name: muted, value: "#8A8A85" }
      - { name: accent, value: "#1A1A1A" }
      - { name: hairline, value: "#E6E6E2" }
      - { name: dark-ground, value: "#0B0B0B" }
      - { name: dark-foreground, value: "#EDEDED" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Inter, Söhne, system-ui, sans-serif", weights: [400, 500] }
      - { role: technical, family: "dot-matrix or monospace display face, optional", weights: [400] }
    heading_tracking_em: -0.025
    heading_line_height: 1.1
    body_size_px: 17
    body_line_height: 1.6
    measure_ch: 68
  layout:
    system: centered
    density: spacious
    max_width_px: 1080
    section_spacing_px: [80, 128, 192]
  shape:
    radius_px: 6
    border_px: 1
    shadow: none
  motion:
    duration_ms: 220
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform]
    intensity: subtle
  imagery:
    treatment: [one strong image per section, generous margins, muted or monochrome tones]
    illustration: none, single-line, or particle and dot-field work
    icons: 1.5px line, rounded ends
checks:
  - { id: min.color.count-max, rule: "at most 5 painted colours per view, photography excluded", kind: deterministic, applies_to: [all] }
  - { id: min.type.one-family, rule: "one text family for body and headings; the technical face is optional and display-only", kind: deterministic, applies_to: [all] }
  - { id: min.type.second-face-limited, rule: "if a dot-matrix or technical face is used, it appears only in display lines and labels, never in body copy", kind: deterministic, applies_to: [all] }
  - { id: min.layout.space, rule: "at least 40% of the first viewport is unpainted ground", kind: deterministic, applies_to: [all] }
  - { id: min.layout.spacing-scale, rule: "section spacing uses only the section_spacing_px steps", kind: deterministic, applies_to: [all] }
  - { id: min.layout.measure, rule: "body text measure stays between 60 and 75 characters", kind: deterministic, applies_to: [all] }
  - { id: min.content.one-action, rule: "at most one primary call to action per viewport", kind: deterministic, applies_to: [all] }
  - { id: min.hierarchy.not-colour, rule: "hierarchy comes from scale, weight and space; colour never encodes rank", kind: deterministic, applies_to: [all] }
  - { id: min.light.flat, rule: "light variant: no gradients and no shadows beyond a hairline", kind: deterministic, applies_to: [light] }
  - { id: min.dark.ground, rule: "true-dark variant: ground luminance below 12%", kind: deterministic, applies_to: [true-dark] }
  - { id: min.dark.no-grey-stacks, rule: "true-dark variant: separation by hairline and space, not stacked grey cards", kind: deterministic, applies_to: [true-dark] }
  - { id: min.dark.text-not-pure-white, rule: "true-dark variant: body text sits just below pure white to limit halation", kind: deterministic, applies_to: [true-dark] }
  - { id: min.grain.opacity, rule: "grain variant: texture overlay between 3% and 18% opacity", kind: deterministic, applies_to: [grain] }
  - { id: min.grain.contrast, rule: "grain variant: contrast is measured with the texture applied and still meets 4.5:1", kind: deterministic, applies_to: [grain] }
  - { id: min.gradient.muted, rule: "soft-gradient variant: gradient saturation stays at or below 45% and fades to the ground", kind: deterministic, applies_to: [soft-gradient] }
  - { id: min.gradient.surface-contrast, rule: "soft-gradient variant: text on translucent surfaces meets 4.5:1 against the rendered backdrop", kind: deterministic, applies_to: [soft-gradient] }
  - { id: min.feel.intentional, rule: "the page reads as deliberately spare, not unfinished or empty", kind: judged, applies_to: [all] }
---

# Minimalism

## The look in one paragraph

Take everything out, then put back only what earns its place. One typeface, a tiny palette,
and hierarchy built from scale and space rather than colour. What changes between projects is
the *ground* — white paper, true black, grain, or a soft gradient field — not the discipline.
Every border, shadow, icon and divider still has to justify itself, and most can't.

## Variants

Pick one per project and stay in it. The shared rules above apply to all four; each variant
adds its own.

| Variant | Ground | Notes |
|---|---|---|
| **light** | near-white | Flat. No gradients, no shadows beyond a hairline. |
| **true-dark** | near-black or pure `#000` | Light text just below pure white. Separation by hairline and space, never stacked grey cards. For the full treatment see `oled-black`. |
| **grain** | either, plus texture | Dither, grain or halftone across the whole page at 3–18%. Contrast gets re-measured with it applied. |
| **soft-gradient** | muted gradient field | Desaturated, fading to ground, with translucent surfaces on top. Push further and it becomes `aurora` or `glass-morphism`. |

## Layout

- Single centred column up to 1080px, with space around it that would feel wasteful anywhere
  else — 80px between related blocks, 128–192px between sections.
- One idea per section, one focal element per viewport.
- Alignment is left, consistently. Centred text only for a short hero line.

## Typography

- One sans, two weights. Headings tight (`-0.025em`, `1.1` line height) and large; body 17px at
  `1.6`.
- The jump between heading and body is big — 3× or more. That gap is the hierarchy.
- A **technical display face** — dot-matrix, stencil, monospace — is permitted as a second role
  for headline lines and small labels. It is a texture, not a typeface for reading, so body copy
  stays in the sans.
- Measure stays 60–75 characters. Long lines are the most common failure of this style.

## Colour

Five painted colours at most: ground, one surface, ink, a muted secondary, a hairline. The
accent is usually the foreground colour itself — a black button on white, or a white button on
black. If a hue is introduced, it appears once per page.

## Surface and depth

Flat in the light, grain and true-dark variants: sections separate by space, a background swap
or a hairline — never by a card with a shadow. The soft-gradient variant is the one exception,
where translucent surfaces may float over the gradient field, and then contrast must be measured
against what is actually rendered behind the text.

## Motion

220ms ease-out, opacity and small translation only. Content may fade up on first scroll, once.
No hover scaling, no parallax, no scroll-jacking. Particle or gradient fields may drift slowly,
and stop under reduced-motion.

## Imagery

One strong image beats four weak ones. Full-bleed or comfortably inset, muted, nothing cropped
tightly. Monochrome and duotone photography suit every variant; particle and dot-field
illustration suits true-dark especially. Icons are thin line work, used only where a word would
be slower.

## Components

- **Buttons** — solid ink fill or a hairline outline, 6px radius, generous padding, sentence-case
  label.
- **Nav** — wordmark left, three or four text links right, no background until scrolled.
- **Cards** — background swap and space, or a hairline border. No shadows outside the
  soft-gradient variant.
- **Forms** — hairline-bottom inputs, label above, plenty of vertical room.
- **Technical labels** — optional dot-matrix or mono, uppercase, tracked, for metadata and
  annotation.

## Do

- Choose a variant and keep to it for the whole project.
- Delete a section rather than shrinking it.
- Let the hero hold one sentence and one action.
- Use weight, not colour, to emphasise.

## Don't

- Don't mix variants — a grain hero above a glass section reads as indecision.
- Don't set body copy in the technical face.
- Don't fill the space you just made.
- Don't use thin greys below 4.5:1 for body text; sparse still has to be readable.

## How Weave verifies it

The run declares which variant is in play, and the checks split accordingly. Shared checks count
painted colours, font families and roles, measure unpainted viewport area, spacing steps, text
measure and primary actions per viewport. Variant checks then test the ground: flatness for
light, luminance and text colour for true-dark, texture opacity plus re-measured contrast for
grain, and gradient saturation plus backdrop-measured contrast for soft-gradient. The judged
check asks whether the page looks deliberately spare or simply unfinished.

Reference pictures: `demo-design/minimalism/`, tagged by variant in its `sources.md`.
