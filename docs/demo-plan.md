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

### D2 — Tools installed and wired

- devDependencies: Playwright (+ Chromium), Lighthouse, axe (via Playwright), sharp,
  gltf-transform. gitleaks through a pinned download step.
- Playwright becomes the default browser worker (console errors, full-page captures); Chrome CLI
  stays as the fallback.
- Optimisation becomes real: sharp for rasters, gltf-transform for 3D; budgets measured after.
- CI installs the same set plus bubblewrap, so every push proves the sandbox and the real render.
- **Exit:** CI green with every "not verified here" branch now verified.

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

### D4 — 3D that renders

- model-viewer bundled into the scaffold (`vendor/`), loaded locally; the context pack tells the
  placing agent how to use it.
- The robot model: Unitree's Go2 (#87) — URDF parts assembled into one glTF, simplified to
  2 MB / 100k triangles, BSD-3-Clause notice in the credits.
- Deploy headers: the scaffold emits a `vercel.json` with the security headers the live checks
  look for (they failed in the stand-in host) and a CSP that allows the bundled viewer only.
- **Exit:** a Playwright render shows the robot in the hero; visual QA judges it visible.

### D5 — The first real build (measured)

- `pnpm demo:real`: the robotics brief, real Claude Code agents on your subscription, the
  decision layer on Opus 5.5, sandbox on, concurrency 3.
- Report: time, number of agent sessions, retries, decision calls, usage as your plan shows it.
- Fix what it breaks — it will find defects no stand-in could.
- Capture the **natural failure** (#46) from the real agents, for the story.
- **Exit:** a completed real run, its explorer page, and a usage report → you decide the
  benchmark size.

### D6 — Screenshot intake and the public deploy

- Capture your chosen site with the browser worker; intake reads it with vision; uncertain
  fields gate; the build is styled from what was read.
- Pre-release approval deploys to Vercel project `weave-robotics-demo`; post-deploy checks run
  against the public URL.
- **Exit:** a public URL, deploy evidence, live checks passing.

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

### D9 — The recording kit

- `pnpm demo:real` as one command, idempotent, resumable if interrupted.
- A runbook: setup, what to click, what to say, where each proof lives, what to cut for a
  shorter slot, and fallbacks if something misbehaves live.
- A dry run by you, and fixes from it.

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
| D0 Preflight | not started |
| D1 Subscription decision + vision | not started |
| D2 Tools | not started |
| D3 Templates for real | not started |
| D4 3D that renders | not started |
| D5 First real build | not started |
| D6 Intake + public deploy | not started (site decided, #86) |
| D7 Benchmark | size decided after D5 |
| D8 Jev | docs in (#84); waiting on the key |
| D9 Recording kit | not started |
