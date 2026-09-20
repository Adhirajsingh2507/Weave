# Implementation Plan

> Phased build plan for the platform. Derived from the canonical doc's V1 Technical Strategy (§91), First Tasks (§112/§114), V1 Scope (§61), and the decisions in `current-info.md`. Every phase exits on **evidence** (invariant §108), not "looks done".

_Last updated: 2026-09-19_

## Principles that govern the plan
- **Smallest thing that proves the loop first** (§112, ponytail). No speculative infra.
- **Contracts/schemas before implementation** (§113.5) — mostly done in Phase 0.
- **Deterministic checks before LLM judgment** (§113.7).
- **Preserve graph/state/evidence semantics even while V1 is local** (§113.6).
- Each seam stays swappable (NodeExecutor, Decision provider, GraphStore).

## Phase 0 — Scaffold & contracts ✅ DONE
Typed contracts + CLI + policy resolvers; build + self-checks green.
- `Engine` core API, Design IR (Zod), graph node/edge kinds, project/node state machines, `Decision` seam + catalog, policy resolvers (escalation + provider routing), `NodeExecutor` + `GitHarness` seams, event log, `.agent/` init, CLI.
- **Exit:** `pnpm build` clean, `pnpm check` passes, CLI `init/status` work. ✔

## Phase 1 — Knowledge front (intent → knowledge graph) ✅ DONE
Prove the front of the loop with **no LLM/DB/agent** needed.
- ✅ Graph projection `projectIR` + `computeGaps` — implemented + self-checked.
- ✅ `compileBrief` (line-directive/partial-IR → IR) — the deterministic intake; self-checked (`compiler.check`). LLM interpreter remains the documented upgrade.
- ✅ `Engine.gaps()` / `kg.query` / `kg.mappings` over the persisted graph (with Phase 2 store).
- ✅ **Exit met:** brief → IR → design nodes → gaps, self-checked end to end.

## Phase 2 — Persistence (graph + run state) ✅ DONE
Durable state + resumability (invariant §109: state is truth, not model memory). Store = **better-sqlite3**.
- ✅ SQLite store over one `state.db`: `kg_nodes`, `edges`, `runs`, `exec_nodes` tables.
- ✅ KG: `loadGraph/upsert/getNode/neighbors/query/mappings/gaps`.
- ✅ Run state + exec graph: `createRun/getRun/latestRun/updateRun`, `upsertExecNode/getExecGraph/getExecNode`, with **commit ↔ node** column.
- ✅ Wired into `Engine`: `status` (reflects latest run + gap counts), `getNode/neighbors/query/mappings/gaps/getRun/getExecGraph`; CLI `graph` + enriched `status`.
- ✅ **Exit met:** cross-process demo — process A persists a run/exec-graph/KG then exits; a **fresh** process B reads back the run cursor, exec-node statuses (+commit), and gaps via the public API. (`run`-driven population arrives in Phase 6; the persistence machinery is proven now.)

