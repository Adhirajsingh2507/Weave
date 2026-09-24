---
slug: corporate-memphis
title: Corporate Memphis
aliases: [alegria, big tech illustration, flat people]
status: ready
summary: Friendly flat illustration with oversized limbs and bright brand colours — the reassuring house style of modern software.
best_for: [SaaS marketing, fintech onboarding, HR and benefits, help centres, internal tools]
avoid_for: [luxury, fashion, anything wanting to look distinctive or premium]
inherits: _base.md
tokens:
  colors:
    mode: light
    palette:
      - { name: background, value: "#FFFFFF" }
      - { name: surface, value: "#F5F7FB" }
      - { name: ink, value: "#1B1F2A" }
      - { name: muted, value: "#5C6478" }
      - { name: brand, value: "#4B6EF5" }
      - { name: accent-warm, value: "#FF8A5B" }
      - { name: accent-mint, value: "#3ECF9B" }
  typography:
    scale: default
    families:
      - { role: sans, family: "Inter, Poppins, system-ui, sans-serif", weights: [400, 600] }
    heading_tracking_em: -0.02
    heading_line_height: 1.2
    body_size_px: 17
    body_line_height: 1.6
  layout:
    system: centered
    density: comfortable
    columns: 12
    max_width_px: 1200
    section_spacing_px: [56, 88, 128]
    pattern: alternating text-left/illustration-right sections
  shape:
    radius_px: 14
    border_px: 1
    shadow: "0 6px 20px rgba(27, 31, 42, 0.08)"
  motion:
    duration_ms: 220
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    properties: [opacity, transform]
    intensity: friendly
  imagery:
    treatment: [flat vector illustration, limited palette, no faces or simplified faces]
    illustration: figures with oversized limbs, geometric props, flat shadows
    icons: 2px rounded line or flat filled
checks:
  - { id: cm.illustration.flat, rule: "illustrations are flat vector with no gradients or photographic detail", kind: deterministic }
  - { id: cm.illustration.palette, rule: "illustrations use the same palette tokens as the interface", kind: deterministic }
  - { id: cm.layout.alternating, rule: "feature sections alternate illustration side rather than repeating one arrangement", kind: deterministic }
  - { id: cm.shape.soft, rule: "cards and controls use the 14px radius and soft low-opacity shadows", kind: deterministic }
  - { id: cm.a11y.illustration-alt, rule: "decorative illustrations are hidden from assistive tech; informative ones have alt text", kind: deterministic }
  - { id: cm.type.simple, rule: "one sans family at 2 weights, sentence case throughout", kind: deterministic }
  - { id: cm.content.specific, rule: "headings state a specific outcome rather than generic phrases like 'Empower your team'", kind: judged }
  - { id: cm.feel.distinct, rule: "the page still carries some brand personality rather than being indistinguishable from every other SaaS site", kind: judged }
---

# Corporate Memphis

## The look in one paragraph

The reassuring default of modern software marketing: white space, one brand colour with two
friendly accents, soft rounded cards, and flat illustrations of people with long bendy limbs
doing abstract tasks. It is clear, safe and instantly legible — and it is also the most
generic style in this collection, so the work is in the specifics.

## Layout

- 12 columns at 1200px, centred, with alternating feature sections: text left / illustration
  right, then reversed.
- Comfortable spacing (56–128px), a card grid for features, and a full-width CTA band.
- Predictability is a feature here; the layout should be immediately familiar.

## Typography

- One sans at 400/600, sentence case throughout. Headings at `1.2` line height with slight
  negative tracking.
- Body 17px at `1.6`, in muted grey for secondary text.
- No display face, no uppercase, no decorative type.

## Colour

White and a near-white surface, dark ink, one brand hue for primary actions and two friendly
accents used mainly inside illustrations. Everything else is neutral.

## Surface and depth

Soft: 14px radius, 1px hairline borders, low-opacity shadows. Nothing dramatic — depth is just
enough to separate a card from the page.

## Motion

Friendly: 220ms fades and small rises on scroll, cards lifting slightly on hover. Nothing
springy or attention-seeking.

## Imagery

Flat vector illustration with a strictly limited palette matching the interface: figures with
oversized limbs and simplified or absent faces, geometric props, flat cast shadows. Product
screenshots sit in rounded frames.

## Components

- **Hero** — headline, one supporting line, primary and secondary action, illustration beside it.
- **Feature row** — alternating illustration and text blocks.
- **Card grid** — three or four cards with an icon, a heading and one line.
- **Logo strip** — customer logos in grey, evenly spaced.
- **CTA band** — brand-coloured full-width block with one action.

## Do

- Keep illustration palette identical to the interface palette.
- Alternate section arrangements so the page has rhythm.
- Write specific headings with real outcomes.
- Keep one primary action per section.

## Don't

- Don't let illustrations drift into a second palette.
- Don't use generic filler copy — the style can't carry it.
- Don't add gradients or heavy shadows.
- Don't leave decorative illustrations exposed to screen readers.

## How Weave verifies it

Deterministic checks inspect SVG illustrations for flat fills and palette membership, compare
section arrangements for alternation, read radii and shadow values, verify illustration
accessibility attributes, and check the type system. Two judged checks look at the copy — whether
headings say something specific — and whether the page retains any brand personality, which is
this style's real failure mode.

Reference pictures: `demo-design/corporate-memphis/`.
