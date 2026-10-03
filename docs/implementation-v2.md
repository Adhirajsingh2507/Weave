# Implementation Plan — V2

> The phased build plan for V2. Supersedes `implementation-plan.md` (v1 phases 0–7, complete;
> archived in `past-info.md`).
>
> Sources: `../V2_planing.md` (the V2 brief), canonical §116 (V2 definition), `v2-inputs.md`
> (the raw lists), and the decisions recorded in `current-info.md`.

_Last updated: 2026-10-03_

## What V2 is

V2 is the canonical §116 list minus multiple runtimes, plus policy packs:

```
knowledge graph + evaluators + parallel + deploy    ← V2.0–V2.4
visual graph UI                                     ← V2.5
multimodal design compiler                          ← V2.6
asset + 3D pipeline                                 ← V2.7
policy packs (the weave_changes lists)              ← V2.2
```

**Multiple agent runtimes is excluded.** The `NodeExecutor` seam is made genuinely agnostic —
async, timeouts, capabilities, enforcement outside the prompt — but Claude Code stays the only
adapter until something demands a second one.

### Rules that govern every phase

1. **Each subsystem carries its own defect fix.** No separate cleanup phase; a subsystem lands
   on solid ground or it doesn't land.
2. **Exits are evidence, not opinion.** Every phase ends with a runnable check or a recorded
   artefact. "Looks done" is not an exit.
