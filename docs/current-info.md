# Current Info

> Single source of truth for the **latest** decisions. When something changes, update it here and move the superseded version to `past-info.md`.

_Last updated: 2026-09-24_

> **Where things stand:** v1 is complete and archived. V2 is underway — phase V2.0 has shipped.
> The phased plan lives in `implementation-v2.md`; the raw source lists in `v2-inputs.md`.

## What the project is
A **graph-driven autonomous engineering platform** (**Weave**) that turns human intent + multimodal design inputs into software via bounded agent loops, with persistent state, evidence, and human gates.

Not "AI + loop → website." The mental model is four separated layers:

- **Knowledge graph** — what the project *is* (requirements, design, components, assets, APIs, constraints, decisions, tests). Design is one domain inside it, not a separate graph.
- **Execution / agent graph** — how work *moves* (plan → design → implement → QA → gates → release). Generated *from* the knowledge graph.
- **Loop** — local execution quality inside each meaningful node (discover → execute → verify → record → retry/repair).
- **Harness** — each node's bounded environment (context pack, tools, sandbox, permissions, memory, checkpoints).

Cross-cutting **Decision layer (System One)** sits over all of these: every structured decision — routing, scoring, classification, code↔design mapping, entity extraction, gate evaluation — is a typed probabilistic call, not free-form reasoning. Generation (writing code/design) is **System Two** (Claude Code). Slogan: **the decision layer decides, Claude Code creates.**

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
| 13 | Decision layer | **System One control plane.** Makes all structured decisions: graph routing, evidence scoring, code↔design mapping, entity extraction, QA judging, independent gate evaluation. Claude Code (System Two) does all generation. |
| 14 | Decision provider | **Structured-output LLM wrapper now → swap to Jev later**, behind one `Decision` interface. Same typed API either way. |
| 15 | Escalation | **Tiered: System One → System Two LLM → human gate**, driven by calibrated confidence. Thresholds are per-decision-type and versioned. |
| 16 | Visual QA | **Hybrid.** Vision LLM extracts structured facts from a screenshot → decision layer scores facts vs acceptance criteria → low-confidence triggers a deliberate vision-LLM re-check of the actual screenshot. |
| 17 | Decision schemas | Every decision point has a **predefined, typed, versioned schema** (in `.agent/policies/decisions/`). No untyped decisions. |
| 18 | Mapping provenance | Every mapping edge records **confidence + provenance** (`by_construction` \| `inferred` \| `human_confirmed`) **+ timestamp**. New-project mappings are by-construction (high confidence); modify-existing mappings are inferred and confirmable. |
| 19 | Core API paradigm | **Transport-agnostic command/query/event core + thin adapters** (MCP / HTTP / CLI / in-process). One contract, many wrappers. |
| 20 | Execution model | **Coarse / autonomous-only** for v1: a `run()` drives intake→ingest→plan→execute→loop, stopping only at a gate or completion. Per-node step control deferred (YAGNI until a visual-graph frontend needs it). Reads + gate-resolution + event stream stay. |
| 21 | State/graph store | Structured state + graph in **SQLite** (local `.agent/`) / **Postgres** (hosted); artifacts + event log stay as files in `.agent/`. |
| 22 | Design source of truth | **Design IR is canonical, versioned**; design-subgraph is projected from it. Design nodes get **stable IDs from IR element IDs** so mapping edges rebind across IR versions. |
| 23 | v1 intake modalities | **text, screenshots (vision LLM), existing code (tree-sitter), asset folders (manifest)**. URL/Figma/video/3D-deep/PDF stubbed behind the same interface. |
| 24 | Compiler internals | **System Two interprets → System One normalizes discrete/enum fields (+confidence)**; low-confidence → gate. Provenance recorded per field. Re-compile = IR v2 → diff → graph update. |
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
| 40 | Design IR schema (#3) | Zod-validated; every element has a **stable `id`**; discrete/enum fields are what System One normalizes. Sketch in `architecture.md` → Design Compiler. |
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
| 57 | Jev | **Waitlisted.** Widen the `Decision` seam to typed multi-question calls and build the parity harness; adapter when access lands. |
| 58 | Docs convention | Per `v2-inputs.md` item 80: keep `current-info.md` current, phase the plan, move superseded content to `past-info.md`. |

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

## Status (2026-09-24)

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

**Verification:** 18 self-checks plus the design validator, green locally and in CI on every
push. `pnpm demo` runs end to end with no credentials.

**Credentialed adapters** (implemented, exercised via fakes): `ClaudeDecision` (API key),
`ClaudeCodeExecutor` (`claude` CLI), `PlaywrightBrowserWorker` (playwright).

**Known gaps carried into V2.1:** evidence is still a string array rather than typed records;
`listGates()` spans runs, so approving by index can pick a stale gate; `browser-qa` and
`visual-qa` are marked `skipped`; the IR has no home for the guides' shape/motion/spacing tokens.

## Open (see `to-be-discussed.md`)
- **#8** — escalation framework implemented; real threshold values await calibration data, which
  V2.4 starts producing by putting the decision layer in the run path.
- **#10 / #57** — provider routing implemented; Jev parity awaits access.
- Metric definitions, default packs, deploy target, name and licence: see the open questions in
  `implementation-v2.md`.

**Next:** V2.1 — requirements, criteria, typed evidence and the five metrics. Plan in
`implementation-v2.md`.
