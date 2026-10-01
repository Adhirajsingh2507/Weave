# Demo Plan — making Weave demonstration-worthy

> The plan to take Weave from "proven with stand-ins" to a real, recorded demonstration for
> engineering leaders. Every choice below was asked and answered on 2026-09-30; nothing here is
> assumed. Anything still undecided is listed under **Open inputs** and will be asked, not guessed.

_Last updated: 2026-09-30_

## What was decided

| Question | Answer |
|---|---|
| Audience | **Engineering leaders** — governance, boundaries, evidence, metrics, benchmark |
| Format | **A real run recorded beforehand, then a live walkthrough** of its explorer page and gates |
| Length | No fixed slot — the plan covers a full tour; the runbook marks what to cut for shorter slots |
| Must be real | **Everything**: Claude agents building, a public deploy, benchmark numbers, screenshot intake, Jev, tools, design templates |
| Spending | **Measure one real build first**, report it, then you decide what else to spend |
| Benchmark size | **Decided after the first build**, once its real cost/usage is known |
| Agents' billing | **Your Claude subscription** — Weave stops passing `ANTHROPIC_API_KEY` into agents |
| Decision layer + vision | **Through your subscription**, via the `claude` CLI — no API key, no extra bill |
| Decision model | **Claude Opus 5.5**; if your plan refuses or rate-limits it, **Weave stops and asks** — no silent switch |
| Jev | Access and **docs received** (#84); everything incl. diffs may be sent (#85) |
| 3D rendering | **Bundle Google's model-viewer** into the scaffold, so models render offline and under the allowlist |
| Robot model | **Unitree's Go2 mesh** (`unitree_ros`, BSD-3-Clause, notice credited), assembled and simplified to budget (#87) |
| Tools | **Project devDependencies** (Playwright, Lighthouse, axe, sharp, gltf-transform; gitleaks via a download step) |
| Design templates | **Styled for real**, **style checks run on the rendered page**, reference pictures as **links only** |
| Screenshot intake | **The ai-robots Unitree Go2 page** (#86) — design read only |
| Recording | **A one-command script + a runbook with talking points**; you record it |
| Deploy | Vercel (CLI already logged in), project **`weave-robotics-demo`**, the generated site's code **private** |
| App | **The robotics landing page** (decision #45) |
| Two ways to run (#75) | **Subscription mode** and **API mode** (same agents, API billing) |
| Agents (#76–#79) | **tmux, one window per agent, own folder**; watch **and** step in; your messages count as interventions; repairs continue in the same session; permissions automatic |
| Benchmarks (#81) | Free open-source scorers; builds on the subscription |
| Platforms (#82) | Linux, macOS, Windows/WSL2; **macOS sandbox** to be built; new device OS undecided |
| Repository (#83) | Private; docs pushed now and after every phase |

## Open inputs (asked when the phase needs them)

1. **Your description of how Weave should look** — the design discussion in progress.
2. **Benchmark size** — after the first build's usage is known.
3. **`TYPESAFE_API_KEY`** on this machine — before D8.

Settled 2026-09-30: the site (#86), Jev docs (#84, #85), the robot model (#87), this device only (#88).

Nothing else is needed from you: no API key, no new accounts.

## Phases

Each phase ends with something runnable and checked, as every V2 phase did. Phases D0–D4 cost
nothing beyond your normal machine; D5 onward uses your subscription.

### D0 — Preflight: `weave doctor`

One command that says whether this machine can run the real demo, before anything is spent:
`claude` logged in (and which plan), Opus 5.5 reachable through it, Vercel CLI logged in,
bubblewrap working, Chrome present, each devDependency installed, gitleaks present, the
egress allowlist reaching what the subscription login needs, `TYPESAFE_API_KEY` present (#84).

- Stop passing `ANTHROPIC_API_KEY` into agent environments (decided).
- Verify which hosts the subscription login actually contacts, and allowlist exactly those —
  observed from the egress record of a real call, not guessed.
- **Exit:** `weave doctor` passes on your machine, or names each failing item and how to fix it.
- **Done 2026-09-30.** Observed: the isolated subscription call contacts `api.anthropic.com`
  only (#93). Found and fixed: agents inherited the owner's MCP servers and plugins (#89).
  `weave doctor` on this machine: login (Pro), Opus 5.5, egress, Vercel, bubblewrap and Chrome
  pass; the five tools and gitleaks fail with their fix (D2); Jev key is marked for D8.

### D1 — Decision layer and vision through your subscription

- A `ClaudeCodeDecision` provider: runs `claude -p` headless with the decision's schema,
  validates the JSON (Zod), retries once on invalid output, records the model that answered.
- A `ClaudeCodeVision` provider for screenshot intake and visual QA: the CLI reads the image
  file; same validation.
- Opus 5.5 pinned; unavailable or rate-limited → a gate saying so (decided).
- Keep the API providers, moved to the SDK with structured outputs, switchable by one setting
  for when you have API credits.
- **Exit:** a check drives both providers with a stand-in `claude` binary; one real call each on
  your machine, logged to the corpus.
- **Done 2026-09-30** (#94). Real calls on this machine, all answered by Opus 5.5: a decision
  (6.9s, in the corpus with the model), visual-QA facts (14.7s) and screenshot intake (13.4s) on
  the Go2 page. Found by the real call, not the stand-in: the CLI rejects Zod's `$schema` URI.

### D2 — Tools installed and wired

- devDependencies: Playwright (+ Chromium), Lighthouse, axe (via Playwright), sharp,
  gltf-transform. gitleaks through a pinned download step.
- Playwright becomes the default browser worker (console errors, full-page captures); Chrome CLI
  stays as the fallback.
- Optimisation becomes real: sharp for rasters, gltf-transform for 3D; budgets measured after.
- CI installs the same set plus bubblewrap, so every push proves the sandbox and the real render.
- **Exit:** CI green with every "not verified here" branch now verified.
- **Done 2026-09-30** (#95). CI run 36738064526: sandbox (bubblewrap, `.env` unreadable), the
  real Chrome render and all six tools run for real; `WEAVE_REQUIRE_TOOLS=1` makes any
  unverified branch fail. `weave doctor` on this machine: **Ready** (Jev key marked for D8).

### D3 — Design templates for real

- **Styled for real:** the scaffold turns each guide's tokens into working CSS — surfaces,
  colours, type families and scale, spacing, radius, borders, motion — so all 91 styles render
  visibly different pages from the same markup. A check renders each style and compares.
- **Style checks run:** a rendered-page checker (Playwright, computed styles) for the check
  families the guides use most — luminance, contrast, border width, radius, durations, font
  families, accent counts. Coverage reported honestly: how many of the 739 checks have a runner.
- **Reference pictures as links:** each style's `sources.md` gets its links from the Pinterest
  list; MCP serves them as links (decided: no images).
- **Exit:** the 91-style render check, and a coverage number for runnable checks.
- **Done 2026-10-01** (#96–#98). All 91 styles render the same markup as themselves: own
  background, text, heading face, radius and border, 91 distinct images, WCAG AA text on every
  theme (73 measured; 18 with a gradient behind the text are left for a pixel check). Coverage:
  **110 of 674 deterministic checks can fail on a render, 39 can also pass**; the rest stay
  pending. 87 styles carry reference links; 4 have no entry in the Pinterest list. Found by the
  render: unquoted font names dropped whole declarations; `tokens.css` wrote families as
  `[object Object]`; the static server crashed on a folder request.

### D4 — 3D that renders

- model-viewer bundled into the scaffold (`vendor/`), loaded locally; the context pack tells the
  placing agent how to use it.
- The robot model: Unitree's Go2 (#87) — URDF parts assembled into one glTF, simplified to
  2 MB / 100k triangles, BSD-3-Clause notice in the credits.
- Deploy headers: the scaffold emits a `vercel.json` with the security headers the live checks
  look for (they failed in the stand-in host) and a CSP that allows the bundled viewer only.
- **Exit:** a Playwright render shows the robot in the hero; visual QA judges it visible.
- **Done 2026-10-01** (#99–#102). `examples/assets/go2.glb`: Unitree's Go2 assembled from the
  pinned URDF by `scripts/go2-model.mjs`, standing, **951 KB / 80,786 triangles**, BSD-3-Clause
  notice in `go2.CREDITS.md`. The scaffold bundles model-viewer into `vendor/` and emits
  `vercel.json` (security headers + CSP). Real run on this machine: Playwright rendered the Go2 in
  the futuristic hero with no console errors under the CSP, and **real visual QA (Opus 5.5 via
  the subscription) judged it visible at 0.9**. `viewer.check` proves the render in CI (pixel
  spread, CSP clean) on a recorded reading. Found on the way: model-viewer fetches decoders from
  CDNs for meshopt/Draco models (so Weave quantises instead), and needs `'wasm-unsafe-eval'`; the
  web-security pack was scanning the vendored viewer as project source.

### D4.5 — Agents in tmux windows (#76–#79, #91)

- Subscription mode runs each agent as an interactive Claude Code session in its own tmux
  window, in its own worktree; you can attach, watch and type.
- Every message you type is recorded and counts as a human intervention; a repair is sent into
  the same session as the next message; permissions are automatic within the sandbox and
  ownership rules.
- **Exit:** a stand-in agent run in tmux windows end to end; one real window you attach to.
- **Done 2026-10-01** (#103–#106). `TmuxClaudeExecutor` is the default in subscription mode
  (`WEAVE_AGENTS=headless` for the one-shot path). `tmux.check` runs three agents in windows of one
  session: the hero fails once and is repaired by a message pasted into the same session, a
  message typed into the features window mid-turn is waited for and counted as one intervention,
  and windows close when their nodes finish. **Real run on this machine**: real Claude Code agents
  in tmux windows, inside bubblewrap, on the subscription, built a futuristic hero and home page
  (both first-pass; ~4 and ~2 minutes). Found by it: the trust dialog can take over 30s inside
  bubblewrap; agents open Chrome to check their work and Chrome's background calls were gating
  (#106); the a11y nav pattern failed every multi-line nav.

### D5 — The first real build (measured)

- `pnpm demo:real`: the robotics brief, real Claude Code agents on your subscription, the
  decision layer on Opus 5.5, sandbox on, concurrency 3.
- Report: time, number of agent sessions, retries, decision calls, usage as your plan shows it.
- Fix what it breaks — it will find defects no stand-in could.
- Capture the **natural failure** (#46) from the real agents, for the story.
- **Exit:** a completed real run, its explorer page, and a usage report → you decide the
  benchmark size.
- **Done 2026-10-01** (#107–#109). The robotics brief (logo line dropped, owner decision), real
  Claude Code agents in tmux windows inside bubblewrap on the Pro subscription, concurrency 3,
  decisions on Opus 5.5. **`weave usage`:** 11.9 min wall clock; 6 agent sessions, 6 attempts,
  **0 retries**; 0 interventions; agent tokens out 256k, cache read 3.86M, cache write 479k over
  124 model turns; 6 `risk.classifyOperation` calls (API-price equivalent $0.27, not billed);
  visual QA judged the Go2 visible. Parallelism 1.4×. **Run status done, autonomous.** Criteria:
  26 passed, 0 failed. **No natural failure occurred** — every node passed first time — so the
  story's repair moment still comes from the demo's scripted case (#46 stays open). Benchmark
  size was chosen before D5: 3 pairs.

### D6 — Screenshot intake and the public deploy

- Capture your chosen site with the browser worker; intake reads it with vision; uncertain
  fields gate; the build is styled from what was read.
- Pre-release approval deploys to Vercel project `weave-robotics-demo`; post-deploy checks run
  against the public URL.
- **Exit:** a public URL, deploy evidence, live checks passing.
- **Done 2026-10-01** (#112–#117), on the fourth real run. **https://weave-robotics-demo.vercel.app**
  — six viewport captures of the Go2 site, vision read them, three uncertain readings (layout,
  type scale, the style suggestion `futuristic` with alternatives) gated; 9 agent sessions, 0
  retries, 33.1 min; a real **risky-op gate** (an agent reached for `registry.npmjs.org`: refused,
  held, and judged risky at 0.62 by the decision layer); visual QA judged the Go2 visible;
  deployed by Weave to the public alias; **post-deploy checks 12 passed, 0 failed**. Gates were
  approved with `--yes` by Claude on the owner's behalf (the owner asked for one go).
  What the first three runs found, all fixed: an existing `.gitignore` left `dist/` tracked and
  failed every node; a turn folded with a queued message never ended; sections' scripts were not
  shipped; live checks graded Vercel's login page (the per-deployment URL is protected); the
  build reused the reference's headlines and brand, against #86. The second run produced the
  first **natural failure repaired for real** (#46): the hero agent did not place `go2.glb`, the
  placement check failed it, and the same session fixed it.

### D7 — The benchmark

- Plain `claude -p` session vs governed Weave run, same brief and guide, N pairs (your number),
  scored by Lighthouse, axe, gitleaks and `pnpm audit` only.
- Published as-is, including the runs Weave loses.
- **Exit:** `bench/benchmark.md` with mean ± sd and head-to-head.

### D8 — Jev

- Docs received (#84): widen the `Decision` seam to Jev's shape, write the adapter, run the
  parity harness against the real corpus from D5–D7 (agreement and calibration per decision type).
- Switch the decision types that pass parity; the rest stay on Claude, and the report says which.
- **Exit:** a parity report; at least one decision type served by Jev in a real run.
- **Built 2026-10-01, real run waiting on the key** (#110). `JevDecision` (`POST /v1/systemone`,
  Bearer key, pinned `jev-1.13.0`, one Choice per decision with literal per-type instructions and
  criteria, state trimmed to the 32k window, 429/529 backoff then `ModelUnavailableError`) and
  `ask()` for several typed questions in one call. `weave parity [--write]` replays the corpus and
  judges each type on agreement (≥ 95%) and ECE (≤ 0.05), needing 20 entries; `--write` records
  the passing types in `.agent/policies/providers.json`, and `adapterDeps` routes exactly those
  to Jev when `TYPESAFE_API_KEY` is set. `jev.check` proves it against a stand-in of the API.
  **Not done:** the real parity run and a real Jev-served decision — no key on this machine
  (owner: "not yet"). The corpus so far has only `risk.classifyOperation` entries.

### D9 — The recording kit

- `pnpm demo:real` as one command, idempotent, resumable if interrupted.
- A runbook: setup, what to click, what to say, where each proof lives, what to cut for a
  shorter slot, and fallbacks if something misbehaves live.
- A dry run by you, and fixes from it.
- **Built 2026-10-01** (#111). `pnpm demo:real` — doctor, a fresh workspace in
  `~/weave-demo/robotics`, viewport capture of the site, intake from screenshots plus a brief
  without a style, agents in tmux, every gate stops and asks (`--yes` approves), deploy to
  `weave-robotics-demo`, the explorer and `weave usage` at the end; re-running resumes at the open
  gate. `docs/runbook.md`: setup, the run step by step with what to say, the explorer walkthrough,
  cuts for 5/10/20/30-minute slots, fallbacks, where each proof lives. **Not done:** your dry run.

## The story for engineering leaders

1. **The problem** (1 min) — agents build fast; nothing bounds them, checks them, or remembers.
2. **Intake** — a real site's screenshot becomes a design; one uncertain field gates; you confirm.
3. **The run** (recorded) — the DAG building in parallel; a real agent's natural failure and its
   repair; a risky change held; the sandbox refusing a secret read.
4. **Release** — approval, public deploy, live checks against the URL.
5. **The evidence** (live) — the explorer: every requirement traced to code, evidence, commit and
   approval; the timeline; the boundaries.
6. **Is it better?** — the benchmark table, losses included.
7. **What is next** — Jev serving decisions, calibrated thresholds.

## Risks

| Risk | Mitigation |
|---|---|
| Real agents vary run to run | Record the run beforehand; keep a second recording |
| Subscription limits hit mid-benchmark | Measure first (D5); benchmark in batches; stop-and-ask on refusal |
| The subscription path returns malformed JSON | Schema validation, one retry, then a gate — never a guess |
| The chosen site's design is hard to read | Intake gates uncertain fields; you confirm on camera — that is the feature |
| Jev key or parity arrives late | D8 is last and independent; the demo stands without it, and says so |
| A live walkthrough goes wrong | The explorer page is one offline file; the runbook has a fallback per step |

## Status

| Phase | State |
|---|---|
| D0 Preflight | **done** (`weave doctor`) |
| D1 Subscription decision + vision | **done** |
| D2 Tools | **done** (CI proves them) |
| D3 Templates for real | **done** |
| D4 3D that renders | **done** |
| D4.5 Agents in tmux | **done** |
| D5 First real build | **done** (11.9 min, 0 retries, autonomous) |
| D6 Intake + public deploy | **done** — https://weave-robotics-demo.vercel.app |
| D7 Benchmark | size decided after D5 |
| D8 Jev | built against a stand-in; real parity waits on the key |
| D9 Recording kit | built (`pnpm demo:real`, `docs/runbook.md`); your dry run pending |