## Phase 3 — Decision provider (System One) ✅ DONE
- ✅ `ClaudeDecision` — our wrapper on Claude structured outputs via the Messages API (tool-forced `{value, confidence}`, `fetch`, no SDK dep). Runs with `ANTHROPIC_API_KEY` (unset here → verified via fake).
- ✅ `FakeDecision` — deterministic provider for tests/offline.
- ✅ `DecisionRunner` — decide → `resolveEscalation` (accept/llm/human) → append to the JSONL **corpus** (with state, for #10 replay + #8 calibration).
- ✅ **Exit met** (runner.check, FakeDecision): 0.95→accept, 0.7→llm, 0.3→human, mapping stricter at 0.9; corpus line recorded with state.

## Phase 4 — Execution (harness + agent) ✅ DONE
- ✅ `GitHarness` (real git): `createWorkingBranch` (off HEAD, auto-stash dirty tree), `worktreeForNode` (branch per node off working tip), `commitNode` (commit → **fast-forward** the working branch), `discardNode` (drop worktree+branch = rollback), `finish` (restore base + pop stash).
- ✅ `ClaudeCodeExecutor` via `claude -p` headless (Context Pack → prompt, `--permission-mode acceptEdits`, changed files from `git status`). Runs with the `claude` CLI (not exercised offline).
- ✅ `runNode` loop: execute → verify → record → repair, **retry cap 3 → escalate**; `Verifier` seam (deterministic build/test verifier is Phase 5).
- ✅ **Exit met** (loop.check, real temp git repo + fake executor): success writes `hero.tsx` → commit + fast-forwarded onto the working branch; failure retries 3× → discard + escalate, working branch unchanged, worktree cleaned. Adapters (`ClaudeCodeExecutor`) exercised via a fake; live run needs the `claude` CLI.

## Phase 5 — Verification (deterministic-first) ✅ DONE
- ✅ `DeterministicVerifier` — runs configured checks (build/test/…) in the worktree; pass/fail + evidence logs. No LLM. Self-checked with real subprocesses.
- ✅ `BrowserWorker` seam + `PlaywrightBrowserWorker` (lazy-imports playwright — optional dep) + `FakeBrowserWorker`.
- ✅ `visualQA` hybrid: vision extract → decision-layer score → low-confidence pixel re-check; self-checked with fakes.
- ✅ **Exit met:** nodes are verified by deterministic checks; evidence written. (Playwright/vision adapters real but unrun offline.)

## Phase 6 — Orchestration (autonomous run + gates) ✅ DONE
- ✅ `compileBrief` (text/IR → IR), `buildExecGraph` (fixed skeleton + fan-out).
- ✅ `Engine.run`/`resolveGate`/`cancel` wired; gates persisted (`gates` table); DI of executor/verifier/harness (real Claude by default, fakes injectable).
- ✅ Default gates: design-approval → execute → pre-release; low-confidence on escalation; risky-op on budget.
- ✅ Run cost/step budget → halt to gate.
- ✅ **Exit met** (orchestrator.check, real git + fake executor): run → design gate → resume → fan-out (with a repair loop) → pre-release gate → done; persisted; a fresh Engine reads the final state.

## Phase 7 — First demo (§62/§93) ✅ DONE (fakes; real-Claude swap documented)
- ✅ `pnpm demo` + `examples/robotics-landing.brief`: end-to-end run building files, gated, repair loop, resumable — runs with no creds.
- ✅ **§115 V1 success met** on a run: persisted graph/state/evidence, evidence-gated completion, ≥1 repair loop, human gates honored, resumable.
- Real Claude-built site: `node dist/cli/index.js run --brief examples/robotics-landing.brief --name robotics-landing` then `approve` (uses `ClaudeCodeExecutor` + `ANTHROPIC_API_KEY`).

## Ingestion track (modify-existing mode) ✅ DONE
- ✅ tree-sitter cheap sweep (TS/TSX/JS/JSX) → code nodes + `depends_on` edges; regex fallback for other langs (`parse.ts`).
- ✅ git-diff freshness (`ingest --changed`); package/workspace detection → `package` nodes + cross-package edges (`sweep.ts`).
- ✅ code→design inferred mapping via `map.classifyFileToDesign` (`inferMappings`; low-confidence → escalate). Self-checked; dogfooded on our own repo (35 files, 79 edges).
- ✅ `Engine.ingest`/`inferMappings` + CLI `ingest`/`map`. (Deep symbol-on-demand: parser supports it; not yet a distinct API — minor.)

## Post-V1 (future versions)
- ✅ **MCP adapter** — `weave-mcp` server exposes the Engine as MCP tools (`src/mcp/`).
- ✅ **Parallel worktrees** — `concurrency` dep; git ops serialized, executor+verify concurrent; merge conflict → gate. Self-checked (3 disjoint nodes).
- ✅ **Deployment gated RELEASE node** — `Deployer` seam (`CommandDeployer`/`FakeDeployer`); pre-release approve → deploy. Off by default (#5b). Self-checked.
- ☐ **#8** threshold calibration from the decision corpus (needs runtime data).
- ☐ **#10** Jev parity harness + per-type swap (needs Jev access).
- ☐ Post-deploy monitoring → drift → new graph work; experiments (multi-variant); cross-model evaluator; plugin + website delivery modes.

## V1 definition of done (§115) — ✅ MET
Demonstrated end-to-end on real git repos (`pnpm demo` + orchestrator/parallel/deploy checks): intent → verified build with **persisted graph + state + evidence**, **evidence-gated node completion**, **≥1 repair loop**, **human gates honored**, and a **resumable run**. Credentialed adapters (Claude executor/decision, Playwright, real deploy) are implemented and exercised via fakes; a real Claude build is one documented command away (README → "Real Claude-built site").
