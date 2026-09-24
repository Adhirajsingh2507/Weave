---
slug: grunge
title: Grunge
aliases: [90s grunge, distressed, xerox punk]
status: ready
summary: Photocopied and torn — distressed textures, ransom-note type, taped edges and a palette that looks left out in the rain.
best_for: [music and labels, streetwear, zines, festivals, skate and subculture brands]
avoid_for: [finance, healthcare, enterprise, luxury]
inherits: _base.md
tokens:
  colors:
    mode: dark
    palette:
      - { name: newsprint, value: "#CFC9BD" }
      - { name: dirt, value: "#1E1C19" }
      - { name: rust, value: "#8A3B1E" }
      - { name: moss, value: "#5A6141" }
      - { name: bleach, value: "#E6E2D8" }
      - { name: blood, value: "#7E1420" }
      - { name: tape, value: "#C8B98F" }
  typography:
    scale: display
    families:
      - { role: display, family: "Anton, Oswald, Impact, sans-serif", weights: [400, 700] }
      - { role: mono, family: "Courier New, ui-monospace, monospace", weights: [400] }
      - { role: sans, family: "Inter, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_case: uppercase
    heading_line_height: 0.92
    body_size_px: 16
    body_line_height: 1.55
  layout:
    system: asymmetric
    density: compact
    max_width_px: 1320
    section_spacing_px: [24, 56, 88]
    composition: torn paper layers, taped photos, uneven rotations up to 4 degrees
  shape:
    radius_px: 0
    border_px: 0
    border_style: torn and rough edges via masks
    shadow: "0 10px 24px rgba(0,0,0,0.55)"
  motion:
    duration_ms: 160
    easing: "steps(3, end)"
    properties: [transform, opacity, filter]
    intensity: rough
  imagery:
    treatment: [photocopy contrast, halftone noise, scratches, tape and staples, blown-out flash photos]
    illustration: stencil and marker scrawl
    icons: hand-cut, irregular
checks:
  - { id: grunge.texture.distress, rule: "a grain, scratch or photocopy texture overlays the page at 8-20% opacity", kind: deterministic }
  - { id: grunge.edges.torn, rule: "at least 2 elements use torn or rough masked edges rather than clean rectangles", kind: deterministic }
  - { id: grunge.type.mixed, rule: "headings mix at least 2 type roles in a ransom-note arrangement", kind: deterministic }
  - { id: grunge.layout.rotation, rule: "pasted elements are rotated between 1 and 4 degrees, varying per element", kind: deterministic }
  - { id: grunge.color.muted-dirty, rule: "palette is desaturated and earthy; no clean bright hues", kind: deterministic }
  - { id: grunge.a11y.readable-body, rule: "body copy sits on a clean area of the texture and meets 4.5:1", kind: deterministic }
  - { id: grunge.a11y.targets, rule: "rough-edged controls still expose a 44px rectangular hit area", kind: deterministic }
  - { id: grunge.feel.handmade, rule: "the page reads as physically assembled and photocopied rather than digitally filtered", kind: judged }
---

# Grunge

## The look in one paragraph

A flyer stapled to a telephone pole: photocopied to the point of falling apart, torn at the
edges, taped back together at a slight angle, with headline words cut from three different
typefaces. Dirty earth tones, heavy grain, and no straight edges anywhere.

## Layout

- Asymmetric and cramped at 1320px, with layers of torn paper stacked on a dark ground.
- Elements are rotated 1–4°, each differently, and taped down with visible tape strips.
- Sections overlap; the gap between them is often just a torn edge.

## Typography

- Ransom-note logic: headline words alternate between a condensed display face, typewriter mono
  and a plain sans, at varying sizes and rotations.
- Body copy stays in one readable sans on a clean patch of paper.
- Uppercase, tight (`0.92` line height), often with characters deliberately clipped by a torn
  edge — but never so far that a word becomes unreadable.

## Colour

Newsprint grey, dirt black, rust, moss, bleached white and dried blood red. Everything
desaturated, as if it has been outside. Clean bright hues break the style.

## Surface and depth

No borders or radii — edges are torn masks. Depth is physical stacking: paper on paper, tape on
top, photo corners lifting. Shadows are heavy and soft, as if lit by a bare bulb.

## Motion

Rough and stepped: 160ms in three frames, elements jittering slightly on hover like a shaky
photocopier feed. All jitter stops under reduced-motion.

## Imagery

Blown-out flash photography, photocopy-contrast portraits, scratched and folded scans, stencil
and marker scrawl. Halftone noise over everything.

## Components

- **Cards** — torn paper rectangles with tape strips at two corners.
- **Buttons** — stencil or stamped labels on a rough patch, with a clean 44px hit area behind
  the ragged art.
- **Nav** — a strip of torn tape across the top with hand-scrawled links.
- **Inputs** — plain fields on a clean paper patch; legibility beats texture here.
- **Dividers** — torn edges, staple marks, or a strip of tape.

## Do

- Vary rotation per element so nothing looks systematic.
- Keep one clean paper patch per section for reading.
- Layer physically: paper, photo, tape, staple.
- Keep the palette dirty.

## Don't

- Don't texture over body copy or form fields.
- Don't let a torn edge eat a word or an interactive label.
- Don't use clean bright colours or crisp shadows.
- Don't apply one global filter and call it grunge — the damage should look assembled.

## How Weave verifies it

Deterministic checks detect texture overlays and their opacity, look for mask or clip-based
rough edges, count type roles used within heading blocks, read per-element rotation values for
variance, convert the palette to HSL to confirm desaturation, measure contrast where body copy
sits, and compute hit-area rectangles for rough-edged controls. The judged check asks whether
the page reads as physically assembled.

Reference pictures: `demo-design/grunge/`.
