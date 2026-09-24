---
slug: mixed-media
title: Mixed Media
aliases: [multi-technique, layered media, photo-illustration hybrid]
status: ready
summary: Several techniques in one frame — photography with drawn marks, painted texture over vector shapes, type that crosses between them.
best_for: [arts and culture, fashion editorials, campaigns, music, brand storytelling]
avoid_for: [product UI, documentation, dashboards, anything needing consistency at scale]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: canvas, value: "#F4F1EA" }
      - { name: ink, value: "#17151A" }
      - { name: photo-neutral, value: "#8C8880" }
      - { name: paint-red, value: "#D8452F" }
      - { name: paint-blue, value: "#2E5BB8" }
      - { name: marker-yellow, value: "#F5C542" }
      - { name: graphite, value: "#4A474F" }
  typography:
    scale: display
    families:
      - { role: display, family: "Archivo, Anton, sans-serif", weights: [700, 900] }
      - { role: serif, family: "Georgia, Times New Roman, serif", weights: [400, 700] }
      - { role: hand, family: "Caveat, Kalam, cursive", weights: [400] }
    heading_tracking_em: -0.02
    heading_line_height: 0.98
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: asymmetric
    density: comfortable
    max_width_px: 1320
    section_spacing_px: [40, 80, 120]
    composition: layered techniques with one dominant per section
  shape:
    radius_px: 0
    border_px: 0
    border_style: mixed — torn, painted and clean edges together
    shadow: "0 8px 20px rgba(23, 21, 26, 0.18)"
  motion:
    duration_ms: 320
    easing: "cubic-bezier(0.33, 0, 0.2, 1)"
    properties: [transform, opacity, clip-path]
    intensity: layered
  imagery:
    treatment: [photography with drawn or painted intervention, scanned texture, cut-outs]
    illustration: drawn marks over photographic elements
    icons: mixed but consistent within a set
checks:
  - { id: mixed.techniques.count, rule: "at least 3 distinct techniques (photo, paint, drawing, vector, type) appear together", kind: deterministic }
  - { id: mixed.dominance.one, rule: "each section has one dominant technique, with the others supporting", kind: deterministic }
  - { id: mixed.texture.scan, rule: "at least one scanned or painted texture layer is present", kind: deterministic }
  - { id: mixed.type.crossing, rule: "typography interacts with imagery — passing behind or over a subject", kind: deterministic }
  - { id: mixed.a11y.readable-zone, rule: "body copy sits on a plain area with 4.5:1 contrast", kind: deterministic }
  - { id: mixed.a11y.alt, rule: "composite images have alt text describing the subject, not the technique", kind: deterministic }
  - { id: mixed.perf.assets, rule: "layered assets are flattened where possible; total section imagery under 1MB", kind: deterministic }
  - { id: mixed.feel.coherent, rule: "the layers read as one composed piece rather than as separate assets stacked", kind: judged }
---

# Mixed Media

## The look in one paragraph

A photograph with paint dragged across it, a drawn circle around a face, a vector shape behind
it all and a headline running half behind the subject. Several techniques in one frame, held
together by a consistent palette and one dominant technique per section. It looks made rather
than assembled.

## Layout

- Asymmetric at 1320px, composed per section rather than templated.
- Each section leads with one technique — a photographic section, a painted section, a drawn
  section — with the others playing support.
- Elements cross boundaries: a painted stroke running from one block into the next.

## Typography

- A heavy display face for headlines, a serif for quotes and captions, handwriting for
  annotations — three roles with clear jobs.
- Headlines interact with imagery: passing behind a subject, clipped by a painted edge.
- Body copy in a plain setting on a clean area of canvas.

## Colour

A warm canvas ground, neutral photographic tones, and a small set of paint colours — red, blue,
yellow — that appear as marks rather than fills. Graphite for drawn lines.

## Surface and depth

Mixed edges: a torn paper edge next to a clean vector shape next to a painted stroke. Small
shadows where a physical element sits above the canvas; none where a mark is part of the
surface.

## Motion

Layered: 320ms, individual layers arriving at slightly different times so the composition
assembles itself. Stops under reduced-motion.

## Imagery

Photography with drawn or painted intervention, scanned textures, cut-outs, and vector shapes
used as flat counterpoints. Scans of real marks beat digital brush presets.

## Components

- **Composite hero** — photo, paint, drawn mark and headline in one composition.
- **Annotated image** — a photograph with a drawn circle and a handwritten note.
- **Paint mark** — a scanned stroke used as a section accent or divider.
- **Reading block** — plain canvas area with clean type.
- **Buttons** — simple, clean, uncomposited, so they stay obvious.

## Do

- Choose one dominant technique per section.
- Use real scanned marks.
- Let type interact with imagery.
- Keep a plain zone for reading in every section.

## Don't

- Don't give every technique equal weight — that's noise.
- Don't composite the interface controls.
- Don't describe the technique in alt text instead of the subject.
- Don't ship many layered PNGs when one flattened asset works.

## How Weave verifies it

Deterministic checks classify section assets by technique and count distinct techniques per
composition, compare their rendered areas to identify a dominant one, detect scanned texture
layers, analyse type and image bounding boxes for interaction, measure contrast in reading zones,
check alt text content, and total imagery weight. The judged check asks whether the layers read
as one composed piece.

Reference pictures: `demo-design/mixed-media/`.
