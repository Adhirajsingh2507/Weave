---
slug: organic-blobs
title: Fluid / Organic Blobs
aliases: [blob design, fluid shapes, soft organic]
status: ready
summary: Soft irregular shapes, wavy section dividers and pastel gradients — friendly, rounded and deliberately unarchitectural.
best_for: [wellness and health, childcare and education, SaaS onboarding, community and non-profit]
avoid_for: [luxury, security and finance, technical tools, anything needing precision]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FDFBF7" }
      - { name: ink, value: "#23303B" }
      - { name: muted, value: "#6E7C88" }
      - { name: coral, value: "#FF8A7A" }
      - { name: mint, value: "#79D4B4" }
      - { name: butter, value: "#FFD98E" }
      - { name: lilac, value: "#B7A6F5" }
    gradients:
      - { name: blob, value: "linear-gradient(135deg, #FF8A7A 0%, #B7A6F5 100%)" }
  typography:
    scale: large
    families:
      - { role: sans, family: "Poppins, Nunito, DM Sans, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.01
    heading_line_height: 1.15
    body_size_px: 17
    body_line_height: 1.65
  layout:
    system: centered
    density: comfortable
    max_width_px: 1140
    section_spacing_px: [64, 104, 144]
    dividers: wavy or curved SVG section separators
  shape:
    radius_px: 24
    blob_radius: "42% 58% 63% 37% / 43% 38% 62% 57%"
    border_px: 0
    shadow: "0 16px 40px rgba(35, 48, 59, 0.10)"
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.45, 0, 0.35, 1)"
    properties: [transform, border-radius, opacity]
    intensity: floating
  imagery:
    treatment: [photos masked into blob shapes, soft pastel gradients, rounded illustration]
    illustration: friendly rounded characters and objects
    icons: rounded 2px with soft caps
checks:
  - { id: blob.shape.organic, rule: "at least 2 decorative elements use irregular border-radius or SVG blob paths", kind: deterministic }
  - { id: blob.shape.rounded-ui, rule: "all interactive containers use a radius of 20px or greater", kind: deterministic }
  - { id: blob.layout.wavy-dividers, rule: "section boundaries use curved or wavy separators rather than straight edges", kind: deterministic }
  - { id: blob.color.pastel, rule: "accent colours sit between 40% and 75% saturation; nothing neon", kind: deterministic }
  - { id: blob.a11y.contrast-on-pastel, rule: "text over pastel gradients and blobs meets 4.5:1", kind: deterministic }
  - { id: blob.motion.float, rule: "blob motion is 400ms or slower, loops gently, and stops under prefers-reduced-motion", kind: deterministic }
  - { id: blob.a11y.decorative, rule: "blob shapes are marked decorative and hidden from assistive technology", kind: deterministic }
  - { id: blob.feel.friendly, rule: "the page feels warm and approachable rather than generically bubbly", kind: judged }
---

# Fluid / Organic Blobs

## The look in one paragraph

Nothing on the page has a straight edge if it can be avoided. Irregular pastel blobs sit behind
content, sections are separated by waves rather than lines, photographs are masked into soft
shapes, and the type is a rounded geometric sans. It reads as friendly, unintimidating and
human — the visual opposite of a grid.

## Layout

- Centred, 1140px, comfortable spacing, with curved SVG dividers between sections.
- Blobs sit behind or beside content at low opacity, often bleeding off one edge.
- Composition alternates: image-blob left, text right, then reversed.

## Typography

- A rounded geometric sans (Poppins, Nunito, DM Sans) at 400/600.
- Headings at `1.15` line height, mild negative tracking, sentence case.
- Body 17px at `1.65` — generous, matching the soft feeling of the shapes.

## Colour

Warm off-white ground with pastel accents — coral, mint, butter, lilac — often as two-colour
gradients inside blobs. Ink is a soft blue-grey rather than black.

## Surface and depth

Generously rounded (24px+) cards with soft, wide, low-opacity shadows and no borders.
Decorative blobs use irregular `border-radius` values or SVG paths and are always marked
decorative.

## Motion

Floating: 500ms, blobs slowly morphing between radius values, cards rising gently on hover.
Morphing must animate `border-radius` or an SVG path, and stop under reduced-motion.

## Imagery

Photographs masked into blob shapes, friendly rounded illustration, soft pastel gradient fills.
Avoid hard rectangular images — they clash with everything else on the page.

## Components

- **Buttons** — fully rounded, pastel or gradient fill, soft shadow, sentence-case label.
- **Nav** — rounded floating bar, pale fill, no border.
- **Cards** — 24px radius, white fill on the warm ground, soft shadow, blob accent behind.
- **Inputs** — pill or 24px radius, pale fill, coloured focus ring.
- **Dividers** — SVG waves in the next section's colour.

## Do

- Mask imagery into soft shapes.
- Use wavy dividers between sections.
- Keep pastels soft — under 75% saturation.
- Mark blobs `aria-hidden`.

## Don't

- Don't mix sharp rectangles into the layout.
- Don't let pastel text drop under the contrast floor.
- Don't animate blobs quickly — this style is slow.
- Don't stack more than two gradients in one blob.

## How Weave verifies it

Deterministic checks look for irregular `border-radius` values or SVG blob paths, read radii on
interactive containers, detect curved section separators, convert accent colours to HSL and
check the saturation band, measure text contrast over rendered pastels, read animation duration
and reduced-motion behaviour, and confirm decorative shapes carry `aria-hidden`. The judged
check asks whether it feels warm rather than generically bubbly.

Reference pictures: `demo-design/organic-blobs/`.
