# To Be Discussed

> Open questions not yet decided. Move each to `current-info.md` once resolved.

_Last updated: 2026-09-30_

## Needs a decision before the phase that uses it

| # | Question | Needed by | Proposal |
|---|---|---|---|
| ~~1~~ | Do the five metric definitions hold — in particular, does design-approval count as human intervention? | V2.1 | **Decided (V2.1):** it does not. `design-approval` and `pre-release` are mandatory control points. |
| ~~2~~ | Are requirements scoped per run or per project? | V2.1 | **Decided (V2.1):** per project, versioned with the IR. |
| ~~3~~ | Which policy packs are on by default versus opt-in? | V2.2 | **Decided (V2.2):** `web-security` + `a11y` on; `seo` + `performance` opt-in. |
| ~~4~~ | Does a `severity: blocking` pack item fail the run or open a gate? | V2.2 | **Decided (V2.2):** opens a `policy` gate; approving is a recorded waiver. |
| ~~5~~ | Deploy target for the demo: Vercel, Netlify or Cloudflare Pages? | V2.4 | **Decided (V2.4):** Vercel — `VercelDeployer`, token in the release env only (#63). |
| 6 | Name and licence before any public launch. | before launch | `weave` on npm belongs to Weights & Biases. Decide after the demo. |
| 7 | **How Weave should look and work** — your description, then questions. | before D0 | The design discussion started 2026-09-30 (#75–#83); you were about to explain it. |
| ~~8~~ | The website URL for screenshot intake. | D6 | **Decided (#86):** the ai-robots Unitree Go2 page. |
| ~~9~~ | The robot model: a CC0 candidate I shortlist, or yours. | D4 | **Decided (#87):** Unitree's Go2 mesh, BSD-3-Clause. |
| ~~10~~ | Benchmark size (pairs). | D7 | **Decided (#109):** 3 pairs. |
| ~~11~~ | The new device's OS. | setup | **Decided (#88):** no new device — this Linux machine only. |
| 12 | Jev API key (`TYPESAFE_API_KEY`) on this machine. | D8 | You add it; not set as of 2026-09-30. |

Struck-through rows are settled; they stay here for one phase so the reasoning is easy to find.

## Blocked on access or data

- **#8 — confidence thresholds.** The framework is implemented; real per-type values need
  calibration data from logged `(name, confidence, outcome)`. Since V2.4 the decision layer is in
  the run path (`risk.classifyOperation` on every node diff), so the first credentialed run starts
  the corpus. **No real entries yet.**
- **#10 / #57 — Jev.** Provider routing is implemented and the parity harness is specified.
  **Docs received (#84); key not yet on this machine.** The seam needs widening to Jev's shape:
  several typed questions per call (Choice, Score, Noul), probabilities kept in the corpus. Noul
  has no confidence, so how a Noul feeds the escalation ladder is decided when the adapter is built.

## Design system

- **`terminal-ui` has no reference pictures.** The six originally filed under `ascii-art` all
  turned out to belong to the editorial character-rendering style. It needs its own: box-drawn
  panels, phosphor on near-black, an 80-column measure, status output.
- **`demo-design/` is mostly empty** — 5 of 91 folders have pictures. Reference **links** are now
  recorded for 87 styles (D3, #98); `bold-editorial`, `maximalism`, `minimalism` and
  `terminal-ui` have none, because the Pinterest list has no entry for them.
- **Style-check coverage (#97):** 110 of 674 deterministic checks have a rendered-page runner, 39
  of them able to pass. The rest (texture, imagery, layout composition, per-element rules) stay
  pending. Text over images or gradients needs a pixel-sampling contrast check.
- **No webfonts are bundled (#96):** each style's type shows only where its families are
  installed. Bundling licensed fonts per style is the upgrade.

## Carried engineering gaps

These are recorded in `implementation-v2.md` against the phase that fixes them, listed here so
they are not lost:

- ~~Evidence is a string array, not typed records linked to criteria~~ — shipped in V2.1.
- ~~**Two definitions of evidence coverage**~~ — one definition since V2.5 (#65).
- ~~**Parallel path:** conflict attempts not persisted; budget only checked sequentially~~ — fixed
  in V2.3.
- **Demo coverage is 7/11 requirements**, against the V2.1 exit criterion of no orphaned
  requirement. The demo's repair is scripted (an `<h1>` in a fragment, caught by the real check),
  not yet the natural failure of #46 from a real agent — needs the first credentialed run.
- `weave packs add <name>` is in the V2.2 plan but not in the CLI; packs are selected in the brief.
- **V2.4 ceilings.** The egress proxy binds only clients that honour `HTTPS_PROXY` (a network
  namespace is the upgrade); the OS sandbox is Linux-only; a real `claude` has not yet run inside
  bubblewrap, only a stand-in; the decision layer's `llm` tier keeps the verdict for want of a
  second classifier; a failing live check after deploy is recorded, not rolled back.
- **Default egress allowlist is narrow** (`api.anthropic.com` + loopback, observed — #93). Loopback stays open for dev servers, so a process on the user's machine listening on localhost is reachable by an agent's shell; a network namespace is the upgrade. An agent that runs
  `pnpm add` is refused the registry — which is also a risky-op. Decide whether the registry
  belongs on the default list once a real run shows how often it matters.
- ~~`listGates()` spans runs~~ — latest run by default since V2.5 (#66).
- ~~**`ClaudeDecision` predates the SDK**~~ — decided (#80): decisions go through the subscription on
  Opus 5.5; the API provider moves to the SDK for API mode. Kept below for the reasoning:
  it uses raw `fetch` and a forced tool call on
  `claude-sonnet-5`. That is valid there, but Opus 5.5 and Sonnet 5.5 reject forced tool use, and
  the documented default model is `claude-opus-5-5`. Moving it to the SDK with structured outputs
  changes the model — and so the cost — of every decision; that is a choice to make, not a cleanup.
- **The benchmark has never run.** It needs real agent runs (cost ≈ runs × 2 builds). Its
  scorers are installed and proven since D2 (#95).
- **`demo-design/` has pictures for 6 of 91 styles**, so the MCP picture resources are thin.
- ~~`browser-qa` and `visual-qa` are marked `skipped`~~ — wired in V2.7 (#73, #74).
- **V2.7 ceilings.** ~~Raster and 3D optimisation need sharp / gltf-transform~~ and ~~the Chrome
  CLI cannot see console errors~~ — closed in D2 (#95). Still open: rasters are re-encoded, not
  resized to their pixel budget; video and fonts are budgeted by size only.
- ~~**3D needs a renderer.**~~ — the scaffold bundles model-viewer (D4, #99).
- ~~The example brief's `logo.svg`~~ — line dropped (#109).
- **The natural failure (#46) has not happened for real yet.** D5's six agents all passed first
  time. The failures the real runs did produce were Weave's own (an un-ignored `dist/`, a turn
  that never ended), now fixed. The story's repair moment is still the demo's scripted case.
- **Wall-clock turn timeouts count sleep.** A laptop that sleeps mid-turn makes the turn "time
  out" on wake. The turn is interrupted and repaired, but the attempt is spent.
- ~~The IR has no home for the guides' `shape`, `motion` and `spacing` tokens~~ — V2.6 (#68).
- `ingest --changed` uses working-tree dirty files rather than a persisted since-last-ingest diff,
  and deletions leave stale code nodes.

## Resolved (see `current-info.md`)

v1 items #1–#41, and V2 items #42–58: identity, V2 scope, sequencing, demo as acceptance test,
natural demo failure, agent-runtime stance, boundary enforcement, packs, scaffold, style
selection, the design system, guide-versus-pictures precedence, `.agent/` in git, repo privacy,
and the docs convention.
