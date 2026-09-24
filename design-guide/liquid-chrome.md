---
slug: liquid-chrome
title: Liquid Chrome
aliases: [molten metal, mercury, chrome type]
status: ready
summary: Mirror-polished metal poured into type and objects — banded highlights, sharp reflections and a cold, expensive sheen.
best_for: [fashion and sneaker drops, music, luxury tech, crypto, album and event art]
avoid_for: [content-heavy sites, healthcare, anything warm or approachable]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: base, value: "#0A0A0C" }
      - { name: surface, value: "#141418" }
      - { name: foreground, value: "#F5F6F8" }
      - { name: muted, value: "#8E9096" }
      - { name: chrome-hi, value: "#FFFFFF" }
      - { name: chrome-mid, value: "#A7ADB8" }
      - { name: chrome-lo, value: "#3A3E47" }
      - { name: tint, value: "#6E8BFF" }
    gradients:
      - { name: chrome, value: "linear-gradient(175deg, #FFFFFF 0%, #A7ADB8 22%, #3A3E47 38%, #E9ECF2 52%, #6E7480 70%, #FFFFFF 100%)" }
  typography:
    scale: display
    families:
      - { role: display, family: "Monument Extended, Clash Display, Arial Black, sans-serif", weights: [700, 800] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 500] }
    heading_tracking_em: -0.03
    heading_line_height: 0.95
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: centered
    density: comfortable
    max_width_px: 1200
    section_spacing_px: [72, 112, 160]
  shape:
    radius_px: 999
    secondary_radius_px: 14
    border_px: 1
    shadow: "0 18px 50px rgba(0,0,0,0.65)"
  motion:
    duration_ms: 500
    easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    properties: [background-position, transform, opacity]
    intensity: flowing
  imagery:
    treatment: [3D chrome renders, liquid metal blobs, studio reflections on black]
    illustration: metallic 3D objects
    icons: solid with a chrome gradient fill
checks:
  - { id: chrome.gradient.banded, rule: "chrome gradients contain at least 5 stops with sharp light-dark transitions", kind: deterministic }
  - { id: chrome.usage.limited, rule: "chrome fill is applied to display type and hero objects only, never to body text or large panels", kind: deterministic }
  - { id: chrome.a11y.text-fallback, rule: "chrome-filled text has a solid-colour fallback and still meets 4.5:1 where it is real text", kind: deterministic }
  - { id: chrome.color.neutral-ground, rule: "the ground stays near-black and desaturated; only the tint colour may appear", kind: deterministic }
  - { id: chrome.motion.sheen, rule: "chrome animation moves background-position rather than re-rendering gradients", kind: deterministic }
  - { id: chrome.shape.pill-or-soft, rule: "controls are fully rounded; panels use the 14px radius", kind: deterministic }
  - { id: chrome.image.dark-studio, rule: "imagery is shot or rendered on dark ground with visible specular highlights", kind: deterministic }
  - { id: chrome.feel.metal, rule: "surfaces read as polished metal, not as grey gradients", kind: judged }
---

# Liquid Chrome

## The look in one paragraph

Mercury poured into letterforms. A near-black studio ground, a headline filled with a banded
chrome gradient that flips from white to near-black and back, and one or two rendered metal
objects catching a hard specular highlight. Cold, glossy and expensive, with very little else
on the page.

## Layout

- Centred, 1200px, generous spacing. This style needs emptiness to read as a studio.
- One chrome object or word per section, large, with room around it.
- Content is otherwise plain: quiet type on dark ground.

## Typography

- An extended heavy display face for the chrome moments, set tight (`-0.03em`, `0.95`).
- A plain sans for everything else, in near-white or muted grey.
- Chrome fill is used on display type only. Body text is solid colour, always.

## Colour

Neutral and cold: near-black base, dark surfaces, and the chrome ramp. The ramp is what makes
metal read — white, mid grey, near-black, bright again, in quick succession. One optional cool
tint reflects into the highlights.

## Surface and depth

Controls are fully rounded pills; panels use a 14px radius. Depth is a deep soft shadow plus a
1px top highlight, as though the object sits on black perspex.

## Motion

Flowing: 500ms, the sheen travelling across chrome by animating `background-position`, objects
rotating slowly. Never animate the gradient definition itself — move the fill.

## Imagery

3D chrome renders, liquid metal blobs, studio-lit product shots on black with hard specular
highlights. Everything is reflective; nothing is matte.

## Components

- **Buttons** — pills with a chrome or solid light fill, dark label on chrome, deep shadow.
- **Nav** — minimal dark bar; the wordmark may be chrome, links are plain.
- **Cards** — dark surfaces with a 1px top highlight and a soft shadow.
- **Hero object** — a single rendered metal form, centred, slowly rotating.
- **Inputs** — dark fill, hairline border, cool tint focus ring.

## Do

- Keep chrome for one or two elements per page.
- Use a banded multi-stop gradient with abrupt light-dark jumps.
- Keep the ground dark and desaturated.
- Give the chrome object empty space to reflect into.

## Don't

- Don't fill body text or large panels with chrome.
- Don't use a smooth two-stop grey gradient — that reads as plastic.
- Don't add warm colours.
- Don't animate gradients by recomputing them each frame.

## How Weave verifies it

Deterministic checks parse gradient declarations for stop count and luminance jumps, list which
elements carry the chrome fill and flag body text or large panels, verify a solid fallback
colour and measure contrast on real text, sample the ground for saturation, read which property
the sheen animation targets, check radii against the tokens, and inspect imagery for dark
backgrounds with specular highlights. The judged check asks whether it reads as metal.

Reference pictures: `demo-design/liquid-chrome/`.
