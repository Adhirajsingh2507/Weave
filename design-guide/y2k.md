---
slug: y2k
title: Y2K
aliases: [cyber-y2k, chrome aesthetic, millennium bug aesthetic]
status: ready
summary: Late-90s optimism rendered in chrome — glossy bevels, electric gradients, wide tracked display type, and stickers everywhere.
best_for: [music and artist sites, fashion drops, event pages, gaming, nostalgia-driven consumer brands]
avoid_for: [finance, healthcare, enterprise tools, anything that must read as sober]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: background, value: "#05060E" }
      - { name: surface, value: "#141830" }
      - { name: foreground, value: "#F2F5FF" }
      - { name: chrome-light, value: "#EDEFF4" }
      - { name: chrome-mid, value: "#9AA3AD" }
      - { name: chrome-dark, value: "#4A515C" }
      - { name: electric-blue, value: "#2B4BFF" }
      - { name: hot-pink, value: "#FF3BC8" }
      - { name: acid-lime, value: "#B6FF00" }
    gradients:
      - { name: chrome, value: "linear-gradient(180deg, #EDEFF4 0%, #9AA3AD 45%, #4A515C 55%, #EDEFF4 100%)" }
      - { name: cyber, value: "linear-gradient(135deg, #2B4BFF 0%, #FF3BC8 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Eurostile, Michroma, Orbitron, Arial Black", weights: [700] }
      - { role: sans, family: "Inter, Verdana, Tahoma, sans-serif", weights: [400, 600] }
    heading_tracking_em: 0.06
    heading_case: uppercase
    body_size_px: 16
    body_line_height: 1.5
  layout:
    system: centered
    density: compact
    max_width_px: 1120
    section_spacing_px: [40, 72, 112]
    overlap: stickers and panels may overlap section edges
  shape:
    radius_px: 16
    pill_radius_px: 999
    border_px: 2
    border_style: bevel (light top-left, dark bottom-right)
    shadow: "0 0 24px rgba(43, 75, 255, 0.45)"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    properties: [transform, opacity, filter]
    intensity: playful
  imagery:
    treatment: [chrome 3d objects, starbursts, lens flare, scanlines, grain]
    illustration: glossy 3d, sticker cutouts
    icons: filled, glossy, slightly bevelled
checks:
  - { id: y2k.color.gradients-present, rule: "at least 2 distinct gradients in the built CSS", kind: deterministic }
  - { id: y2k.color.accents-max, rule: "at most 3 accent hues besides the chrome ramp", kind: deterministic }
  - { id: y2k.shape.radius-min, rule: "primary surfaces use border-radius >= 12px; buttons are pills", kind: deterministic }
  - { id: y2k.shape.glow, rule: "interactive elements carry a coloured glow shadow, not a neutral drop shadow", kind: deterministic }
  - { id: y2k.type.display-tracking, rule: "display headings are uppercase with letter-spacing >= 0.04em", kind: deterministic }
  - { id: y2k.type.body-legible, rule: "body copy uses the sans role, not the display face, at >= 16px", kind: deterministic }
  - { id: y2k.a11y.contrast-on-gradient, rule: "text over gradients and chrome still meets 4.5:1 at its worst point", kind: deterministic }
  - { id: y2k.motion.reduced, rule: "marquee, autoplay, cursor trails and looping glints all stop under prefers-reduced-motion", kind: deterministic }
  - { id: y2k.feel.gloss, rule: "surfaces read as glossy and dimensional, not flat colour with rounded corners", kind: judged }
---

# Y2K

## The look in one paragraph

Everything looks manufactured: injection-moulded plastic, brushed chrome, glossy highlights,
and light leaking out of the UI. Type is wide, uppercase and technical. Elements behave like
stickers slapped onto the page, overlapping and tilting instead of sitting in tidy rows. The
mood is optimistic and a bit silly — the future as imagined in 1999, when it still felt fun.

## Layout

- Centred column, max 1120px, tighter than modern layouts — Y2K pages are dense, not airy.
- Panels are physical objects: bevelled edges, visible borders, sometimes rotated 1–3° and
  overlapping the section above.
- Stickers, badges and starbursts break out of containers on purpose. Keep them out of the
  way of text and off the edges of small screens.
- Backgrounds carry something: a mesh gradient, a faint scanline texture, a starfield. Never
  flat white.

## Typography

- Two faces: a wide technical display face (Eurostile, Michroma, Orbitron) for headlines and
  a plain sans for everything you have to read.
- Display type is uppercase, `0.06em` tracking, often with a chrome gradient fill and a thin
  dark outline. Chrome fill is for headlines only, never body copy.
- Body copy stays boring and legible at 16px+. Pixel faces are allowed for tiny labels only,
  at sizes where every pixel is intact.

## Colour

A dark navy-black base with a chrome ramp (light to mid to dark to light — the double
highlight is what makes it read as metal) and up to three electric accents: blue, hot pink,
acid lime. Accents glow: pair every accent fill with a matching blurred shadow.

## Surface and depth

Depth is the whole point. Bevels: light edge top-left, dark edge bottom-right, plus a gloss
highlight across the top third of a surface. Glows replace drop shadows — coloured, blurred,
no offset. Layer at most three depth effects on one element; past that it turns to mud.

## Motion

Springy and short: 260ms with an overshoot easing. Hover pops elements up and brightens the
glow. A marquee or a glinting chrome sweep is in character — both must stop completely under
`prefers-reduced-motion`, not merely slow down.

## Imagery

Chrome 3D objects, glossy blobs, starbursts, lens flares, early-web clip-art energy. Photos
get high contrast and a slight blue push. Grain and scanlines belong on backgrounds, not on
text.

## Components

- **Buttons** — pills with a chrome or gradient fill, 2px bevel border, coloured glow,
  uppercase label with wide tracking. Hover lifts and brightens.
- **Nav** — a floating bevelled bar, slightly inset from the top, with pill links and a lit
  active state.
- **Cards** — glossy panels, 16px radius, visible border, gradient or chrome header strip.
- **Forms** — inset fields (dark inner shadow), bright focus glow, chunky submit pill.
- **Badges/stickers** — rotated, bordered, high-contrast; used for prices, "new", counts.

## Do

- Commit to the gloss: bevel, highlight, glow, every time.
- Let a sticker or badge overlap a panel edge.
- Keep body copy in the plain sans, at readable size, on a solid enough backing.
- Use exactly one loud focal element per section.

## Don't

- Don't set paragraphs in the display face or in chrome gradient.
- Don't let a glow become the only focus indicator — the focus ring from `_base.md` still applies.
- Don't stack more than three effects on one element.
- Don't ship motion that can't be turned off.

## How Weave verifies it

Deterministic checks count gradients and accent hues in the built CSS, assert radii and glow
shadows on interactive elements, confirm display headings are uppercase with wide tracking
while body copy uses the sans role, and re-run contrast over the *actual* gradient behind each
text run rather than a flat approximation — that is where this style usually fails. Motion is
verified by rendering with `prefers-reduced-motion: reduce` and diffing two screenshots a
second apart: identical means motion really stopped. `y2k.feel.gloss` is judged from a
screenshot. Everything in `_base.md` still applies.

Reference pictures: `demo-design/y2k/`.
