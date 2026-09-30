# Current Info

> Single source of truth for the **latest** decisions. When something changes, update it here and move the superseded version to `past-info.md`.

_Last updated: 2026-09-30_

> **Where things stand:** v1 and V2 (V2.0–V2.7) are complete, proven with stand-in agents but
> **not yet with a real agent run**. Next is the demonstration plan (`demo-plan.md`) and a design
> discussion in progress (decisions #75–#83). Start a new session with `handoff.md`.

## What the project is
A **graph-driven autonomous engineering platform** (**Weave**) that turns human intent + multimodal design inputs into software via bounded agent loops, with persistent state, evidence, and human gates.

Not "AI + loop → website." The mental model is four separated layers:

- **Knowledge graph** — what the project *is* (requirements, design, components, assets, APIs, constraints, decisions, tests). Design is one domain inside it, not a separate graph.
- **Execution / agent graph** — how work *moves* (plan → design → implement → QA → gates → release). Generated *from* the knowledge graph.
- **Loop** — local execution quality inside each meaningful node (discover → execute → verify → record → retry/repair).
- **Harness** — each node's bounded environment (context pack, tools, sandbox, permissions, memory, checkpoints).

Cross-cutting **Decision layer** sits over all of these: every structured decision — routing, scoring, classification, code↔design mapping, entity extraction, gate evaluation — is a typed probabilistic call, not free-form reasoning. Generation (writing code/design) is the **execution layer** (Claude Code). Slogan: **the decision layer decides, Claude Code creates.**

Guiding shift: stop asking *"what's the perfect prompt?"*, ask *"what workflow reliably produces the artifact?"*

## Canonical source
The ultimate reference is **`../autonomous-engineering-universal-context.md`** (123 sections). These `docs/` are the **distilled *decided* layer** on top of it. All decisions here were verified consistent with its Working Assumptions (§121) and answer its product-owner questions (§122). If the two ever conflict, reconcile against the canonical doc and log it in `past-info.md`.

## Locked decisions
| # | Decision | Value |
|---|----------|-------|
| 1 | Delivery modes (eventual) | **plugin + MCP + website**, decide which later. Audience: developers. |
| 2 | Core shape | **Headless core** library/service; plugin/MCP/website are thin frontends over one stable API. |
| 3 | State home | **Local-first** — `.agent/` in the user's repo holds artifacts + event log as files and structured state/graph in a **SQLite** DB (Postgres when hosted). |
| 4 | Repo modes | **Both** new-project generation *and* modify-existing-repo. |
| 5 | Runtime | **Claude Code only** (changed from earlier "multi-runtime now"). |
| 6 | Runtime selection | **User picks one per project** (currently trivially Claude Code). |
| 7 | Completion rule | A node is never "done" from agent self-judgment — completion **requires evidence**. |
| 8 | Repo ingestion | **Tiered** — cheap structural sweep over the whole repo + deep parse on demand per node. |
| 9 | Cheap-tier parser | **tree-sitter** per language (precise import/export/route edges). No-grammar languages fall back to file-tree-only. |
| 10 | Graph freshness | **Git-diff driven** — re-ingest only files changed since last ingest. |
| 11 | Graph granularity | **File/module nodes by default**; symbol-level nodes materialized on demand when a task deep-parses a file. |
| 12 | Code↔design mapping | **Two node layers + confidence edges.** Code nodes (FS) and design nodes (intent) stay distinct, joined by many-to-many `realizes`/`realized_by` edges carrying confidence + provenance. First-class states: **orphan code** (file, no design) and **unrealized design** (concept, no code). |
| 13 | Decision layer | **Decision-layer control plane.** Makes all structured decisions: graph routing, evidence scoring, code↔design mapping, entity extraction, QA judging, independent gate evaluation. Claude Code (the execution layer) does all generation. |
| 14 | Decision provider | **Structured-output LLM wrapper now → swap to Jev later**, behind one `Decision` interface. Same typed API either way. |
| 15 | Escalation | **Tiered: decision layer → execution-layer LLM → human gate**, driven by calibrated confidence. Thresholds are per-decision-type and versioned. |
| 16 | Visual QA | **Hybrid.** Vision LLM extracts structured facts from a screenshot → decision layer scores facts vs acceptance criteria → low-confidence triggers a deliberate vision-LLM re-check of the actual screenshot. |
| 17 | Decision schemas | Every decision point has a **predefined, typed, versioned schema** (in `.agent/policies/decisions/`). No untyped decisions. |
| 18 | Mapping provenance | Every mapping edge records **confidence + provenance** (`by_construction` \| `inferred` \| `human_confirmed`) **+ timestamp**. New-project mappings are by-construction (high confidence); modify-existing mappings are inferred and confirmable. |
| 19 | Core API paradigm | **Transport-agnostic command/query/event core + thin adapters** (MCP / HTTP / CLI / in-process). One contract, many wrappers. |
| 20 | Execution model | **Coarse / autonomous-only** for v1: a `run()` drives intake→ingest→plan→execute→loop, stopping only at a gate or completion. Per-node step control deferred (YAGNI until a visual-graph frontend needs it). Reads + gate-resolution + event stream stay. |
| 21 | State/graph store | Structured state + graph in **SQLite** (local `.agent/`) / **Postgres** (hosted); artifacts + event log stay as files in `.agent/`. |
| 22 | Design source of truth | **Design IR is canonical, versioned**; design-subgraph is projected from it. Design nodes get **stable IDs from IR element IDs** so mapping edges rebind across IR versions. |
| 23 | v1 intake modalities | **text, screenshots (vision LLM), existing code (tree-sitter), asset folders (manifest)**. URL/Figma/video/3D-deep/PDF stubbed behind the same interface. |
| 24 | Compiler internals | **Execution layer interprets → decision layer normalizes discrete/enum fields (+confidence)**; low-confidence → gate. Provenance recorded per field. Re-compile = IR v2 → diff → graph update. |
| 25 | Acceptance criteria | **Separate independent pass** (not compiler, not implementer) authors measurable criteria from **intent + IR**, bound to design elements, stored & versioned separately. Resolves the evaluation-leakage concern by construction. |
| 26 | Execution-graph generation | **Fixed template skeleton + dynamic fan-out.** Canonical skeleton (intake→plan→design→[impl fan-out]→integrate→QA→gate→release); the dynamic part is one impl+loop node per **unrealized design node**. Predictable + inspectable, still project-shaped. |
| 27 | Run safety ceilings | **Both.** Per-node repair **retry cap** (default 3) → escalate; plus a run **cost/step budget** → halt to gate when exceeded. Both configurable in `policies/`. |
| 28 | Default gates (v1) | **All four on:** design approval (post-compile IR review), low-confidence decisions (incl. inferred mappings, via the escalation ladder), risky ops (deps/migrations/deletions/security-sensitive), pre-release/final review. |
| 29 | Decision provider (now) | **Our own wrapper on Claude structured outputs** (Zod-typed + elicited confidence) behind the `Decision` interface. Jev later, same interface. |

## Recorded defaults (v1) — flagged, veto to change
- **Crash recovery:** `run` checkpoints after each node and is **resumable**; hitting a gate **halts and returns control** (never blocks), resumed by `gate.resolve`.
- **Baselines (modify mode):** capture build/tests/lighthouse snapshot at intake before edits, for comparison.
- **Test authorship:** gate-tests are **derived from the independent acceptance criteria**, not the implementer; implementer may add more.
- **Claude Code invocation:** via Claude Agent SDK / headless mode inside the `NodeExecutor` adapter.
- **Graph storage:** knowledge graph + execution graph are distinct node/edge **kinds in the one `state.db`**.
- **v1 KG domains:** design (IR) + code (ingestion) + evidence/criteria/decisions. Explicit API-contract/requirements domains deferred (folded into IR `constraints`).
- **Deferred to later versions:** multi-variant experiments, post-deploy monitoring/drift, multi-user/multi-project.
- **Known limitation:** generation isn't bit-reproducible (LLM nondeterminism); we version inputs/decisions/evidence, not exact outputs.
- ~~Deferred to #5 (sandbox)~~ → resolved below (#30–33).

## Sandbox / execution environment (#5)
| # | Decision | Value |
|---|----------|-------|
| 30 | Isolation unit | **Git worktree per node** (branched off the working-branch tip). Success → commit + advance the working branch; failure (after retry cap) → discard worktree, escalate to gate. |
| 31 | Concurrency (v1) | **Sequential**, behind a **parallel-ready worker abstraction**. Worktrees make parallel a later switch, not a graph reshape. INTEGRATION node stays as the merge seam (trivial while sequential). |
| 32 | Network policy | **Allow + audit/gate risky calls** — network on (it's the user's machine), harness logs all outbound calls and gates unusual ones (unknown hosts, credential-shaped payloads). FS baseline: **write-scoped to repo, secrets denied** (`.env`/credentials). |
| 33 | Git working model | **Dedicated working branch off HEAD**; per-node commits; **git is the checkpoint/rollback mechanism** (revert on failure, gate reviews the diff). Dirty tree at start → **auto-stash + restore**. |

## Remaining decisions (#3, #5b, #6–#10)
| # | Decision | Value |
|---|----------|-------|
| 34 | Deployment scope (#5b) | **Out of v1** — stop at verified build; working branch + evidence is the deliverable. RELEASE is a later gated node (deploy provider + secrets). |
| 35 | Model roster (#9) | **All-Claude, procedural independence.** Claude Code generates; Claude vision does visual-QA; Decision wrapper on Claude structured outputs; independent criteria/evaluator passes are **separate Claude calls** — independence is **structural** (criteria frozen pre-impl from intent), not model-level. Roster swappable via `policies/` for a cross-model evaluator later. |
| 36 | Monorepo (#6) | **Full multi-package orchestration.** Detect workspaces; each package = a KG sub-region; cross-package imports = dependency edges; execution **topologically ordered** across packages. (The one place v1 takes the heavier option.) |
| 37 | tree-sitter grammars (#6) | **TS/TSX/JS/JSX first**, then JSON/CSS/HTML, then Python; others via added grammars (file-tree-only until then). |
| 38 | Confidence thresholds (#8) | **Resolver implemented + self-checked** (`resolveEscalation` + `ThresholdPolicy` in `src/core/policy/`). Placeholders: default high 0.85 / mid 0.6; `map.classifyFileToDesign` high 0.9. Security-sensitive **outcomes** gate at the value level (separate from the confidence resolver). Values await calibration from logged (name, confidence, outcome). |
| 39 | Jev adoption (#10) | **Provider-routing seam implemented** (`providerFor` + `ProviderPolicy`). Stay on Claude-wrapper by default; swap **per-decision-type behind a flag** once access + a **parity harness** (record → replay → compare agreement + calibration per type) passes. Harness execution awaits Jev access. No caller changes. |
| 40 | Design IR schema (#3) | Zod-validated; every element has a **stable `id`**; discrete/enum fields are what decision layer normalizes. Sketch in `architecture.md` → Design Compiler. |
| 41 | Stubbed-modality order (#3) | Add after v1 core in order: **URL → Figma → PDF → deep video/3D**, behind the existing input interface. |

**#1 delivery-mode order:** CLI (done) → **MCP is the next and only additional adapter for now**; plugin + website deferred to future versions (order decided then).

## V2 decisions (2026-09-22 → 24)
| # | Decision | Value |
|---|----------|-------|
| 42 | Product identity | **Control and governance layer for AI coding agents**, web apps first. Agents execute; Weave governs, verifies, records. Restores canonical §4 ("the coding agent is a worker; the system is the engineering control plane"). |
| 43 | V2 scope | **Canonical §116 minus multiple runtimes**, plus policy packs: KG + evaluators + parallel + deploy, graph UI, multimodal compiler, asset/3D pipeline. |
| 44 | Sequencing | **Each subsystem carries its own defect fix.** No separate cleanup phase. |
| 45 | Demo | A **running acceptance test** that must stay green at every phase, not a finale. Robotics landing page, style `futuristic`. |
| 46 | Demo failure | **Natural**, from a strict check agents commonly miss; repair loop fixes it. Never faked. |
| 47 | Agent runtimes | **Agnostic seam, Claude Code only.** Reverses #5 in contract but not in adapters — a second vendor is added only when something demands it. |
| 48 | Agent boundaries | **Env scrub + the agent's native sandbox, OS sandbox as fallback.** Enforcement never lives in the prompt alone. |
| 49 | Part 4 lists | **Selectable policy packs**: every item is a requirement told to the agent *and* a check Weave runs (automatic, model-judged, conditional, or human-only). |
| 50 | Scaffold | **Built-in zero-dependency template with a command override.** Never touches an existing project. |
| 51 | Style selection | **`style:` directive in the brief**, engine default when silent. Unknown slug fails at intake. |
| 52 | Design system | **91 guides** in `design-guide/`, each with machine-readable tokens and style-specific checks (739 checks, ~86% deterministic). `_base.md` is the floor every style inherits. |
| 53 | Guides vs pictures | **The guide is the spec.** Conflicting reference pictures get re-filed; a guide changes only by explicit decision (done twice: `ascii-art` rewritten, `minimalism` given variants). |
| 54 | `.agent/` in git | **Commit the durable parts** (IR, requirements/criteria, evidence summaries, decision records); `state.db`, logs and screenshots stay out. Not yet implemented — V2.1. |
| 55 | Repo | **Private** on GitHub; v1.0.0 flagged pre-release; CI runs build + all checks + the design validator on every push. |
| 56 | Name and licence | **Deferred until launch.** `weave` on npm belongs to Weights & Biases; no licence while private. |
| 57 | Jev | **Access granted; docs received 2026-09-30** (see #84). Widen the `Decision` seam to typed multi-question calls and build the parity harness; adapter when the docs land. |
| 58 | Docs convention | Per `v2-inputs.md` item 80: keep `current-info.md` current, phase the plan, move superseded content to `past-info.md`. |

## V2.3 / V2.4 decisions (2026-09-29)
| # | Decision | Value |
|---|----------|-------|
| 59 | Parallel contract | **Ownership by construction.** Components write `sections/<id>.html` (+ `styles/sections/<id>.css`); a page owns its file (+ `styles/pages/<id>.css`); shared files belong to the scaffold and integration. A change outside a node's ownership fails verification, naming the file. Enforced only in the template's layout — for a project the template did not create, ownership is off and the record says so. Supersedes #31 (sequential by default). |
| 60 | Merge conflicts | **Re-run the node once on the new tip**, then gate. Replaces the plan's "rebase and re-verify": a rebase cannot resolve a textual conflict a merge could not. |
| 61 | Network policy | **Local proxy allowlist + audit.** Every host a node contacts is evidence; off-list hosts are refused and are a risk finding. Enforced for clients that honour `HTTPS_PROXY` (Claude Code does); a network namespace is the upgrade path. |
| 62 | Risk classification | **Deterministic rules always gate** (dependency change, migration, deletion, secret-shaped content or file, blocked egress). The decision layer (`risk.classifyOperation`) judges **every** node diff when `ANTHROPIC_API_KEY` is set, can add a gate but never remove one, and writes every verdict to the corpus. |
| 63 | Deploy target (#5) | **Vercel.** `VercelDeployer` builds and uploads `dist/`; the token reaches the `vercel` CLI through its own environment only, never argv, and never the agent. `CommandDeployer` remains for anything else. |
| 65 | Coverage | **One definition**: a requirement is covered when a verifying criterion has a passed or failed verdict. The metric and the report share the function. |
| 66 | Gate listing | **Latest run by default**; a run id or `all` widens it. |
| 67 | Whole-site repair | **One bounded `repair:policy` node before a policy gate**, verified against the exact failing items on its own assembled worktree. A second failure goes to the person. |
| 68 | IR tokens | **`designTokens` under the guides' own names**, core typed, long tail passed through, spacing under `layout` and allowed CSS lengths. Supersedes "the IR has no home for shape/motion/spacing". |
| 69 | Multimodal intake | **Text wins; readings add.** Screenshots via Claude vision (official SDK, structured outputs, refusal fallback), URLs parsed deterministically. Enum fields normalised with confidence; anything not accepted — and any style chosen from a reading — opens a `low-confidence` intake gate naming each field. Figma stays client-side. |
| 70 | Terminology | **Decision layer / execution layer.** "System One / System Two" retired outside the canonical doc and history. |
| 71 | Assets | **Acquired, never built.** A deterministic `asset:<id>` node acquires (repo, asset folder, URL), optimises where a tool exists, measures (headers parsed directly; glTF geometry) and budgets each asset. Missing or over budget → a `policy` gate with the numbers; approval waives that asset. |
| 72 | Asset budgets | **Per type, overridable in the brief** (`budget:`, `tris:`): 3D 2 MB / 100k triangles, image 300 KB / 2560 px, logo 50 KB / 1024 px, video 5 MB, font 150 KB. |
| 73 | Placement | **A requirement with three criteria**: within budget, placed (in its section when named — the placer fails verification otherwise), visible (judged from a render). Placement never implies visibility. |
| 74 | Browser | **Headless Chrome via its CLI** (`ChromeBrowserWorker`), Chrome's own sandbox kept on; Playwright stays the upgrade for console capture and full-page shots. |
| 64 | OS sandbox | **bubblewrap on Linux**: home secrets and deny-listed files masked, the user's checkout hidden (only `.git` kept). Layered under Claude Code's own deny rules (`--settings`). Where bubblewrap cannot run, each node records that it ran unsandboxed. |

## Direction decisions (2026-09-30, design discussion in progress)
Asked and answered; the discussion continues, so these may be refined — changes go to `past-info.md`.

| # | Decision | Value |
|---|----------|-------|
| 75 | Two ways to run | **Subscription mode** (Claude Code via your `claude` login) and **API mode** (the same Claude Code agents, authenticated with an API key and billed per token). |
| 76 | Agents in subscription mode | **One tmux window per agent, each in its own folder (worktree)** — works on Linux, macOS and WSL2; attach, detach, come back. |
| 77 | Human in the tab | **Watch and step in**: an interactive session you can type into; every message you type is recorded and **counts as a human intervention**. |
| 78 | Repair in the tab | **The same session continues**: failure reasons are sent in as the next message. |
| 79 | Permissions in the tab | **Fully automatic** within the sandbox and ownership rules; you step in only when you choose. |
| 80 | Decisions and vision | **Through the subscription** (`claude` CLI), Opus 5.5, validated JSON; refused/rate-limited → stop and ask. API providers kept for API mode. |
| 81 | Tests and benchmarks | Tests may use Claude. **Benchmarks: free open-source scorers only**, builds on the subscription — no API bill. |
| 82 | Platforms | **Linux, macOS and Windows (via WSL2)**; the new device's OS is undecided. **A macOS sandbox backend** will be built. |
| 83 | Repository | **Stays private.** Documentation pushed now and after every phase; `SETUP.md` is the new-device guide. |
| 84 | Jev API (docs received 2026-09-30, docs.typesafe.ai) | `POST https://api.typesafe.ai/v1/systemone`, `Bearer $TYPESAFE_API_KEY`, SDK `@typesafe-ai/sdk`. One `state` + a map of named questions answered in parallel: **Choice** (≤255 options), **Score** (2–10 levels), **Noul** (P(yes), **no confidence**). Pin `jev-1.13.0`, not `jev-latest`, once thresholds are tuned. 64k tokens/request, 32k for state + longest question → diffs filtered/chunked. **Text only** — vision stays on Claude (fits #16). $0.042/M input tokens. Errors 401/422/429/529. Key **not yet on this machine**. |
| 85 | Jev data | **Everything may be sent, code diffs included**, under the standard DPA (no training; ZDR is enterprise-only). |
| 86 | Screenshot intake site | `https://ai-robots.apps.mdxpreview.xyz/unitree-go2` — dark, GSAP scroll-driven Go2 page. Intake reads its **design only**; its images and copy ("All rights reserved") are not reused. A full capture needs the Playwright worker (D2); the Chrome CLI shot shows only the hero. |
| 87 | Robot model | **Unitree's own Go2 mesh** from `unitreerobotics/unitree_ros` (`robots/go2_description`), **BSD-3-Clause** — notice kept in the credits (not CC0; chosen over the CC0 options, which are cartoon mechs). 7 DAE parts (~25 MB) assembled from the URDF into one glTF and simplified to the 2 MB / 100k-triangle budget. |
| 88 | Device | **This Linux machine only** for all work and the demo. All platforms stay supported (#82): the macOS sandbox is still built, and ships marked **NOT verified here**. |

## Tech stack (locked)
| Concern | Choice |
|---|---|
| Language | **TypeScript** |
| Runtime | **Node.js 24 LTS** |
| Package manager | **pnpm** |
| Validation | **Zod** / Standard Schema-compatible |
| Graph | **Custom typed graph layer** initially |
| State | **SQLite** (local, inside `.agent/`) → **PostgreSQL** (hosted), by deployment target |
| Artifacts | **Filesystem** locally → object storage later |
| Agent interface | **`NodeExecutor`** (typed seam) |
| Agent adapter | **Claude Code** (first, only, adapter) |
| Harness | **Node-based runtime abstraction** |
| Browser | **Playwright-style browser worker** (browser + visual QA capture) |
| Code intelligence | **Tree-sitter** |
| MCP | **Official TypeScript MCP** ecosystem |
| CLI | **Node / TypeScript** |
| Web | **Next.js** |
| Observability | **Structured events + traces** (backs the append-only event log) |
| Workers | **TypeScript** initially; **Python** optional specialized later; **Rust** optional perf/system later |

Consequences: transport-agnostic core still holds, but frontends can now reach it **in-process** (TS plugin, Next.js) *or* via adapters (MCP/HTTP/CLI). `NodeExecutor` is the seam; Claude Code is the only adapter today (the multi-runtime seam preserved, unused). Claude Code runs as a subprocess of the harness; Decision provider is a TS HTTP client (LLM-wrapper → Jev).

## Engineering discipline (adopted from ML-systems material)
Reliability (evidence-gated completion, graceful failure), scalability (no single giant context), maintainability (inspectable `.agent/` tree), adaptability (versioned, re-executable graph), independent checkers (avoid evaluation leakage), baselines before claiming improvement, experiment tracking, post-deploy monitoring, version everything.

**Deterministic-first (canonical §113.7, §22):** prefer deterministic checks (build, typecheck, lint, tests, a11y/perf audits) over LLM/decision-layer judgment wherever a deterministic check exists. Model-assisted evaluation (visual QA, mapping, scoring) is only for what can't be checked deterministically.

**The four invariants (canonical §108–§111) — non-negotiable:**
1. No important transition without a **reason, a state change, and (where applicable) evidence**. Never "looks done."
2. **Never make the model's memory the source of truth** — truth = knowledge graph + state + artifacts + evidence + history. The model is a worker.
3. **Autonomy ≠ lack of control** — more autonomy demands stronger state, boundaries, evaluation, recovery, auditability.
4. **Complexity must be earned** — simple loop for simple work; graph for cross-domain; multiple agents only when specialization/parallelism/isolation justify it.

## Status (2026-09-29)

**v1:** complete. Phases 0–7 + ingestion + MCP + parallel worktrees + gated deployment; §115 DoD
met. The v1 phase plan is archived in `past-info.md`.

**V2.0:** shipped. A greenfield brief now produces a real, styled, verified build:

- **Harness state persists** (working branch, base branch, stash flag), so a later process can
  finish or cancel a run. The CLI flow used to strand the user on the weave branch with their
  work in a stash.
- **Gate history is kept** — sequenced ids, notes and `resolved_at`; notes reach the next
  attempt's context pack.
- **The graph learns**: completed nodes write code nodes and by-construction mapping edges, with
  evidence and attempt counts per node. An identical re-run plans nothing.
- **Parallelism is real** — the executor and verifier are async with timeouts (3×1s nodes:
  3.3s → 1.3s), and agents run with a scrubbed environment.
- **A scaffold node** creates a zero-dependency project before any agent, so `pnpm build` and
  `pnpm check` mean something in a fresh worktree. It refuses to touch an existing project.
- **Context packs carry the design guide** — tokens become `styles/tokens.css` and the agent is
  told the rules its work will be judged against.

**Design system:** 91 guides in `design-guide/`, 739 checks (~86% deterministic), 89 picture
folders in `demo-design/`, validated by `scripts/check-design.mjs`.

**Verification (at V2.0):** 18 self-checks plus the design validator. See "Verification now"
below for the current count.

**Credentialed adapters** (implemented, exercised via fakes): `ClaudeDecision` (API key),
`ClaudeCodeExecutor` (`claude` CLI), `PlaywrightBrowserWorker` (playwright).

**V2.1:** shipped. Requirements and criteria are first-class nodes, evidence is typed and
persisted, and `weave report` renders the chain requirement → design → code → criterion →
evidence → commit → approval. The five metrics are computed from the evidence and attempts
tables rather than re-derived. `design-approval` and `pre-release` are mandatory control points
and do not count as human intervention.

**V2.2:** shipped. Policy packs — 4 packs, 46 items, every item both a requirement told to the
agent and a check Weave runs:

- **Defaults:** `web-security` and `a11y` run on every project; `seo` and `performance` are
  opt-in via `packs:` in the brief.
- **Runners are dependency-free** so they work offline, in CI and in a fresh worktree. What
  needs a rendered page reports `unavailable`, and what only a person can confirm reports
  `human` — neither is ever counted as a pass.
- **Applicability facts** are derived from the tree and `package.json`. An item that does not
  apply is recorded as `not-applicable` with its reason; a payments rule firing on a brochure
  site is how a report gets ignored.
- **A blocking failure opens a `policy` gate,** it does not fail the run. Approving is a waiver,
  recorded with its reason, and covers exactly the items the gate named.

**V2.3:** shipped. Parallelism is a property of the graph:

- **A DAG, not a batch.** scaffold → components → pages (a page waits for its own sections) →
  integration. The scheduler runs the ready frontier, capped by `concurrency`; a batch of one is
  the sequential case, on the same path.
- **Ownership by construction** (#59). A node that edits outside its set fails verification and
  the report names the file.
- **Conflicts re-run on the new tip** once (#60), with both tries on the evidence trail.
- **Integration earns its name**: it assembles fragments into their pages (idempotently) and runs
  build + check on the whole site. Two sections that each pass alone can still break the page.
- **The report measures parallelism**: impl wall-clock against the serial sum (demo: 2.9s vs 4.9s).

**V2.4:** shipped. Boundaries that live outside the prompt, and a release that holds a secret:

- **Three layers per agent**: Claude Code's own deny rules, bubblewrap (#64), and the egress
  proxy (#61). Proven on this machine: unsandboxed, a probe agent reads both the worktree's and
  the checkout's `.env`; sandboxed, it reads neither.
- **Risky-op gates** (#62). A risky node is committed to its own branch and parked; one gate per
  batch lists every finding; approving integrates, rejecting discards.
- **Release** (#63): deploy evidence records URL, commit and log; the packs' page and header
  items re-run against the live URL. Four header items and an `http-header` runner bring the
  packs to 50 items. A live failure is recorded, not rolled back.

**Known gaps still open:** see `to-be-discussed.md`. Browser and visual QA (V2.7), stale-gate
listing (V2.5) and the IR token gap (V2.6) are closed.

## Open (see `to-be-discussed.md`)
- **#8** — escalation framework implemented; real threshold values await calibration data, which
  V2.4 starts producing by putting the decision layer in the run path.
- **#10 / #57** — provider routing implemented; Jev parity awaits access.
- Metric definitions (#1, #2), default packs (#3, #4) and the deploy target (#5 → Vercel, #63)
  are decided. Name and licence (#6) remain open.
- **The corpus has no real entries yet.** The decision layer is in the run path (#62), but a real
  run with `ANTHROPIC_API_KEY` is what fills it — the wiring is proven with a fake provider.

**V2.5:** shipped. The explorer (`weave report --html`): the whole run as one self-contained file.
The benchmark harness, third-party scorers only — **not yet run**. A pack failure now drives one
bounded repair before a person is asked. The README is outcome-first.

**V2.6:** shipped. The IR carries every token of the chosen guide (2,226 leaves across 91 guides,
checked). Screenshots and URLs are intake; uncertain readings gate. Style suggestion with reasons.
The 91 guides and their pictures are MCP resources a client can browse and choose from.

**V2.7:** shipped. Assets are acquired, measured and budgeted by the engine — no agent is asked to
build one. Placement is checked in the placing section and across the site; pages are rendered
by headless Chrome and the screenshots are evidence; visibility is judged on the hybrid path.
**V2 is complete** as planned — every phase shipped, each with the caveat that no real agent
run has exercised it.

**Verification now:** 31 self-checks plus the design validator. `pnpm demo` ends at
`first-pass 75% | repair 100% | coverage 64%`, 20 criteria passed and 2 failed — the two failures
are real: the demo's stand-in host sends no HSTS or Referrer-Policy header, and the live checks
say so. The demo also exercises the policy repair loop, acquires and places a 3D model, renders the
page with Chrome, and writes the explorer. Its screenshot shows the robot placed but not visible —
the case visual QA exists for.

**Not yet done with a real agent.** Every phase is proven with stand-in agents and recorded
readings. No credentialed run has happened, so the calibration corpus and the benchmark are
empty, and real Claude Code has not run inside bubblewrap.

**Fixed after review (2026-09-29):** a policy waiver now covers only the items its gate named;
`dep-audit` reports `unavailable` when the audit cannot run instead of passing; rejecting a gate
restores the user's branch and stash. Details in `implementation-v2.md` → V2.2.

**Deferred to V2.5:** the demo passes every runnable pack item, so *a pack failure driving a
repair* is proven by `policy-gate.check` but not yet by the demo itself — staged with the
benchmark in V2.5. Contrast and target size wait on the browser worker (V2.7).

**Next:** the demonstration plan in `demo-plan.md` (decided 2026-09-30): preflight, decisions and
vision through the Claude subscription, tools, real templates, rendered 3D, a measured first real
build, screenshot intake, a public Vercel deploy, the benchmark, Jev, and a recording kit.
