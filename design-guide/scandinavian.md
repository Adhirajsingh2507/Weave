---
slug: scandinavian
title: Scandinavian
aliases: [nordic design, hygge minimal]
status: ready
summary: Soft light, pale wood and off-white, muted accents and calm type — minimalism with warmth and no sharp edges.
best_for: [homeware, wellness, childcare, sustainable brands, boutique hotels, personal finance]
avoid_for: [nightlife, gaming, anything needing urgency or drama]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FAF7F2" }
      - { name: surface, value: "#F0EBE3" }
      - { name: ink, value: "#2A2A28" }
      - { name: muted, value: "#7D786F" }
      - { name: sage, value: "#9CB0A3" }
      - { name: clay, value: "#C8A392" }
      - { name: sky, value: "#AEC3D6" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Aktiv Grotesk, system-ui, sans-serif", weights: [400, 500] }
      - { role: serif, family: "Source Serif 4, Georgia, serif", weights: [400] }
    heading_tracking_em: -0.015
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: grid
    density: spacious
    columns: 12
    max_width_px: 1160
    section_spacing_px: [72, 112, 160]
  shape:
    radius_px: 10
    border_px: 1
    shadow: "0 1px 2px rgba(42, 42, 40, 0.06)"
  motion:
    duration_ms: 260
    easing: "cubic-bezier(0.25, 0.8, 0.35, 1)"
    properties: [opacity, transform]
    intensity: calm
  imagery:
    treatment: [natural light, pale wood, linen, plants, lots of negative space]
    illustration: simple line or soft shape
    icons: 1.5px line, rounded
checks:
  - { id: scandi.color.muted, rule: "no painted colour exceeds 45% saturation", kind: deterministic }
  - { id: scandi.color.warm-neutral, rule: "background and surfaces come from the warm neutral tokens, not pure white or grey", kind: deterministic }
  - { id: scandi.shape.soft, rule: "radii use the 10px token; no square corners on cards or inputs", kind: deterministic }
  - { id: scandi.shape.light-shadow, rule: "shadows stay under 8% opacity and 4px blur", kind: deterministic }
  - { id: scandi.layout.airy, rule: "section spacing uses the large steps; at least 40% of each viewport is unpainted", kind: deterministic }
  - { id: scandi.type.calm, rule: "at most 2 weights, no uppercase headings, no heavy display faces", kind: deterministic }
  - { id: scandi.image.light, rule: "photography is bright: mean luminance above 60%", kind: deterministic }
  - { id: scandi.feel.calm, rule: "the page feels calm and tactile rather than clinical", kind: judged }
---

# Scandinavian

## The look in one paragraph

Light-filled and quiet. Warm off-white ground, pale wood and linen in the photography, muted
sage and clay accents, soft 10px corners and shadows so light they barely exist. Type is calm
and mid-weight. It is minimalism that feels lived in rather than emptied out.

## Layout

- 12 columns at 1160px, spacious: 72–160px between sections.
- Content sits in comfortable blocks with lots of surrounding air; nothing is squeezed.
- Images are large and calm, often paired with a short paragraph rather than a headline.

## Typography

- A neutral sans at 400 and 500 for nearly everything, with an optional serif for quotes and
  editorial moments.
- Headings at `1.2` line height — looser than most minimal styles, which is what makes it feel
  unhurried. No uppercase, no heavy weights.
- Body 17px at `1.65`.

## Colour

Warm off-white background, a slightly deeper warm neutral for surfaces, soft ink text, and
desaturated accents: sage, clay, dusty sky. Nothing saturated past about 45%. Accents appear
as large calm areas rather than small bright marks.

## Surface and depth

Gently soft: 10px radius everywhere, 1px hairline borders, and shadows at 6% opacity with 2px
blur. Depth is suggested, never asserted.

## Motion

Calm: 260ms with a soft ease, fades and small rises. Nothing springs, nothing overshoots.

## Imagery

Natural daylight, pale wood, linen, ceramics, plants, and plenty of empty space inside the
frame itself. Bright exposure. People appear relaxed and mid-activity, never posed at camera.

## Components

- **Buttons** — soft-cornered, muted fill or hairline outline, medium weight label.
- **Nav** — transparent over the hero, then a warm off-white bar with a hairline underneath.
- **Cards** — surface fill on background, 10px radius, hairline border, whisper shadow.
- **Forms** — roomy inputs, soft corners, sage focus ring.
- **Section headers** — small muted label above a calm heading.

## Do

- Keep backgrounds warm rather than white or grey.
- Give photography room to breathe inside its own frame.
- Use one muted accent per section.
- Prefer a larger spacing step when unsure.

## Don't

- Don't use saturated or neon accents.
- Don't use square corners or hard shadows.
- Don't set headings in uppercase or heavy weights.
- Don't let muted greys drop below the contrast floor for body text.

## How Weave verifies it

Deterministic checks convert every painted colour to HSL and assert the saturation ceiling,
compare background tokens against pure white or neutral grey, read radii and shadow blur and
opacity, measure unpainted area and spacing steps, check heading case and weights, and compute
mean luminance of loaded images. The judged check asks whether the result is calm and tactile
or merely clinical and empty.

Reference pictures: `demo-design/scandinavian/`.