3. **The demo is a running acceptance test.** It must stay green at every phase and grows with
   them. See [Demo](#the-demo-as-acceptance-test).
4. **Deterministic before judged.** A model-scored check is only acceptable where no
   deterministic check exists.
5. **The design guide is the spec.** When reference pictures disagree with a guide, the pictures
   get re-filed; the guide changes only by explicit decision.

### Phase dependencies

```
V2.0 ✅ ──┬─► V2.1 ✅─┬─► V2.2 ✅─┐
          │          │          ├─► V2.5 ✅─► V2.6 ✅─► V2.7 ✅
          ├─► V2.3 ✅┘          │
          └─► V2.4 ✅───────────┘
                     Jev track runs alongside, gated on access
```

V2.1 is the spine: packs, the explorer and the metrics all read the evidence chain it builds.
V2.3 and V2.4 are independent of V2.1 and can be reordered.

---

## V2.0 — A real run ✅ DONE

**Goal.** Make one real greenfield run possible end to end, fixing the four reproduced defects
on the way.

**Shipped.**
- Harness state (`working_branch`, `base_branch`, `stashed`) persists on the run, so a later
  process can finish or cancel it. Previously the CLI flow stranded the user on the weave branch
  with their work in a stash.
- Gate ids are sequenced and inserted, never replaced, so history survives. Gates carry `notes`
  and `resolved_at`, and notes reach the next attempt's context pack.
- Completed nodes write code nodes and by-construction mapping edges, with evidence and attempt
  counts persisted per node. Gaps shrink as work completes; an identical re-run plans nothing.
- `ClaudeCodeExecutor` and `DeterministicVerifier` are async with timeouts (3×1s nodes: 3.3s →
  1.3s) and agents get a scrubbed environment.
- A scaffold node runs a zero-dependency template before any agent, so `pnpm build` and
  `pnpm check` mean something in a fresh worktree. It refuses to touch an existing project.
- The context pack carries the chosen design guide: `style:` in the brief selects one of 91
  guides, its tokens become `styles/tokens.css`, and the agent is told the rules it is judged on.

**Also fixed:** `.agent/` now ignores itself (the root `.gitignore` is auto-stashed mid-run,
which let `git add -A` commit engine state); `openGate` awaits its event.

**Checks added:** `resume.check`, `style.check` (parses all 91 guides, 757 checks),
`build.check` (greenfield with real scaffolder and real verifier). **18 checks, CI green.**

**Known gaps carried forward:** evidence is still a string array rather than typed records;
`listGates()` spans runs, so approving by index can hit a stale gate; `browser-qa` and
`visual-qa` are still marked `skipped`.

---

## V2.1 — Requirements, criteria, evidence, metrics ✅ DONE

**Goal.** Every requirement traceable: requirement → design → code → criterion → evidence →
commit → approval. Canonical §65 calls this potentially the strongest differentiator, and none
of it exists yet.

**Why now.** Packs, the explorer, the benchmark and all five metrics read this chain. Building
any of them first means building them twice.

### Tasks

1. **Requirement nodes.** Add `requirement` and `evidence` to `KgNodeKind`, and `satisfied_by`
   / `verifies` to `EdgeKind` (`src/core/graph/types.ts`). Requirements are minted from three
   sources: each IR design element ("the hero exists and is visible"), each `constraints` entry
   in the IR, and later each applicable pack item.
   _Files:_ `graph/types.ts`, `graph/project.ts`, `store/graph-store.ts`.
2. **Criteria pass** (`src/core/criteria.ts`). Independent of both compiler and implementer
   (decision #25), frozen before implementation. v1 sources criteria deterministically:
   - the floor from `design-guide/_base.md`,
   - the `checks` array of the run's style guide (already machine-readable),
   - IR-derived structural criteria (page routes exist, named components present).
   An LLM-assisted pass is the documented upgrade, not the starting point.
3. **Typed evidence records.** New `evidence` table: `id, run_id, node_id, criterion_id, kind
   (build|test|dom|visual|pack|deploy), ok, detail, artifact_path, ts`. `Verifier` returns
   structured results instead of strings; `loop.ts` threads them; `exec_nodes.evidence` keeps a
   denormalised summary for cheap reads.
   _Files:_ `store/graph-store.ts`, `verify.ts`, `loop.ts`, `api.ts`.
4. **Attempts table.** `run_id, node_id, attempt, started_at, ended_at, executor, exec_ok,
   verify_ok, evidence_ids`. This is what makes first-pass and repair rates real rather than
   inferred.
5. **Metrics module** (`src/core/metrics.ts`) implementing the five definitions below.
6. **Reporting.** `Engine.report(runId)` returning the traceability chain plus metrics; CLI
   `weave report [--json]`.

### Metric definitions (proposed — vetoable)

| Metric | Definition |
|---|---|
| Autonomous completion rate | runs reaching `done` opening no gates beyond the two mandatory ones (design-approval, pre-release) ÷ total runs |
| Human intervention rate | gates opened beyond the mandatory two ÷ impl nodes, per run |
| First-pass verification rate | impl nodes with `attempts == 1` ÷ impl nodes |
| Repair success rate | impl nodes that failed ≥ once and later completed ÷ impl nodes that failed ≥ once |
| Evidence coverage | requirements with ≥ 1 linked evidence record ÷ total requirements |

Each is computed per run and as a rolling figure across runs in `state.db`.

### Exit criteria

- For a demo run, `weave report` prints every requirement with its design node, code files,
  criteria, evidence records, commit and approving gate. No requirement is orphaned.
- All five metrics compute from persisted state, not from logs.
- Evidence coverage on the demo run is 100% for structural requirements.

### Checks to add

- `criteria.check` — criteria are minted before any impl node runs, and are stable across a
  re-run of the same IR.
- `evidence.check` — a passing node and a failing node both produce typed evidence linked to a
  criterion.
- `metrics.check` — a fixture run with known shape (one node failing twice then passing)
  produces the exact expected five numbers.
- `traceability.check` — every requirement in a completed run resolves to code + evidence.

### Risks

- **Criteria explosion.** A style guide contributes 8–10 checks and packs will add dozens.
  Mitigation: applicability filtering (V2.2) and per-criterion `severity`.
- **Evidence volume.** Screenshots and logs are large. Mitigation: artefacts on disk under
  `.agent/evidence/`, rows hold paths.
- **Double-counting.** The same rule can arrive from `_base.md` and a pack. Mitigation:
  criterion ids are namespaced and deduplicated on mint.

### Open questions

- Do requirements live per run or per project? (Proposal: per project, versioned with the IR.)
- Are the metric definitions above right, particularly whether design-approval counts as
  intervention? (Proposal: it does not; it is a mandatory control point.)

**Shipped.**
- `requirement` and `criterion` node kinds with `satisfied_by` / `verifies` edges. Requirements
  are minted from the IR, the `_base.md` floor, the chosen style guide and the selected packs.
- Typed evidence records (`kind`, `detail`, `status`, `at`) in their own table, plus an
  `attempts` table — the two together are what the metrics are computed from, not re-derived.
- `weave report` renders the full chain, requirement by requirement, and distinguishes passed,
  failed, not-applicable, unavailable, human and pending rather than collapsing them to a tick.
- The five metrics: first-pass rate, repair rate, criteria coverage, unplanned gates, human
  intervention rate. `design-approval` and `pre-release` are mandatory control points and are
  excluded from the intervention count (question 1, decided).

**Defects fixed on the way.** `computeGaps` treated every non-code node as buildable, so minting
requirement nodes turned 3 impl nodes into 24 — `package` nodes were quietly affected before
this phase too. The verifier passed no-op nodes because the project still built; it now gates on
the node's own structural criterion, with scaffolded sections marked `data-placeholder`. Criterion
status used every verdict rather than the latest, so a successful repair still read as failed.

**Checks added:** `criteria.check`, `traceability.check`. **20 checks, CI green.**

---

## V2.2 — Policy packs ✅ DONE

**Goal.** Turn the `weave_changes` lists (20 pre-launch, 70 security, 79 features, 19 UX laws)
into selectable packs where every item is *both* a requirement told to the agent and a check
Weave runs.

### Tasks

1. **Pack format** (`packs/<name>/pack.json`): items of
   `{ id, requirement, check: { kind, runner, args }, applies_when, severity, evidence_hint }`.
2. **Runner registry** (`src/core/packs/runners/`): `file-exists`, `html-assert`,
   `http-header`, `dom-query` (Playwright), `lighthouse`, `dep-audit`, `secret-scan`,
   `judged` (decision layer). Every runner returns a typed evidence record.
3. **Applicability.** Conditions evaluated against the IR and code graph: `hasAuth`,
   `hasPayments`, `hasForms`, `hasDatabase`, `isStatic`. Payment items must not fire on a
   brochure site — that is the difference between a useful pack and noise.
4. **Starter packs**, drawn from `v2-inputs.md`:
   - `web-security` — headers, cookie flags, CORS, secrets in git/JS, dependency audit.
   - `seo` — titles, meta descriptions, canonical, sitemap, robots, one h1, alt text, og:image.
   - `a11y` — the `_base.md` floor plus measurable UX laws (target size, nav item counts).
   - `performance` — Lighthouse budgets, image weight, font budget, render-blocking.
5. **Human-only items.** Backlink strategy, Search Console verification and similar are listed
   as a checklist in the report and never silently marked passed.
6. **CLI/MCP.** `weave packs list`, `weave packs add <name>`, pack selection in the brief.

### Exit criteria

- The demo run shows pack results as evidence, and a failing pack item drives a repair loop that
  the report records.
- An item that does not apply (a payments rule on a static site) is recorded as `not-applicable`
  with its reason, not as a pass.
- Human-only items appear as an explicit outstanding checklist.

### Checks to add

- `packs.check` — a fixture site that deliberately violates known items produces exactly the
  expected failures; a fixed version passes.
- `applicability.check` — payment and auth items do not fire on a static brochure IR.

### Risks

- **Tool weight.** Playwright and Lighthouse are heavy and are optional dependencies today.
  Mitigation: runners degrade to `unavailable` evidence rather than failing the run, and CI runs
  only the dependency-free runners.
- **False positives** erode trust faster than missing checks. Mitigation: every pack item ships
  with a fixture proving both directions.

### Decided

- **Default packs:** `web-security` and `a11y` are on by default; `seo` and `performance` are
  opt-in via `packs:` in the brief or `defaultPacks` on the engine (question 3).
- **Blocking items open a gate, they do not fail the run** (question 4). Approving is a waiver:
  it is recorded with its reason and covers exactly the items the gate named — a new failure opens a new gate.

**Shipped.**
- 4 packs, 46 items (`web-security` 15, `a11y` 14, `seo` 10, `performance` 7), each item
  carrying a `source` back to the list in `v2-inputs.md` it came from.
- 8 dependency-free runners: `file-exists`, `file-absent`, `html-assert`, `text-scan`,
  `dep-audit`, `file-size`, plus `browser` and `human`, which report `unavailable` / `human`
  rather than a green tick that means nothing. The browser runners land with V2.7.
- Applicability facts derived from the source tree and `package.json` (`hasAuth`, `hasPayments`,
  `hasDatabase`, `hasForms`, `hasStyles`, …). A payments rule on a brochure site is recorded as
  `not-applicable` **with its reason**, never as a pass.
- A `policy` gate kind: a failing blocking item halts the run and names the item; approving is a
  waiver recorded on the gate.
- `weave packs` lists and inspects packs; pack results are evidence against criteria, so they
  appear in `weave report` and count toward coverage.

**Defect fixed on the way.** `a11y.reduced-motion` asserted against HTML, but the rule lives in
CSS — it failed our own scaffold, which declares it in `base.css`. The runner gained
`expect: present` and the item now scans styles. Exactly the false positive the risk list
predicts, caught by pointing the pack at our own template. The template also gained the skip link
it was being (correctly) marked down for.

**Checks added:** `packs.check` (both directions, per item, plus applicability), `policy-gate.check`
(blocking failure → gate → waiver recorded → release). **22 checks, CI green.**

**Fixed after review (2026-09-29).** Three defects, each now asserted:
- Approving a `policy` gate waived *every* later blocking failure in the run. The waiver now covers
  only the items the gate named, and the gate lists all of them rather than the first ten.
- `dep-audit` read a failed audit (offline, no lockfile) as a pass. Only a report carrying
  vulnerability counts is a verdict; anything else is `unavailable`.
- Rejecting any gate after execution started left the user on the `weave/<run>` branch with their
  work in a stash — the V2.0 defect, on the reject path. Reject now restores branch and stash.

**Exit criteria status.** Not-applicable-with-reason and the human checklist are done and
asserted. *A pack failure driving a repair* is proven by `policy-gate.check` but **not yet by the
demo** — the demo scaffold now passes every runnable item. Staging a natural failure in the demo
moves to V2.5, with the benchmark.

---

## V2.3 — Parallel as a real DAG ✅ DONE

**Goal.** Dependencies, shared contracts, file ownership and conflict handling — so parallelism
is a property of the graph rather than a batch size.

**Why.** V2.0 made concurrency genuinely concurrent, but every impl node still runs in one
undifferentiated batch, and nothing stops two agents editing the same file.

### Tasks

1. **Dependency edges in the exec graph.** `ExecNode.dependsOn: NodeId[]`; the planner derives:
   `scaffold → components → pages (a page depends on its section components) → integration`.
   _Files:_ `graph/types.ts`, `plan.ts`, `api.ts` scheduler.
2. **Topological scheduler.** Batches computed from the DAG, `concurrency` caps batch width.
   Replaces the current "all impl nodes at once".
3. **Shared contract by construction.** Component nodes write `sections/<id>.html` fragments and
   own only their own files; `index.html`, `styles/tokens.css` and `styles/base.css` are shared
   and writable only by the scaffold and integration nodes. Most conflicts disappear rather than
   being resolved.
4. **File ownership enforcement.** Each node declares `owns: string[]`; changed files outside the
   set fail verification with a clear message. Cheap, deterministic, and catches a whole class of
   agent overreach.
5. **Conflict handling.** On merge conflict: rebase the node branch onto the new tip and re-run
   verification once; escalate to a gate only if it fails again. Today it goes straight to a gate
   and resets the batch.
6. **Integration node earns its name** — assembles fragments into `index.html`, runs the shared
   checks.

### Exit criteria

- N components build concurrently with zero merge conflicts on the demo brief.
- A deliberately conflicting node is auto-rebased once and then succeeds, with both attempts in
  the evidence trail.
- A node writing outside its ownership set fails verification, and the report says which file.
- Wall-clock for the demo drops measurably versus sequential, recorded in the report.

### Checks to add

- `dag.check` — declared dependencies are respected; a page never starts before its components.
- `ownership.check` — an out-of-bounds write fails with the offending path.
- `conflict.check` — a forced conflict resolves by rebase without human involvement.

### Risks

- **Fragment assembly changes the template**, so `scaffold.ts` and the demo move together.
- **Ownership too strict** blocks legitimate shared edits. Mitigation: shared files are edited by
  designated nodes, not forbidden outright.

**Shipped.**
- `ExecNode.dependsOn` and `owns`, persisted. The planner derives scaffold → components/assets →
  pages → integration; a page depends on its own sections, and a component no page lists belongs
  to the home page. The home page is always `index.html`.
- A topological scheduler runs the ready frontier, capped by `concurrency`. The old sequential
  path is gone: a batch of one takes the same path, so both get the same guarantees.
- The fragment contract (decision #59): components write `sections/<id>.html`, pages own their
  file, the scaffold marks each page `<body … data-placeholder>` for its page node to remove.
- Ownership enforced in verification; the report gained **Failed node checks**, which names the
  file.
- Conflicts re-run the node once on the new tip (decision #60 — **deviation from task 5**: a
  rebase cannot resolve a textual conflict that a merge could not, so the plan's "rebase and
  re-verify" would always fail the same way).
- The integration node assembles fragments between `weave:fragment` markers (idempotent, links
  each section's stylesheet) and runs build + check on the whole site; a failure opens a gate.
- The report records impl wall-clock against the serial sum.

**Defects fixed on the way.** Retrying after a gate or a conflict overwrote the node's earlier
attempt rows — attempts are now numbered after the ones already recorded. A node that hit a
merge conflict never had its attempts persisted, and the budget ceiling was only checked on the
sequential path. `findDesignMarker` matched filenames by substring, so a component called `a`
was "realised" by `package.json`. The pack runners treated every `.html` file as a page, so each
fragment failed `lang`, `title` and one-`h1` — only full documents are pages now. Custom
scaffolders stopped receiving `sections` once pages were passed; they get both.

**Checks added:** `dag.check` — the DAG (a page never starts before its sections, components
overlap, fragments land in the right page, timing recorded), ownership (the offending file is
named) and conflict (re-run on the new tip, no human, both tries recorded). A mutation that makes
the scheduler ignore dependencies fails it.

**Exit criteria status.**
- N components build concurrently with zero merge conflicts on the demo brief — ✅ by
  construction.
- A deliberately conflicting node is re-run once and succeeds, both attempts in the trail — ✅ in
  `dag.check`, on a project the template did not create; the template's contract makes the
  conflict impossible in the demo.
- An out-of-bounds write fails verification and the report says which file — ✅.
- Wall-clock drops measurably and is recorded — ✅ (demo: 2.9s vs 4.9s serial).

---

## V2.4 — Boundaries and deploy ✅ DONE

**Goal.** Enforcement that lives outside the prompt, and a release step that can hold a secret
an agent never sees.

### Tasks

1. **Sandbox** (`src/core/sandbox.ts`). Native-first: Claude Code's own permission rules and
   sandbox where available; OS fallback wrapping any agent in bubblewrap on Linux. Capability
   declaration on `NodeExecutor` (`canShell`, `canNetwork`, `sandboxed`).
2. **Filesystem enforcement.** The `permissions.deny` globs in the context pack become real:
   secrets are unreadable from inside the sandbox, not merely discouraged in a prompt sentence.
3. **Network policy.** Allowlist plus an audit record of outbound hosts per node, stored as
   evidence.
4. **Risky-op gates.** Classify each node diff — dependency changes, migrations, deletions,
   anything secret-shaped — via `risk.classifyOperation`, and open a `risky-op` gate. This is the
   first real use of the decision layer inside the run path, which also starts the corpus the Jev
   parity harness needs.
5. **Release.** Deploy token injected only into the release step's environment; post-deploy checks
   re-run the relevant packs against the live URL; deployment evidence records URL, commit and
   check results.

### Exit criteria

- A check proves an agent cannot read `.env` from inside a node, on this machine.
- A node that adds a dependency opens a `risky-op` gate naming the package.
- The demo deploys only after approval and records post-deploy evidence against the live URL.
- The decision corpus has real entries from a real run.

### Checks to add

- `sandbox.check` — deny-listed file reads fail inside the sandbox; skipped with a recorded
  reason where the backend is unavailable.
- `risky-op.check` — a diff adding a dependency opens a gate; a cosmetic diff does not.
- `deploy-evidence.check` — a fake deployer produces evidence linked to the release node.

### Risks

- **bubblewrap is Linux-only** and may be absent. Mitigation: capability detection, and the check
  records "unavailable" rather than passing quietly.
- **Sandboxing breaks tooling** — dev servers and Playwright need care. Mitigation: the browser
  worker runs outside the agent sandbox, against built output.

**Decided before building** (see `current-info.md` #61–#63): the network policy is a local
proxy allowlist plus audit; the decision layer judges every node diff when credentials are set;
the deploy target is Vercel.

**Shipped.**
- `sandbox.ts` — bubblewrap: home secrets (`~/.ssh`, cloud and registry credentials, the Vercel
  login, …) and deny-listed worktree files masked, the user's checkout hidden with only `.git`
  kept. Capability detection; `weave sandbox` prints the verdict for the machine.
- `ClaudeCodeExecutor` layers Claude Code's own deny rules (`--settings`), bubblewrap and the
  egress proxy, and sets `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. `NodeExecutor.capabilities`
  (`canShell`, `canNetwork`, `sandboxed`); every attempt records how it was confined and which
  hosts it contacted.
- `egress.ts` — a per-run CONNECT/HTTP proxy on loopback: allowlisted hosts relayed, others
  refused with 403, every host counted.
- `risk.ts` — deterministic findings on the staged diff: dependency changes named by package,
  migrations, deletions, secret-shaped content (the web-security pack's own patterns) or files,
  blocked egress. The decision layer adds its verdict when configured and logs it to the corpus.
  Risky nodes are committed to their branch and parked; one `risky-op` gate per batch; approving
  merges, rejecting discards. A batch that halts for another reason resets its parked nodes, so
  nothing is ever integrated without its own review.
- Release: the deployer is told the commit; deploy evidence records URL, commit and the log file;
  the packs' page and header items re-run against the live URL. New `http-header` runner and four
  header items (`nosniff`, `frame`, `hsts`, `referrer`) — packs are now 50 items. `VercelDeployer`
  (token through the child's environment only); `CommandDeployer` is async and takes an explicit
  env. The CLI and MCP server configure both from the environment (`ANTHROPIC_API_KEY`,
  `WEAVE_DEPLOY=vercel`); the CLI gained `--concurrency` and `sandbox`.

**Checks added:** `sandbox.check` (glob matching, env scrub, the proxy both ways, and the real
executor running a probe agent that tries to read both `.env` files and reach a blocked host),
`risky-op.check` (dependency named, parked, integrated on approval; cosmetic diff passes; egress
gates; the decision layer adds a gate and writes the corpus; a provider outage is recorded, not
fatal; reject discards the branch). `deploy.check` gained deploy evidence and live checks against
a real local server, plus the Vercel token path. `packs.check` gained both-directions fixtures for
the header items. **25 checks.**

A flaw caught while building the check: an untracked `.env` is swept into the harness's
auto-stash, so "the checkout's `.env` is hidden" passed vacuously. The check now uses a gitignored
`.env`, as real projects do, and asserts it survived the stash. The control run (sandbox off)
reads both secrets; sandboxed, neither.

**Exit criteria status.**
- An agent cannot read `.env` from inside a node, on this machine — ✅ (bubblewrap 0.11 here).
- A node that adds a dependency opens a `risky-op` gate naming the package — ✅ in
  `risky-op.check`. In the template's layout a component cannot reach `package.json` at all —
  ownership fails it first.
- The demo deploys only after approval and records post-deploy evidence against the live URL — ✅
  against a local stand-in host.
- The decision corpus has real entries from a real run — ❌ **not yet**: it needs a credentialed
  run. The wiring is proven with a fake provider.

**Known ceilings.** The proxy binds clients that honour `HTTPS_PROXY`; a process that ignores it
is not blocked (network namespace = upgrade path). The OS layer is Linux-only. A real `claude`
inside bubblewrap has not been exercised — only a stand-in binary. The `llm` escalation tier has no
separate classifier yet, so it keeps the verdict. A failing live check is recorded, not rolled back.

---

## V2.5 — Graph explorer, README, benchmark ✅ DONE (benchmark run in D7)

**Goal.** Make the work visible and quantified — the two things V2_planing asks for that no
amount of architecture supplies.

### Tasks

1. **Static explorer.** `weave report --html` renders one self-contained file from `state.db`:
   intent → design → code → criteria → evidence → commits → gates, plus the metrics and a
   failure/repair timeline. Static first because it works offline, attaches to a PR, and needs no
   server.
2. **README rewrite**, outcome-first: problem → solution → demo → differentiation → architecture
   → quickstart. Jargon deferred until after the concept; "System One/Two" renamed to decision
   layer and execution layer throughout the docs.
3. **Benchmark harness** (`scripts/benchmark.mjs`): same brief, two arms — a single agent session
   versus a governed Weave run — scored by **third-party tools only** (Lighthouse, axe,
   dependency audit, secret scan), never by Weave's own judged checks. N runs per arm, variance
   reported.

### Exit criteria

- One HTML file tells the whole story of a run without explanation.
- A reader who has never seen the project can state what Weave does after the first screen of the
  README.
- The benchmark produces a table with an independent scorer and honest variance, including runs
  where Weave loses.

### Checks to add

- `report-html.check` — the generated file is self-contained, opens without network access, and
  contains every requirement in the run.

### Risks

- **Benchmark bias** is the serious one: Weave's checks grading both arms would be worthless.
  Mitigation: third-party scorers only, and publish the losing runs.
- **Explorer scope creep** toward an interactive editor. Canonical §94 warns against exactly
  that; it stays a read-only report until something forces otherwise.

**Defaults taken without an answer** (the questions asked at the end of V2.4 went unanswered):
no credentialed run — there is no key here; no new heavy dependencies, so Lighthouse, axe and
gitleaks are used when installed and reported unavailable otherwise; 3 runs per arm by default.

**Shipped.**
- **Two fixes the explorer would otherwise have displayed.** One definition of coverage — a
  requirement is covered when a verifying criterion has a passed or failed verdict — used by both
  the metric and the report (`criterionStatuses`, `latestStatus`, `isVerdict` in `metrics.ts`).
  `listGates()` is scoped to the latest run by default; `{ runId }` or `{ all: true }` widen it
  (CLI `gates --all|--run`, MCP `gates` arguments).
- **Explorer** (`explorer.ts`, `weave report --html <file>`, `Engine.reportHtml`): one file, no
  scripts, no external references, light and dark. Outcome tiles, the DAG drawn in layers, every
  attempt on one clock (parallelism and repairs visible), requirements with their evidence,
  the repair trail, gates, and the sandbox/network/risk records. The report gained `nodes`,
  `attempts` and `boundaries` to feed it.
- **Policy repair loop** — the V2.2 exit criterion deferred twice. A blocking pack failure on the
  assembled site gets one bounded `repair:policy` node before a gate: the failures are its brief,
  it owns the fragments and pages, and it passes only when those exact items pass on its own
  assembled worktree. Then integration and the packs run again. The demo exercises it.
- **Benchmark** (`benchmark.ts`, `scripts/benchmark.mjs`): arms interleaved per run, a loopback
  server so browser scorers see the site as served, scorers probed and reported unavailable
  rather than dropped, mean ± sd per arm and a head-to-head that counts losses.
- **README rewritten** outcome-first; "System One/Two" retired for decision layer / execution
  layer across the living docs and code comments.

**Defects fixed on the way.** The verifier kept only stdout, and the scaffold's `check.mjs`
reports on stderr — so a failing check reached the agent's repair brief as "check failed:" with
no reason. The repair trail listed only failures with no criterion, hiding exactly the
interesting ones (an `<h1>` in a fragment, a policy item). The explorer's first render cut the
graph off; the second scaled it unreadable.

**Checks added:** `report-html.check` (self-contained, complete, escaped, the repair trail carries
its reasons), `benchmark.check` (the arithmetic, interleaving, unavailable scorers, a loss in the
table, no path traversal from the site server).

**Exit criteria status.**
- One HTML file tells the whole story of a run — ✅, checked visually in both themes.
- A newcomer can say what Weave does after the first screen of the README — rewritten for it;
  only a newcomer can confirm.
- A benchmark table with an independent scorer and honest variance — **❌ not yet**: the harness
  is built and checked, but no real runs exist. The README says so.

---

## V2.6 — Multimodal compiler and presets in MCP ✅ DONE

**Goal.** Replace the line-directive parser with real intake, and expose the 91 style guides
through MCP so a style can be chosen by example.

### Tasks

1. **IR schema extension** — the guides carry `shape`, `motion` and `spacing` tokens that the IR
   has no home for. Extend `ir/schema.ts` so the compiler can consume what the design system
   already produces. **This is a known gap recorded during the design-system work.**
2. **Screenshot intake.** Vision pass extracts structured facts → decision layer normalises enum
   fields with confidence → low confidence opens a gate (decision #24).
3. **URL intake**, then Figma via the existing MCP connection.
4. **Preset resources.** The 91 guides exposed as MCP resources with their reference pictures, so
   a client can browse and select. `demo-design/` becomes vision input rather than only human
   reference.
5. **Style suggestion.** Given a brief, propose 3 candidate styles with reasons, from `best_for`
   and `avoid_for`.

### Exit criteria

- A brief that is "this screenshot plus two sentences" produces a valid IR and a styled build.
- Low-confidence field interpretations open a gate rather than guessing silently.
- An MCP client can list styles, see pictures, and select one.

### Checks to add

- `intake-vision.check` — with a recorded vision response, a screenshot produces the expected IR
  fields and confidences.
- `ir-tokens.check` — every token key used by the 91 guides has an IR home.

### Risks

- **Vision variance** makes checks flaky. Mitigation: recorded fixtures in checks, live calls only
  in the demo.
- **IR churn** ripples into projection and mapping. Mitigation: extend, never rename; IR is
  versioned.

**Shipped.**
- **IR `designTokens`**: the chosen guide's tokens under the guide's own key names (#53). The
  core every guide shares is typed; the long tail passes through. Spacing is under `layout`,
  where the guides put it, and accepts CSS lengths — `kinetic-typography` spaces sections by
  `100vh`, and the guide is the spec. Also: `url` input kind, `meta.interpretations`.
- **Multimodal intake** (`intake.ts`): the execution layer reads screenshots (Claude vision
  through the official SDK, structured outputs, server-side refusal fallback on); the decision
  layer normalises each enum field with a confidence (`interpret.normalizeField`, logged to the
  corpus); without a provider, only exact readings are trusted. Explicit text always wins. A URL
  is read deterministically — title, landmarks, headed sections. Provenance per element.
- **Uncertain readings gate.** Any interpretation not accepted turns the intake gate into a
  `low-confidence` gate naming each field, what was read, the confidence and the alternatives.
  A style chosen from a reading is always confirmed by a person.
- **Style suggestion** (`suggestStyles`): deterministic scoring against each guide's
  `best_for`, aliases and `avoid_for`, with reasons; `weave styles --suggest`.
- **Presets in MCP**: every guide as a `style://` resource, every reference picture as a
  `style-picture://` blob resource (only listed files — no traversal), `list_styles` and
  `suggest_styles` tools, and `run` taking `style`, `screenshots` and `url`.
- **Figma is client-side by design**: an MCP client with Figma access passes the IR to `run`; the
  engine does not call another server's tools.

**New dependency:** `@anthropic-ai/sdk` — the vision call follows the SDK's documented path
rather than hand-written HTTP. The existing `ClaudeDecision` still uses raw `fetch` with a forced
tool call on `claude-sonnet-5`; that works on Sonnet 5 but would 400 on Opus 5.5 or Sonnet 5.5, so
moving it is recorded in `to-be-discussed.md`, not done silently.

**Checks added:** `ir-tokens.check` (all 91 guides: 2,226 token leaves reach the IR unchanged;
suggestions explained; nothing suggested for a brief that matches nothing), `intake-vision.check`
(recorded reading: exact accepted, fuzzy gated, decision layer earns confidence and fills the
corpus, text wins, URL read, and a screenshot plus two sentences → gated intake → styled build),
`mcp.check` rewritten as a real client round-trip over the in-memory transport.

**Exit criteria status.**
- "This screenshot plus two sentences" produces a valid IR and a styled build — ✅ with a
  recorded reading; live vision awaits a key.
- Low-confidence interpretations open a gate rather than guessing — ✅.
- An MCP client can list styles, see pictures, and select one — ✅, only 6 of 91 styles have
  pictures to see (`demo-design/` is mostly empty).

---

## V2.7 — Assets and 3D ✅ DONE

**Goal.** Assets as first-class graph entities with budgets, and the 3D path the canonical vision
keeps asking for.

### Tasks

1. **Asset registry.** Asset nodes already exist as a `KgNodeKind`; give them budgets
   (`sizeBytes`, `dims`), provenance and an optimisation step.
2. **Stop treating assets as build tasks.** Today an asset becomes an impl node and an agent is
   told to "build robot" for a `.glb`. Assets get an acquisition/optimisation node instead.
3. **3D handling.** `.glb` placement, poly/size budget enforcement, a still render for visual QA.
4. **Visual QA of placement** — the hybrid path exists in `visual.ts` but is unwired; connect it
   to the browser worker and the criteria from V2.1.

### Exit criteria

- The robotics brief's `robot.glb` ships within budget, placed, with visual evidence.
- No agent is ever asked to "build" an asset.

### Checks to add

- `assets.check` — an over-budget asset fails with its measured size.
- `visual-placement.check` — with a fake browser worker and recorded vision, placement criteria
  score correctly.

### Risks

- **3D is the least connected to the governance thesis.** It is last for that reason, and is the
  first thing to cut if the demo needs the time.

**Shipped.**
- **Assets are acquired, never built.** Each IR asset becomes an `asset:<id>` exec node (a new
  `asset` kind), run by the engine before any agent: acquire from the repo, an asset folder
  (`assetFolders`, CLI `--assets`) or a URL; optimise where a tool exists (built-in SVG
  minifier; `gltf-transform` when installed; otherwise "measured and budgeted only", recorded);
  measure; hold to a budget. Measurement parses headers directly — PNG, JPEG, GIF, WebP and SVG
  dimensions; glTF-binary triangles, vertices, meshes and textures — so it needs no library.
  Budgets are per type (3D: 2 MB and 100,000 triangles; image 300 KB and 2560 px; logo 50 KB
  and 1024 px; …), overridable in the brief: `asset: robot 3d robot.glb in:hero budget:1.5mb tris:80k`.
- **Measurements live on the graph.** The asset's KG node carries its path, provenance, size,
  dimensions or geometry, and budget.
- **A missing or over-budget asset opens a `policy` gate** naming the measured numbers
  ("1,200 triangles exceed the 1,000 budget"). Approving waives exactly that asset; a file
  supplied in the meantime is re-acquired and re-measured first. Nothing is built on an asset
  under review.
- **Placement is a requirement.** Each asset mints three criteria: within budget (`asset`),
  placed (`placement` — in its section when `in:` names one) and visible (`judged`). The placing
  component depends on its asset, is told the path and the numbers, and fails verification —
  with the reason — if its markup does not reference the file. Integration checks placement
  across the assembled site; without fragment markers it says the section was not verified.
- **Browser QA is real.** `ChromeBrowserWorker` renders each built page with headless Chrome —
  no dependency, Chrome's own sandbox kept on — and the screenshots become evidence.
- **Visual QA of placement** runs the hybrid path from V1 (`visual.ts`), finally wired:
  `ClaudeVisionExtractor` (SDK, structured outputs, refusal fallback) reads the screenshot, the
  decision layer scores "the model is visibly rendered in the hero". No extractor → unavailable.

**Why visual QA exists, shown by the demo.** The demo's robot is placed — the markup references
`assets/robot.glb`, so the placement criterion passes — and the screenshot shows an empty hero,
because `<model-viewer>` needs a script the page does not load. Placement and visibility are
different facts; only the render can tell them apart. Without a key the visibility verdict is
`unavailable`; with one, the vision pass would fail it.

**Checks added:** `assets.check` (measurement on real files built to spec; SVG minifier; no
agent ever asked to build an asset; the placer told, failed when it forgets, recorded; over
budget and missing both gate, with numbers and provenance), `visual-placement.check` (visible →
passed with the screenshot; unseen → failed while placement still passes; no extractor →
unavailable; a real Chrome render at the requested size, or "not verified here" with the reason).
`testing.ts` gained `tinyGlb` and `tinyPng` — valid files, not stubs.

**Exit criteria status.**
- The robotics brief's `robot.glb` ships within budget, placed, with visual evidence — ✅ in the
  demo: 2,400 triangles within 100,000, placed in the hero, rendered and screenshotted. The
  judged "is it visible" verdict awaits a key — and on the demo page it would be *no*.
- No agent is ever asked to build an asset — ✅, asserted.

**Known ceilings.** Raster and 3D optimisation need external tools (sharp, gltf-transform); without
them assets are measured and budgeted, not shrunk. The Chrome CLI cannot report console errors or
capture beyond the window, so `consoleCaptured` is false — Playwright is the upgrade. Video and
fonts are budgeted by size only.

---

## Jev track (parallel, access-gated)

**Built 2026-10-01 (D8, #110); the real run is blocked on `TYPESAFE_API_KEY`.** Steps 1, 3 and 4
are implemented (`decision/jev.ts`: `JevDecision.ask()` for several typed questions per call,
`runParity`, `policyFromParity`, `RoutedDecision`; `weave parity [--write]`) and proven against a
stand-in of the API. Step 2 has begun: the corpus has real entries since D1, only
`risk.classifyOperation` and too few to pass parity's 20-entry minimum.

1. **Widen the `Decision` seam** to match Jev's shape: several typed questions per call, with
   `choice`, `score` and boolean-probability primitives. Today it is one string-choice question
   per call, which cannot express Jev's strengths and wastes its parallel sampler.
2. **Fill the corpus.** V2.4 puts the decision layer in the run path, which is what makes replay
   possible at all — today the corpus would be empty.
3. **Parity harness.** Record → replay through Jev → compare agreement and calibration per
   decision type against `ProviderPolicy` tolerances (0.95 agreement, 0.05 calibration error).
4. **Per-type swap behind the existing flag**, with rollback on live regression.

**Exit:** a parity report per decision type; no caller changes when a type swaps.

---

## The demo as acceptance test

One project — the robotics landing page from `examples/robotics-landing.brief`, style
`futuristic` — kept green from here to the end. It grows with each phase:

| Phase | The demo must additionally show |
|---|---|
| V2.0 ✅ | Scaffold, styled build, gates honoured, resumable across processes |
| V2.1 ✅ | `weave report` with a full traceability chain and the five metrics |
| V2.2 ✅ | Not-applicable explained ✅; a pack failure driving a repair ✅ (landed in V2.5) |
| V2.3 ✅ | Components building concurrently ✅; a conflict re-run on the new tip — proven in `dag.check`, impossible in the demo by construction |
| V2.4 ✅ | Deploy after approval with live checks ✅; a risky-op gate on a dependency change — proven in `risky-op.check`, the demo's ownership contract stops it first |
| V2.5 ✅ | The HTML explorer ✅; a pack failure driving a repair ✅ (closes V2.2's deferral); the benchmark table — needs real runs |
| V2.6 ✅ | A screenshot as intake — proven with a recorded reading in `intake-vision.check`; the demo stays text-only so it needs no key |
| V2.7 ✅ | The 3D asset acquired without an agent, within budget, placed in the hero, rendered and screenshotted; visibility judged with a key |

**Failure staging: natural.** The demo's failure comes from a strict check agents commonly miss
— one `h1` per page, zero console errors, or a mobile Lighthouse threshold — and the repair loop
fixes it. Honest, and it exercises the same path a real failure would. It is not guaranteed on
every run; if a recording happens to produce a clean pass, the recording is re-run rather than
the failure faked.

---

## Risk register

| Risk | Where | Mitigation |
|---|---|---|
| Real agent runs cost money and vary | every phase from V2.1 | Checks use fakes and recorded fixtures; live runs are for the demo and benchmark only |
| Criteria and pack items multiply into noise | V2.1, V2.2 | Applicability conditions, severity, deduplicated namespaced ids |
| Optional heavy deps (Playwright, Lighthouse) | V2.2, V2.4 | Runners degrade to `unavailable` evidence; CI runs the dependency-free set |
| Benchmark grading itself | V2.5 | Third-party scorers only; losing runs published |
| Sandbox backend unavailable | V2.4 | Capability detection; checks record "unavailable" rather than passing |
| Scope drift toward a graph editor | V2.5 | Read-only report; canonical §94 |
| 3D absorbing the schedule | V2.7 | Last, and first to cut |

## Open questions

1. ~~Metric definitions — is design-approval an intervention?~~ **Decided (V2.1):** no.
2. ~~Requirements per run or per project?~~ **Decided (V2.1):** per project, versioned with the IR.
3. ~~Which packs default on?~~ **Decided (V2.2):** `web-security` + `a11y`.
4. ~~Does a blocking pack item fail the run or open a gate?~~ **Decided (V2.2):** gate; approval
   waives the items it names.
5. ~~Deploy target for the demo?~~ **Decided (V2.4):** Vercel.
6. Name and licence (the repo is public since 2026-10-02 with no licence; `weave` is taken on npm).
7. `terminal-ui` still has no reference pictures.

## Status

| Phase | State |
|---|---|
| V2.0 Real run | ✅ done, CI green |
| V2.1 Requirements, criteria, evidence, metrics | ✅ done, CI green |
| V2.2 Policy packs | ✅ done, CI green (demo repair from a pack failure deferred to V2.5) |
| V2.3 Parallel DAG | ✅ done |
| V2.4 Boundaries and deploy | ✅ done; exercised for real in D4.5–D6 (real agents in bubblewrap, a real risky-op gate, a public deploy) |
| V2.5 Explorer, README, benchmark | ✅ done; benchmark run in D7 (3 pairs, Weave lost on page scorers) |
| V2.6 Multimodal compiler and presets | ✅ done; live vision intake run in D6 |
| V2.7 Assets and 3D | ✅ done; real visibility verdicts in D4 and D6 |
| Jev track | built against a stand-in (D8); the real run waits on the key |

**After V2:** the demonstration phases D0–D9 (`demo-plan.md`) took V2 from stand-ins to real runs;
what they found is in `findings.md`.
