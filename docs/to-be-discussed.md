# To Be Discussed

> Open questions not yet decided. Move each to `current-info.md` once resolved.

_Last updated: 2026-09-25_

## Needs a decision before the phase that uses it

| # | Question | Needed by | Proposal |
|---|---|---|---|
| ~~1~~ | Do the five metric definitions hold — in particular, does design-approval count as human intervention? | V2.1 | **Decided (V2.1):** it does not. `design-approval` and `pre-release` are mandatory control points. |
| ~~2~~ | Are requirements scoped per run or per project? | V2.1 | **Decided (V2.1):** per project, versioned with the IR. |
| ~~3~~ | Which policy packs are on by default versus opt-in? | V2.2 | **Decided (V2.2):** `web-security` + `a11y` on; `seo` + `performance` opt-in. |
| ~~4~~ | Does a `severity: blocking` pack item fail the run or open a gate? | V2.2 | **Decided (V2.2):** opens a `policy` gate; approving is a recorded waiver. |
| 5 | Deploy target for the demo: Vercel, Netlify or Cloudflare Pages? | V2.4 | Vercel; the MCP connection already exists. |
| 6 | Name and licence before any public launch. | before launch | `weave` on npm belongs to Weights & Biases. Decide after the demo. |

Struck-through rows are settled; they stay here for one phase so the reasoning is easy to find.

## Blocked on access or data

- **#8 — confidence thresholds.** The framework is implemented; real per-type values need
  calibration data from logged `(name, confidence, outcome)`. V2.4 starts producing it by putting
  the decision layer in the run path.
- **#10 / #57 — Jev.** Provider routing is implemented and the parity harness is specified.
  Waitlisted for early access. The seam also needs widening to Jev's shape: several typed
  questions per call, with choice, score and boolean-probability primitives.

## Design system

- **`terminal-ui` has no reference pictures.** The six originally filed under `ascii-art` all
  turned out to belong to the editorial character-rendering style. It needs its own: box-drawn
  panels, phosphor on near-black, an 80-column measure, status output.
- **`demo-design/` is mostly empty** — 5 of 91 folders have pictures.
  `pinterest_website_design_inspiration.html` holds 92 cards of links, one per style, which is the
  obvious source for filling the rest and for recording real source URLs in each `sources.md`.

## Carried engineering gaps

These are recorded in `implementation-v2.md` against the phase that fixes them, listed here so
they are not lost:

- Evidence is a string array, not typed records linked to criteria — V2.1.
- `listGates()` spans runs, so approving by index can pick a stale gate from an earlier run.
- `browser-qa` and `visual-qa` are marked `skipped`; the hybrid visual QA code exists but is
  unwired — V2.7.
- The IR has no home for the guides' `shape`, `motion` and `spacing` tokens — V2.6.
- `ingest --changed` uses working-tree dirty files rather than a persisted since-last-ingest diff,
  and deletions leave stale code nodes.

## Resolved (see `current-info.md`)

v1 items #1–#41, and V2 items #42–58: identity, V2 scope, sequencing, demo as acceptance test,
natural demo failure, agent-runtime stance, boundary enforcement, packs, scaffold, style
selection, the design system, guide-versus-pictures precedence, `.agent/` in git, repo privacy,
and the docs convention.
