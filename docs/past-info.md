# Past Info

> Archive of prior thinking and superseded decisions, newest first. Never delete — this is the paper trail.

## 2026-09-24 — V2.0 shipped, and four defects caught in review

Phase V2.0 of `implementation-v2.md`: make one real greenfield run possible, fixing the four
reproduced defects on the way.

- **Defect A — harness state was memory-only.** The documented CLI flow is separate invocations,
  so the process approving the pre-release gate had no harness and never called `finish()`. The
  user was left on the weave branch with their uncommitted work stranded in a stash; `cancel()`
  had the same hole. `runs` gained `working_branch`, `base_branch` and `stashed` with an additive
  migration; `GitHarness` gained `state`, `adopt()` and `attach()` so a later process re-attaches
  instead of recomputing base from HEAD (which would have recorded the weave branch as base).
- **Defect B — gate ids collided.** `runId:kind` written with `INSERT OR REPLACE` meant a second
  failure gate erased the first's approval record. Ids are sequenced and inserted; gates carry
  `notes` and `resolved_at`, and notes now reach the next attempt's context pack.
- **Defect C — the graph never learned.** Nothing wrote design→code edges, so gaps stayed full
  and an identical re-run re-planned finished work. Completed nodes now upsert code nodes and
  by-construction mapping edges (falling back to the commit's file list), with evidence and
  attempt counts persisted per node.
- **Defect D — parallelism was fake.** `execFileSync` in the executor and verifier blocked the
  event loop, so `concurrency: 3` ran one agent at a time. Both are async with timeouts now:
  3×1s nodes went 3.3s → 1.3s. Agents also get a scrubbed environment.

Plus the scaffold node (zero-dependency template, refuses to touch an existing project) and
style-aware context packs (`style:` directive → one of 91 guides → `styles/tokens.css` + the
rules the agent is judged on).

**Found while reviewing that commit, before pushing:**
1. `TemplateScaffolder` overwrote `package.json`, `index.html` and `.gitignore` unconditionally —
   destructive in modify-existing mode, which is a supported project mode.
2. The style cache was keyed per engine, not per slug, so a second run inherited the first's guide.
3. Retries after a gate started blind; the context pack now seeds prior failures from recorded
   evidence.
4. An unknown style slug threw at execute time; `run()` validates it at intake.

**Also fixed:** `.agent/` now ignores itself (the root `.gitignore` is auto-stashed mid-run, which
let `git add -A` commit engine state into the user's history); `openGate` awaited its event
instead of firing and forgetting. **Footgun noted:** `listGates()` spans runs, so approving by
index can pick a stale gate.

Checks went 15 → 18 (`resume`, `style`, `build`). CI green on every push.

## 2026-09-23 — Design system: 91 style guides

Turned the 93-entry preset list in `weave_changes.odt` into a working design system.

- `design-guide/`: one guide per style with YAML tokens (palette, type, layout, shape, motion)
  and style-specific checks — **739 checks, ~86% deterministic**. `_base.md` holds the floor every
  style inherits (contrast, focus, target size, reduced motion, font budget, no fabricated
  testimonials); style bends around it, never below.
- `styles.json` reconciled 93 raw entries into 91 styles: 5 duplicate pairs merged, Atompunk and
  Dieselpunk split, the 4 combination entries kept as full styles.
- `demo-design/`: one picture folder per style; 32 references filed with provenance.
- `scripts/check-design.mjs` validates structure; it caught two corrupted hex values and a stray
  transparent black during authoring.

**Changed by evidence.** Reference pictures showed two guides had been written too narrowly:
`ascii-art` described a terminal while the references showed character rendering inside editorial
layouts, so it was rewritten and `terminal-ui` split out; `minimalism` gained four variants
(light, true-dark, grain, soft-gradient) because half the references failed its own checks. Six
references clustered around a style the set lacked, which became `bold-editorial`.

**Rule recorded:** the guide is the spec. Conflicting pictures get re-filed; a guide changes only
by explicit decision.

## 2026-09-22 — V2 direction set

Reviewed `V2_planing.md` against the code and found the docs were ahead of the implementation:
every green check drove a fake agent, and the real Claude path had never run. Four defects were
reproduced on throwaway repos before any decision was taken.

Decisions (now #42–58 in `current-info.md`): identity is the **control and governance layer for AI
coding agents**, web first — which is canonical §4 restored, not a pivot. V2 scope is §116 minus
multiple runtimes plus policy packs. Each subsystem carries its own defect fix. The demo is a
running acceptance test. Part 4's lists become selectable packs where each item is a requirement
*and* a check. Agent boundaries are enforced outside the prompt. Repo went private; v1.0.0 flagged
pre-release; name and licence deferred until launch.

**Superseded:** decision #5 ("Claude Code only") in contract — the `NodeExecutor` seam is now
genuinely agnostic, though Claude Code remains the only adapter.

## Archived — v1 implementation plan (phases 0–7), complete

`implementation-plan.md` is retired; its content is preserved here. Every phase exited on evidence.

- **Phase 0 — Scaffold & contracts.** Typed contracts, Design IR (Zod), graph kinds, state
  machines, `Decision` seam, policy resolvers, `NodeExecutor` + `GitHarness` seams, event log,
  `.agent/` init, CLI. Exit: build clean, checks pass, CLI works.
- **Phase 1 — Knowledge front.** `projectIR` → design subgraph with stable ids, `computeGaps`,
  `compileBrief`. Exit: brief → IR → design nodes → gaps, self-checked.
- **Phase 2 — Persistence.** SQLite store over one `state.db` (`kg_nodes`, `edges`, `runs`,
  `exec_nodes`), wired into `Engine`. Exit: cross-process demo — one process persists, a fresh
  process reads it all back through the public API.
- **Phase 3 — Decision provider.** `ClaudeDecision` (tool-forced structured output via `fetch`,
  no SDK dep), `FakeDecision`, `DecisionRunner` with escalation and a JSONL corpus. Exit:
  0.95→accept, 0.7→llm, 0.3→human, mapping stricter at 0.9.
- **Phase 4 — Execution.** Real `GitHarness` (working branch, worktree per node, commit/discard,
  auto-stash), `ClaudeCodeExecutor`, `runNode` loop with retry cap → escalate. Exit: on a real
  temp repo, success commits and fast-forwards; forced failure retries 3× then discards.
- **Phase 5 — Verification.** `DeterministicVerifier`, `BrowserWorker` seam with lazy Playwright,
  hybrid `visualQA`. Exit: nodes verified by deterministic checks, evidence written.
- **Phase 6 — Orchestration.** `buildExecGraph`, `Engine.run`/`resolveGate`/`cancel`, gates
  persisted, budget ceiling. Exit: run → design gate → fan-out with repair → pre-release gate →
  done, resumable.
- **Phase 7 — First demo.** `pnpm demo` end to end with no credentials. §115 V1 DoD met.
- **Ingestion track.** tree-sitter sweep, git-diff freshness, workspace detection, inferred
  code→design mapping. Dogfooded on this repo.
- **Post-V1.** MCP adapter, parallel worktrees, gated deployment.

Two review passes during v1 fixed: a parallel halt that leaked worktrees and broke resume;
QA nodes marked `complete` without running (now honestly `skipped`); a non-idempotent
`createWorkingBranch`; a too-loose verifier; and the `.agent/` auto-stash collision.


## 2026-09-19 — Decisions: remaining open items (#1, #3, #5b, #6–#10) + audit close
- **#5b Deployment = out of v1** — stop at verified build (working branch + evidence). RELEASE deferred to a later gated node. (Rejected in-v1 and flagged-optional.)
- **#9 Model roster = all-Claude, procedural independence** — Claude for generation, vision-QA, Decision wrapper, and the independent criteria/evaluator passes (separate calls; independence is structural — criteria frozen pre-impl from intent — not model-level). Roster swappable via policies for a cross-model evaluator later. (Rejected cross-model-now and configurable-now as premature.) Residual same-family-blind-spot risk acknowledged.
- **#6 Monorepo = full multi-package orchestration** — the one place v1 takes the heavier option. Detect workspaces; package = KG sub-region; cross-package imports = dependency edges; execution topologically ordered across packages. (Rejected single-package-only and detect-as-sub-nodes-lite.) **Grammars:** TS/TSX/JS/JSX → JSON/CSS/HTML → Python → others.
- **#3 Design Compiler leftovers:** IR Zod schema sketched (stable ids, enum fields normalized by System One); criteria-pass model resolved by #9 (separate Claude call from intent+IR); **stubbed-modality order = URL → Figma → PDF → deep video/3D**.
- **#7 Decision-schema catalog (v1):** ingest.classifyFileRole, interpret.normalizeField, map.classifyFileToDesign, criteria.normalizeMeasurable, qa.scoreEvidence, risk.classifyOperation, route.branch, gate.evaluate. Deferred: merge.classifyConflict, monitoring decisions.
- **#8 Confidence thresholds:** placeholders (high ≥0.85 / mid 0.6–0.85 / <0.6 human); per-type overrides; security-sensitive always gates; recalibrate from logged (decision, confidence, outcome). Real values pending calibration data.
- **#10 Jev adoption:** stay on Claude-wrapper default; adopt per-decision-type behind a flag once access + a parity harness (replay recorded state→decision pairs through both, require agreement + calibration within tolerance) passes.
- **#1 Delivery-mode order:** left to user; edge cases flagged (website biggest infra jump; plugin wraps MCP/CLI so MCP-before-plugin; MCP pairs with Claude Code).
- **Audit close:** flagged defaults from the prior audit stand (none vetoed). Docs made internally consistent.

## 2026-09-19 — Decisions: sandbox / execution environment (#5)
Local-first: node work runs on the user's machine against their repo; **git is the isolation + checkpoint + rollback mechanism** (git-diff already assumed).
- **Isolation = git worktree per node** (off the working-branch tip). Success → commit + advance branch, remove worktree; failure (after retry cap 3) → discard worktree, escalate to gate. Rejected: in-place edits (no isolation) and Docker-per-node (heavy, complicates Playwright+local repo; kept as a later tier).
- **Concurrency = sequential in v1, behind a parallel-ready worker abstraction.** Worktrees make parallel a later switch, not a graph reshape. INTEGRATION stays as the merge seam (trivial while sequential). Rejected: parallel-from-v1 (merge/conflict + concurrent-cost complexity now) and strictly-sequential-no-abstraction (harder retrofit).
- **Network = allow + audit/gate risky calls** (network on since it's the user's machine; harness logs outbound, gates unknown hosts / credential-shaped payloads). FS baseline (security, not simplified away): write-scoped to repo, secrets (`.env`/credentials) denied. Rejected: blanket-deny+allowlist (brittle, breaks installs).
- **Git model = dedicated working branch off HEAD**, per-node commits, revert-on-failure, gate reviews diff; dirty tree at start → **auto-stash + restore**. Rejected: commit onto current branch (mingles history) and refuse-on-dirty (more friction). `state.db` maps commit ↔ node/run.
- Later isolation tiers behind the same worker abstraction: Docker, Vercel Sandbox, cloud workers.

## 2026-09-19 — Plan + master doc + vertical slice started (Phase 1–2)
- Wrote `docs/implementation-plan.md` (phased build plan, evidence-gated, from canonical §91/§112/§114) and `docs/information.md` (consolidated master reference).
- **Started the vertical slice:**
  - **Phase 1 (knowledge front):** `projectIR(ir) → design-subgraph` (stable IDs) + `computeGaps → {unrealizedDesign, orphanCode}`. Pure, deterministic, self-checked.
  - **Phase 2 (persistence):** store decision = **better-sqlite3** (over node:sqlite [needs flag on Node 22] and in-memory-first). Implemented SQLite `GraphStore` (`kg_nodes` + `edges`, load/upsert/getNode/neighbors/gaps), wired into `Engine.getNode/neighbors/gaps` + CLI `graph`. Self-checked; `.agent/state.db` created on use.
  - Added `esModuleInterop` to tsconfig so better-sqlite3's CJS `export =` default-imports cleanly under strict ESM/NodeNext.
- All 4 self-checks pass (IR, policy, projection+gaps, store); build clean. Remaining Phase 2: exec-graph + run-state persistence, resumability, mapping queries. Then Phase 3 (Decision provider).

## 2026-09-20 — Review of ingestion/MCP/parallel/deploy + parallel-halt fix
Deep review of the newest subsystems. One real bug fixed + limitations documented:
- **Fixed (real bug): parallel halt left dangling worktrees.** `#executeParallel` pre-creates all worktrees; on an early return (escalation/merge-conflict) the remaining nodes' worktrees + branches leaked — and broke resume (`worktreeForNode` fails when the branch already exists). Added `GitHarness.discardAll()` + a `#haltParallel` helper that discards every still-open worktree and resets unfinished impl nodes to `pending` for clean resume. New regression check `parallel-resume.check` (node fails mid-batch → gate, asserts no dangling worktrees + ≥1 integrated + resumes to done). 15 checks total, all pass.
- **Documented limitations (not fixed — reasonable approximations):** `ingest --changed` uses working-tree dirty files (`git ls-files -m -o`), not a persisted "since last ingest commit" diff → misses committed-since-last-ingest changes; deletions leave stale code nodes (no removal pass). `detectPackages` + `walkCodeFiles` do two full walks (minor). Symlinked dirs are skipped (Dirent.isDirectory() false for symlinks → no cycle risk). MCP `run`/approve uses default Claude deps (needs creds — expected).
- Security re-check clean (execFileSync arg-arrays throughout ingest/deploy/mcp; `createRequire` for the native tree-sitter dep). Deploy script guard intact.

## 2026-09-20 — Phase 1 complete + Ingestion + MCP + parallel + deployment + V1 DoD
Per user request, completed a large batch (14 self-checks total, all pass; build clean):
- **Phase 1 fully complete:** added `compiler.check` (brief→IR→projection, partial-IR passthrough, invalid-asset rejection). Phase 1 marked DONE.
- **Ingestion track (full tree-sitter):** `parse.ts` (tree-sitter TS/TSX/JS/JSX via createRequire, regex fallback, NodeNext `.js`→`.ts` resolution), `sweep.ts` (walk → code nodes + `depends_on` edges, package/workspace detection → `package` nodes + cross-package edges, git-diff `--changed` freshness), `inferMappings` (code→design via `map.classifyFileToDesign` + escalate). `Engine.ingest`/`inferMappings` + CLI `ingest`/`map`. Dogfooded on our repo: 35 files, 79 edges, deps resolved. Native deps: `tree-sitter` + `tree-sitter-typescript` (peer-warn but works).
- **MCP adapter:** `src/mcp/server.ts` (McpServer, `@modelcontextprotocol/sdk` 1.30) exposing init/run/ingest/status/gaps/gates/resolve_gate/exec_graph as tools; `weave-mcp` bin; smoke check.
- **Parallel worktrees:** `concurrency` dep; refactored loop into `executeAndVerify` (git-free core) + `runNode`; `GitHarness.commitDetached`/`integrateBranch`; `#executeParallel` serializes git ops (worktree add, commit, merge) and parallelizes executor+verify (dir-isolated) — avoids concurrent-`git worktree add` races; merge conflict → gate. Check: 3 disjoint nodes integrate clean.
- **Gated deployment:** `Deployer` seam (`CommandDeployer` scrapes URL / `FakeDeployer`); `release` exec node; pre-release approve → deploy (working branch) → done, or skipped if no deployer. `deployment.started/completed` events. Off by default (#5b). Check passes.
- **V1 DoD (§115): MET** — demonstrated on real git repos.
- **Real Claude-built site:** documented exact commands in README (needs ANTHROPIC_API_KEY + `claude` CLI); not run here (no key). Bug fixes found along the way: tree-sitter export extraction (grammar structure) → regex export names; over-narrow decision generic in `inferMappings`.

## 2026-09-20 — Review of Phases 5–7 + two fixes
Deep review of the newest code (orchestrator, verify/browser/visual, compiler/plan). Two real fixes:
- **Honest QA statuses:** `#execute` was marking `browser-qa`/`visual-qa` **complete** without running them. Added a `skipped` `ExecNodeStatus`; now `integration`+`code-qa` = complete (per-node deterministic verify gated code; sequential ff-merge = integration), `browser-qa`+`visual-qa` = **skipped** (need a browser worker + served URL, not wired in the v1 default path). Pre-release gate summary says so.
- **Idempotent `createWorkingBranch`:** was `checkout -b` (fails if the branch exists) → now attaches (`checkout`) when the branch already exists, so a **fresh process can resume** an in-flight run. Added a loop.check assertion proving a second harness re-attaches.
- Security re-check clean (execFileSync arg-arrays, sanitized ids, key only in header). Documented remaining edge cases (Phase 6+): orphaned worktree if a process crashes mid-node; concurrent runs unsupported; integration/browser/visual QA need project-specific config + a served URL. Deploy script already carries the build+check guard.
- 9 self-checks pass; demo runs (now shows QA skipped honestly).

## 2026-09-19 — Phases 5, 6, 7 completed (V1 vertical slice done)
- **Phase 5 (verification):** `DeterministicVerifier` (runs checks in the worktree → pass/fail + evidence logs; self-checked with real subprocesses). `BrowserWorker` seam + `PlaywrightBrowserWorker` (lazy variable-specifier import so the dep stays optional) + `FakeBrowserWorker`. `visualQA` hybrid (vision extract → decision score → low-confidence pixel re-check; self-checked with fakes).
- **Phase 6 (orchestration):** `compileBrief` (line-directive/IR → IR), `buildExecGraph` (fixed skeleton + fan-out). `gates` table + store methods. `Engine.run`/`resolveGate`/`cancel` wired with **dependency injection** (real Claude by default; fakes injectable). Flow: run → design-approval gate → approve → fan-out impl via node loop → pre-release gate → approve → done; low-confidence gate on escalation; budget → risky-op gate. `init` now auto-gitignores `.agent/` (fixed a real auto-stash/pop conflict: engine state was being stashed and colliding on restore). CLI `run --brief/--ir/--name`, `approve/reject` wired.
- **Phase 7 (demo):** `examples/robotics-landing.brief` + `scripts/demo.mjs` (`pnpm demo`) — end-to-end run building files with a fake generator, no creds; proves §115 (persisted graph/state/evidence, evidence-gated completion, ≥1 repair loop, gates honored, resumable). Real Claude path documented (`weave run --brief … ` + approve).
- **Test-caught bugs fixed:** orchestrator check exposed (a) a too-loose verifier that let the repair loop no-op → switched to "worktree has uncommitted changes"; (b) impl count (page counts as a design node); (c) the `.agent/` auto-stash conflict.
- 9 self-checks pass; build clean; demo runs. **V1 vertical slice complete** (credentialed adapters exercised via fakes). Git still uncommitted.

## 2026-09-19 — Review of Phases 3–4 + deploy guard
- **Reviewed Phases 3–4.** Fixed one real hardening gap: `ClaudeDecision` now validates `value ∈ candidates` (the tool-schema enum isn't a hard guarantee; the decision layer must never emit an off-candidate value). Security pass clean: git/claude spawned via `execFileSync` with arg arrays (no shell → no injection); node ids `sanitize()`d before branch/dir use; API key only in the `x-api-key` header, never logged. Node loop + real GitHarness verified (commit-on-pass / discard-on-fail).
- **Documented edge cases** (Phase 6+, not bugs): working-branch name collision on re-run; `finish()` doesn't clean a still-open worktree on abort; ff-only merge assumes sequential; Claude adapters unrun offline.
- **Deploy script guard added:** `scripts/deploy.sh` now runs `pnpm install --frozen-lockfile` (if needed) + `pnpm build` + `pnpm check` before commit/push, aborting on failure (user chose the strict, non-skippable guard). Added `pnpm` to preflight. All 6 checks pass; script syntax-valid.

## 2026-09-19 — Phases 3 + 4 completed (decision provider + execution)
Env: no ANTHROPIC_API_KEY; `claude` CLI 2.1.278 present. Approach: build all machinery for real + verify with fakes; implement the two Claude-dependent adapters as real code (not runnable offline).
- **Phase 3 (Decision provider):** `ClaudeDecision` on the Messages API via `fetch` (tool-forced `{value,confidence}`, no SDK dep — ponytail), `FakeDecision` (deterministic), `DecisionRunner` (decide → `resolveEscalation` → append JSONL corpus with state for #10 replay). Model default `claude-sonnet-5`, configurable. Self-check (FakeDecision): 0.95→accept, 0.7→llm, 0.3→human, mapping stricter 0.9, corpus recorded.
- **Phase 4 (Execution):** real **`GitHarness`** (child_process git): `createWorkingBranch` (off HEAD + auto-stash), `worktreeForNode` (branch per node off working tip in an OS-temp worktree), `commitNode` (commit in worktree → `merge --ff-only` to advance working branch), `discardNode` (worktree remove + branch -D), `finish` (restore base + stash pop). `ClaudeCodeExecutor` via `claude -p --permission-mode acceptEdits` (Context Pack → prompt; changed files from `git status`). `runNode` loop: execute→verify→record→repair, retry cap 3 → discard+escalate; `Verifier` seam (deterministic build/test = Phase 5). End-to-end self-check on a real throwaway git repo + fake executor: success → commit + fast-forward onto working branch + file present; forced-fail → 3 retries → escalate, working branch unchanged, worktree discarded, only main worktree left.
- Fixed a convoluted `commitNode` staged-changes check (use `#hasStaged`). All 6 self-checks pass; build clean. Adapters needing creds are exercised via fakes.
- Next: **Phase 5** (deterministic QA build/test + Playwright browser/visual QA).

## 2026-09-19 — Review + GitHub auto-deploy script
- **Reviewed Phases 0–2.** Found + fixed one real bug: `init()` didn't create `state.db`, so `status()` reported `initialized:false` right after init — `init` now materializes the store (verified). No other correctness defects. Noted (not fixed, YAGNI): events are in-process only so CLI `watch` won't see cross-process events until it tails the jsonl; no store `close()` lifecycle (matters for MCP/web later); `emit()` mkdir-per-call; DB-row→union casts trust DB integrity.
- **Added `scripts/deploy.sh`** (auto-deploy to GitHub): full auto-sync — first run creates a **private** repo (name **Weave**, chosen by user) via `gh` + sets `origin`; every run `git add -A` → commit (msg arg or timestamped) → push. `set -euo pipefail`, gh preflight, branch-safe, "nothing to commit" handled. Env overrides `WEAVE_REPO`/`WEAVE_VISIBILITY`. Executable + `bash -n` clean. Also added `pnpm ship` alias (avoided `deploy` to not clash with the built-in `pnpm deploy`). Deliberately **no Claude session attribution baked in** (it's a reusable user tool; hardcoding a session into future commits would be wrong). Not run by me — user runs it (`./scripts/deploy.sh "msg"`).
- Env facts: `gh` 2.96.0 authed as Adhirajsingh2507; git identity set; no remote yet → slug will be `Adhirajsingh2507/Weave`.

## 2026-09-19 — Phase 2 completed (persistence)
Extended the SQLite store to the full state.db: added `runs` + `exec_nodes` tables (commit↔node), plus `kg.query` and `kg.mappings` (with provenance/confidence/node filters). Added `RunRecord` type. Wired `Engine`: `status` now reflects latest run + gap counts; added `query/mappings/getRun/getExecGraph`. Added `esModuleInterop` earlier for better-sqlite3. **Exit criterion met via a cross-process demo:** process A persisted a run (gated, cursor impl:nav, budget 4) + exec nodes (impl:hero complete @ commit c0ffee, impl:nav pending) + KG, then exited; a fresh process B read it all back through the public Engine API. Caught + fixed a test-expectation bug (nameContains "Hero" matches both the Hero component and Hero.tsx). Note: `run`-driven population is Phase 6; Phase 2 proves the persistence machinery. Next: **Phase 3 — Decision provider** on Claude structured outputs.

## 2026-09-19 — #1 resolved + #8/#10 frameworks designed & implemented
- **#1 delivery order resolved:** CLI (built) → **MCP is the next and only additional adapter**; plugin + website deferred to future versions (order decided then). (User: "first only build the mcp then we will decide plugin and website for next versions.")
- **#8 threshold framework — implemented** (not just noted): `src/core/policy/` ships `ThresholdPolicy` (Zod) + pure `resolveEscalation(name, confidence, policy) → accept|llm|human`, self-checked. Placeholders default 0.85/0.6, `map.classifyFileToDesign` high 0.9. Refinement: "security-sensitive always gates" is a **value-level** rule on `risk.classifyOperation` outcomes, not part of the confidence resolver (which sees only name+confidence). Real values await calibration data.
- **#10 Jev framework — routing seam implemented + harness spec'd:** `providerFor` + `ProviderPolicy` (per-type provider + parity tolerances) implemented; the parity harness (record → replay → compare agreement + calibration per type → per-type flag swap → rollback) documented in architecture.md, execution deferred until Jev access + a decision corpus exist.
- Scaffold still green (build + both self-checks pass). Policy exports added to the public barrel.

## 2026-09-19 — Read canonical context doc + scaffolded the repo
- **Discovered & read `autonomous-engineering-universal-context.md`** (4609 lines, 123 sections) — the canonical source the two ChatGPT memos were distilled from. I had missed it initially (mistook the user's "read the new autonomous-engineering-universal-context" for a label). Verified our decisions against it: **fully consistent** with its Working Assumptions (§121) and correctly answer its product-owner questions (§122). No contradictions. `docs/` are now framed as the distilled *decided* layer over the canonical doc.
- **Absorbed principles we'd under-weighted:** deterministic-checks-first (§113.7/§22) and the four invariants (§108–§111: evidence-gated transitions; model-memory-is-not-truth; autonomy needs stronger control; complexity must be earned). Added to `current-info.md`/`architecture.md`.
- **Scaffolded the repo** (per §112/§113: contracts & schemas before implementation, seams not implementation). Stack: TS / Node ≥22.6 (target 24) / pnpm / Zod. Single package (extract to workspaces per §58 later). Files: `Engine` core API (commands/queries/events), Design IR Zod + self-check, KG/exec graph types, project/node state machines (§97/§98), `Decision` seam + v1 catalog, `NodeExecutor` seam + `GitHarness`, event log (§100 taxonomy), `.agent/` init, CLI. Verified: build clean, `pnpm check` passes, CLI init/status/help work, unwired seams throw. Git init on `main` (not committed).
- **Fidelity fixes** to align scaffold with canonical: event names → §100; encoded §97/§98 state machines as types.
- Next per §112/§114: one end-to-end vertical slice (see `to-be-discussed.md`).

## 2026-09-19 — Full audit + gap-closing decisions
Audited all four docs. Fixed 2 contradictions: (1) stale "Open" list in current-info; (2) `.agent/` layout showed graph/state as JSON files but decision was SQLite → reconciled to `state.db` + files for the rest.

Fork decisions taken:
- **Execution-graph generation = fixed template skeleton + dynamic fan-out** (one impl+loop node per unrealized design node). Rejected fully-dynamic synthesis (unpredictable, hard to keep small) and fixed-pipeline-only (loses per-design-node granularity). Resolves the doc's internal tension between "generated from KG" and the fixed pipeline.
- **Run safety ceilings = both** per-node repair retry cap (default 3 → escalate) and run cost/step budget (→ halt to gate). Prevents infinite repair loops and runaway spend.
- **Default gates (v1) = all four:** design approval (post-compile IR), low-confidence decisions (incl. inferred mappings), risky ops (deps/migrations/deletions/security), pre-release/final review.
- **Decision provider now = our own wrapper on Claude structured outputs** (Zod-typed + elicited confidence) behind the `Decision` interface; Jev later. Rejected depending on TypeSafe's LLM-wrapper (another early-access dep); kept the interface so it's swappable.

Recorded defaults (flagged, vetoable): resumable checkpoint-per-node + gate-halts-and-returns; baseline snapshot at intake (modify mode); gate-tests derived from independent criteria; Claude Code via Agent SDK/headless; KG+exec graph as distinct kinds in one `state.db`; v1 KG domains = design+code+evidence/criteria/decisions (API/requirements deferred into IR constraints); deferred multi-variant experiments, post-deploy monitoring/drift, multi-user; noted generation is not bit-reproducible. Deferred to #5: concurrency, permissions+network, git-checkpoint/rollback. New open item surfaced: deployment/RELEASE scope.

## 2026-09-19 — Decisions: Design Compiler (intake) + acceptance criteria (#3, #4)
- **Design IR is canonical + versioned**; design-subgraph projected from it. Design nodes carry **stable IDs from IR element IDs** so code↔design mapping edges rebind across IR versions (the sync-back caveat of choosing IR-canonical). Rejected: graph-canonical (IR-as-view) and IR-as-transient.
- **v1 intake modalities:** text, screenshots (vision LLM), existing code (tree-sitter, reconciled with intent), asset folders (manifest). URL/Figma/deep-video/3D/PDF stubbed behind the same input interface.
- **Compiler internals:** System Two (LLM/vision) interprets → System One normalizes discrete/enum fields with calibrated confidence → low-confidence opens a gate. Confidence present from intake. (Rejected: single LLM pass with no intake confidence.)
- **Acceptance criteria = separate independent pass** (distinct from compiler AND implementer), authored from intent + IR, frozen pre-implementation, bound to design elements, versioned separately. Independent of the implementer by construction → resolves evaluation-leakage worry (#4). User chose this over the lighter "compiler-generates-from-intent" option.
- **Defaults recorded (flagged for confirmation):** every IR field/design node records source **provenance** (also responsible-AI asset ownership); **re-compilation is versioned + diffed** (IR v2 → diff → graph update), incremental live-merge deferred; criteria pass reads raw intent + IR and binds to IR elements.

## 2026-09-19 — Decisions: tech stack + core API surface

**Correction:** an AskUserQuestion answer briefly recorded the core language as **Python**; the user overrode this — the language is **TypeScript**. Full stack provided (see `current-info.md` stack table): TS / Node 24 / pnpm / Zod / custom typed graph / SQLite→Postgres / filesystem→object storage / `NodeExecutor` interface / Claude Code adapter / Node harness / Playwright browser worker / tree-sitter / official TS MCP / Node CLI / Next.js web / structured events+traces / TS workers now, Python & Rust optional later.

**Core API surface decisions:**
- **Paradigm:** transport-agnostic **command/query/event core + thin adapters**. (Rejected MCP-first and HTTP-service-first as leaking transport into the core.)
- **First adapter:** **CLI** (Node). Simplest, local-first native, invokable by humans and Claude Code. MCP/HTTP/in-process wrap the same core later.
- **Execution model:** **coarse / autonomous-only** for v1 — one `run()` drives intake→ingest→plan→execute→loop, stopping at a gate or completion; plus `cancel()`. Per-node control (runNode/pause/skip) **deferred** (YAGNI until visual-graph frontend). Reads + `gate.resolve` + event stream stay.
- **Observation:** append-only `.agent/history/execution-log.jsonl` + `events.subscribe()` (structured events + traces).
- **Simplification:** mapping confirmation folds into `gate.resolve` (a low-confidence inferred mapping *is* a gate) — no separate confirm/reject-mapping commands in v1.
- **State refinement:** local-first `.agent/` = artifacts + event log as files **+ SQLite** for structured state/graph; **Postgres** when hosted.

## 2026-09-19 — Decisions: code↔design mapping + Jev decision layer

**Jev (TypeSafe AI, "System One Model", announced 2026-09-15).** Not a code generator — a structured-decision engine: unstructured state in → typed probabilistic decisions out, with calibrated confidence. Can't hallucinate, no type errors, ~70–500ms, output ~free, input $0.042/MTok. Parallel sampler (all outputs one query). Cardinality ≤ 255. No vision (structured state, not images). Early-access/waitlist. Ships a "System One LLM wrapper" that constrains an LLM to the same structured-decision API. Named after Kahneman's System 1 (fast) vs System 2 (slow); Jevons paradox for the "Jev" name.

**Decisions taken:**
- **Code↔design mapping = two layers + confidence edges.** Code nodes (FS, ground truth) and design nodes (intent) stay distinct in one graph, joined by many-to-many `realizes`/`realized_by` edges with confidence + provenance + timestamp. First-class states: *orphan code* (file, no design) and *unrealized design* (concept, no code — the latter literally defines the work; new-project = all-unrealized). Rejected: unify-into-one-node (false 1:1, breaks on utils/multi-file components) and design-first-code-as-attribute (loses code-side ripple reasoning). Provenance differs by mode: **by-construction** (new project, high confidence) vs **inferred** (modify-existing, fallible → confirmable).
- **Jev = control plane / System One.** All structured decisions (routing, scoring, classification, code↔design mapping, entity extraction, QA judging, independent gate evaluation). Claude Code = System Two = all generation. "Decision layer decides, Claude Code creates." This makes the graph's routing/gating concrete and gives the independent evaluator that guards against evaluation leakage.
- **Dependency strategy: LLM-wrapper now → Jev later**, behind one `Decision` interface (same typed API). De-risks Jev's early-access status; swapping providers changes no callers. (Considered but rejected: Jev-only hard commit.)
- **Escalation: tiered System One → System Two LLM → human gate**, driven by calibrated confidence; thresholds per-decision-type and versioned. This operationalizes "human at the expensive boundary."
- **Visual QA = hybrid.** Vision LLM extracts structured facts from screenshot → decision layer scores vs acceptance criteria → low-confidence triggers a deliberate vision-LLM re-check of the actual pixels. (Rejected: vision-LLM-extracts-and-judges — no calibrated confidence, leakage risk.)
- **Filled gaps (defaults, override if disagree):** typed+versioned schema per decision point (`.agent/policies/decisions/`); cardinality >255 handled by code-graph pre-filter + 2-stage score-then-choose; every mapping edge records confidence/provenance/timestamp.

## 2026-09-19 — Decision: repo ingestion depth
Resolved the open ingestion question. Chose **tiered** (cheap structural sweep + deep-parse on demand) over pure-lazy (planner blind on partial graph) and full-upfront (slow/stale on big repos). Cheap tier uses **tree-sitter per language** (grammar-less languages → file-tree-only). Freshness is **git-diff driven**. Granularity is **file/module by default, symbols on demand**. Reasoning: planner wants broad-shallow, executor wants deep-narrow — tiered serves both and only pays for detail where used.

## 2026-09-19 — Decision change: runtime
- **Earlier:** multi-runtime abstraction from day one (Claude Code / Codex / OpenHands interchangeable via a node-executor contract).
- **Now:** **Claude Code only.** Runtime selection ("user picks one per project") is therefore trivial for now. Multi-runtime may return later; if so, the node-executor contract seam is the intended boundary.

## 2026-09-19 — Source concept docs (two ChatGPT design memos)

### Memo 1 — "Revised vision: agent engineering platform"
Reframed the idea from "AI + loop + graph → website" to an **agent engineering platform**:
Knowledge graph = what the project knows; Agent graph = how work moves; Loop = how each worker improves its result; Harness = environment/tools/context/permissions/execution controls.

Key points:
- 4 layers: Intent/Input → Project Knowledge Graph → Agent Graph → Agent Loop → Agent Harness.
- Removed "Design Graph" as a separate fundamental graph; design becomes a domain *inside* the knowledge graph. Everything relational (e.g. `Hero uses→ hero.glb`, `belongs_to→ Home`, `verified_by→ HeroVisualTest`).
- Execution graph generated from knowledge graph; planner → parallel workers → checker → merge → human gate.
- Every meaningful node contains a loop ("Graph determines the route. Loop determines local execution quality.").
- Persistent state system so agents can hand off (current_graph, completed/active/failed nodes, decisions, artifacts, evidence, results, approvals, history).
- Artifact layer with a paper trail (`.agent-system/` tree).
- Independent checkers (code / browser / visual / design), no self-grading.
- Measurable acceptance criteria per design requirement.
- A "Design Compiler": multimodal inputs → Knowledge Graph + Design IR (design interpreted once).
- 3D assets as first-class graph entities.
- Harness gives each node a Context Pack (task, relevant nodes/files, rules, constraints, prior failures, tools, permissions).
- Permissions modeled in the graph per agent/node.
- Human approval is an explicit graph node at expensive decision boundaries.
- Keep the graph small — smallest graph that improves quality.
- Proposed 8 decisions (scope, existing repos, autonomy, runtime, graph UI, multimodal input, user authority, gated deployment).

### Memo 2 — "ML-systems engineering discipline"
Layered production ML/software-platform rigor on top:
- Four system requirements: reliability, scalability, maintainability, adaptability; lifecycle is iterative not one-way.
- Reliability = evidence-gated completion, graceful failure (never "looks good").
- Scalability across project / task / agent / team dimensions; no single giant context.
- Maintainability = standardized, documented, version-controlled, inspectable `.agent/` tree; answer "why did the system do this?".
- Adaptability = versioned, re-executable graph (graph v1 → evidence → graph v2).
- Experiments as native objects (record inputs, hypothesis, implementation, metrics, evidence, outcome).
- Baselines before claiming improvement.
- **Evaluation leakage** analogue of data leakage — implementer must not also author the tests that verify its own assumptions.
- Post-deploy monitoring → detect → create task → execution graph → repair → redeploy.
- Environment drift (dependency/API/design/infra/perf/test/requirement drift) → auto-create graph work.
- Continual learning = improve engineering policies from accumulated evidence, not train own model.
- Infrastructure layer (orchestrator, execution environments, artifact store, state store).
- Version everything (code, design spec, graphs, agent config, prompts, policies, eval criteria, tests, artifacts).
- Human-centered failure UX (explain reason + evidence + suggested repair, not "Agent failed").
- Responsible AI embedded throughout (security, privacy, licensing, accessibility, data handling, model safety); track reference/asset provenance.
- Six engines: Intent, Knowledge, Graph, Agent/Harness, Loop, Quality/Observability.
- Conceptual hierarchy: prompt → context → harness → loop → graph → system engineering.
- Proposed a 20-section V1 System Specification as the next artifact.

### Superseded initial framing
- Original idea: "an AI that builds my website" / "AI + loop → website." Superseded by the platform framing above.
- Earlier suggestion of "Design Graph + Execution Graph" as two fundamental graphs → replaced by "Project Knowledge Graph + Agent Execution Graph."
