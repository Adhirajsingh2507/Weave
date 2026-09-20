# INFORMATION — Master Reference

> The single consolidated reference for the **Weave** project: vision, principles, every decision, the full architecture, the scaffold, and what's open. Consolidates `current-info.md` (decisions), `architecture.md` (design), `implementation-plan.md` (build plan), `to-be-discussed.md` (open), and `past-info.md` (history). Those remain the working docs; this is the read-once overview.
>
> **Ultimate source of truth:** `../autonomous-engineering-universal-context.md` (canonical, 123 sections). This project's docs are the *distilled decided layer* over it.

_Last updated: 2026-09-19_

---

## 1. What it is
A **graph-driven autonomous engineering platform** that turns human intent + multimodal design inputs into software through bounded agent loops, with persistent state, evidence, versioning, and human gates.

**One sentence (canonical §120):** humans define intent, constraints, and acceptance criteria; a knowledge model represents what the project is; a graph defines how work flows; agent harnesses give bounded execution; local loops implement and repair; independent evaluators provide evidence; and persistent state + observability let the system operate over the project's lifetime.

**Not** "AI + loop → website." **Guiding shift:** stop asking *"what's the perfect prompt?"*, ask *"what workflow reliably produces the artifact?"*

**Audience:** developers. **Eventual delivery:** CLI (built) → MCP (next) → plugin + website (future versions).

## 2. Mental model — four layers + a decision plane
- **Knowledge graph** — what the project *is* (design ↔ code as two layers joined by confidence-weighted mapping edges; plus assets, criteria, evidence, decisions).
- **Execution / agent graph** — how work *moves* (fixed skeleton + one impl node per unrealized design node).
- **Loop** — local quality inside each node (discover → execute → verify → record → repair).
- **Harness** — each node's bounded env (context pack, git worktree, permissions).
- **Decision layer (System One)**, cross-cutting — every structured decision (route, score, classify, map, extract, gate-eval) is a typed probabilistic call with calibrated confidence. **Generation (System Two) = Claude Code.** Slogan: *the decision layer decides, Claude Code creates.*

## 3. The four invariants (canonical §108–§111) + deterministic-first
1. No important transition without a **reason, a state change, and (where applicable) evidence**.
2. **Never make the model's memory the source of truth** — truth = graph + state + artifacts + evidence + history.
3. **Autonomy ≠ lack of control** — more autonomy ⇒ stronger state, boundaries, evaluation, recovery, auditability.
4. **Complexity must be earned** — simple loop for simple work; graph for cross-domain; multiple agents only when justified.
5. **Deterministic-first (§113.7/§22):** prefer deterministic checks (build/typecheck/lint/tests/a11y/perf) over LLM judgment; model-assisted eval only where no deterministic check exists.

## 4. Tech stack
TypeScript · Node 24 LTS (runs on ≥22.6) · pnpm · Zod (Standard-Schema-compatible) · custom typed graph layer · SQLite (local `.agent/`) → Postgres (hosted) · filesystem artifacts → object storage later · `NodeExecutor` seam with Claude Code adapter · Node harness · Playwright browser worker · tree-sitter · official TS MCP · Node CLI · Next.js web · structured events + traces · TS workers now (Python/Rust optional later).

## 5. Locked decisions (index)
Design/flow: headless core + thin adapters (transport-agnostic commands/queries/events); local-first `.agent/`; both new + modify repos; **Claude Code only** runtime via `NodeExecutor`; evidence-gated completion.
Ingestion: tiered (tree-sitter cheap sweep + on-demand deep parse); git-diff freshness; file/module nodes + on-demand symbols; **full multi-package monorepo orchestration**; grammars TS/TSX/JS/JSX → JSON/CSS/HTML → Python.
Mapping: two layers + confidence edges; `orphan code` + `unrealized design` first-class; provenance by_construction | inferred | human_confirmed.
Decision layer: System One control plane; **our Claude-structured wrapper now → Jev later** behind one `Decision` interface; tiered escalation (System One → LLM → human); typed versioned decision schemas.
Design intake: **IR canonical + versioned**, design-subgraph projected with stable IDs; v1 modalities text/screenshot/code/assets; System Two interprets → System One normalizes; **separate independent acceptance-criteria pass**; per-field provenance; re-compile + diff.
Execution: **fixed template + dynamic fan-out**; **retry cap (3) + cost/step budget**; default gates = design-approval, low-confidence, risky-op, pre-release; **deployment out of v1** (later gated).
Sandbox: **git worktree per node**; **sequential (parallel-ready abstraction)**; network **allow + audit/gate**; FS write-scoped + secrets denied; **dedicated working branch off HEAD, auto-stash, git = checkpoint/rollback**.
Store: SQLite/Postgres for graph+state; files for artifacts + event log.
Model roster: **all-Claude, procedural independence** (criteria frozen pre-impl from intent).
(Full numbered table with rationale: `current-info.md`.)

## 6. Architecture

### 6.1 Headless core + frontends
One engine; plugin/MCP/website/CLI are thin callers of one stable API. First adapter: **CLI**. Next: **MCP**.

### 6.2 Core API surface (v1)
Transport-agnostic **commands / queries / events**:
- **Commands:** `project.init(repo, mode)`, `run(inputs?)` (autonomous driver, returns runId, halts at gate/completion), `cancel(runId)`, `gate.resolve(id, approve|reject, notes?)` (also confirms low-confidence mappings).
- **Queries:** `project.status`, `exec.getGraph/getNode`, `kg.query/getNode/neighbors/mappings/gaps`, `gate.list/get`, `decision.schemas/get`, `evidence.forNode`, `run.get/logs`, `state.get`, `version.list/diff`.
- **Events:** `events.subscribe(filter)` over append-only `.agent/history/execution-log.jsonl` + traces (canonical §100 taxonomy).
- Execution model is **coarse/autonomous-only** for v1; per-node control deferred.

### 6.3 Design Compiler (intake front door)
Inputs (text, screenshots→vision LLM, existing code→tree-sitter, asset folders→manifest) → System Two interprets → System One normalizes discrete/enum fields (+confidence; low → gate) → **Design IR** (canonical, versioned, provenance per field) → project to **design-subgraph** (stable IDs so mapping edges rebind) → **separate criteria pass** authors measurable acceptance criteria (independent of compiler + implementer). Re-compile → IR v2 → diff → graph update.

**Design IR (Zod):** `version, meta, visualLanguage, typography, colors, layout, components, pages, interactions, animations, assets, responsiveRules, constraints, provenance` — every element a stable `id`; enum fields normalized by System One.

### 6.4 Knowledge graph & code↔design mapping
Code nodes (from FS ingestion, ground truth) + design nodes (from IR, intent) are distinct layers in one graph, joined by many-to-many `realizes`/`realized_by` edges carrying confidence + provenance + timestamp. **Unrealized design** = the work list; **orphan code** = review flag. New-project mappings by construction; modify-existing inferred (via `map.classifyFileToDesign` + gate on low confidence).

### 6.5 Repo ingestion (modify-existing) — tiered
Cheap sweep (tree-sitter → file/module nodes + import/export/route edges over the whole repo) + deep parse (symbols on demand per touched file). git-diff freshness. Monorepo: workspace detection → package sub-regions + cross-package dependency edges + topologically-ordered execution.

### 6.6 Execution graph & loop
Fixed skeleton `INTAKE → PLAN → DESIGN ANALYSIS → ARCHITECTURE → [impl fan-out] → INTEGRATION → CODE QA → BROWSER QA → VISUAL QA → PRE-RELEASE GATE`. v1 ends at the verified build (deployment out). Each impl node loops: discover → execute → verify → record → (meets acceptance?) done | diagnose → repair. Retry cap 3 → escalate; run cost/step budget → halt to gate.

### 6.7 Harness & sandbox (local-first)
Per-node **Context Pack** (task, relevant nodes/files, constraints, prior failures, permissions). Git is isolation + checkpoint + rollback: `run` cuts a dedicated **working branch** off HEAD (auto-stash dirty tree), each node runs in its **own worktree** (sequential in v1, parallel-ready), success commits + advances the branch, failure discards the worktree. Network allowed + audited/gated; FS write-scoped to repo, secrets denied. Later tiers: Docker, Vercel Sandbox, cloud.

### 6.8 Decision layer, escalation & policy
System One = classify/route/score/extract/map/verify → typed value + calibrated confidence. Provider = our Claude-structured wrapper now → Jev later, one interface. **Escalation:** `confidence ≥ high → accept; ≥ mid → System Two LLM; else → human gate` (`resolveEscalation`, implemented). Placeholders 0.85/0.6, mapping 0.9. Security-sensitive **outcomes** gate at the value level. **Provider routing** (`providerFor`) defaults to Claude-wrapper; per-type swap to Jev after a **parity harness** (record → replay → compare agreement + calibration) passes. v1 decision catalog: `ingest.classifyFileRole, interpret.normalizeField, map.classifyFileToDesign, criteria.normalizeMeasurable, qa.scoreEvidence, risk.classifyOperation, route.branch, gate.evaluate`.

### 6.9 Quality, evidence & visual QA
Deterministic-first (build/typecheck/lint/tests/a11y/perf). Independent evaluator = decision layer (not the implementer). Baselines snapshotted at intake (modify mode). Gate-tests derived from independent criteria. **Visual QA (hybrid):** vision LLM extracts structured facts → decision layer scores vs criteria → low-confidence pixel re-check. Human gates via the escalation ladder.

### 6.10 State machines, versioning & recovery
Project (§97): `draft→planning→executing→verifying→awaiting-approval→released→(monitoring→maintenance)→archived` (can return to planning/executing/verifying). Node (§98): `pending→ready→running→verifying→(complete|retry→blocked→escalated)`, + cancelled. Version everything (code, IR, graphs, prompts, policies, criteria, tests, artifacts). Resumable: checkpoint per node; gate halts + returns; `gate.resolve` resumes.

### 6.11 `.agent/` layout (local-first)
```
.agent/
├── state.db     SQLite: KG + exec graph + mapping edges + run state (Postgres hosted)
├── project/     IR versions, design spec exports, architecture notes
├── policies/    permissions, quality, approval, decisions/ (typed schemas)
├── evidence/    screenshots, test-results, browser-traces, visual-reviews
├── artifacts/   manifests, generated specs
└── history/     execution-log.jsonl (append-only events + traces)
```

## 7. Repository layout (platform scaffold)
Single TS package for v1 (extract to workspace — apps/packages/workers per §58 — when MCP/web/other-lang workers arrive).
```
src/index.ts            public core API surface
src/core/api.ts         Engine — run/resolveGate/cancel orchestration + reads + events
src/core/types.ts       primitives + project/node state machines
src/core/ir/schema.ts   Design IR (Zod) + schema.check.ts
src/core/graph/types.ts KG + exec graph kinds + node state machine
src/core/decision/      Decision seam + catalog; providers (ClaudeDecision/FakeDecision); DecisionRunner (+corpus)
src/core/policy/        escalation resolver + provider routing (+ policy.check.ts)
src/core/graph/project.ts  IR → design-subgraph projection + gaps (+ project.check.ts)
src/core/store/         SQLite store (KG + runs + exec_nodes), better-sqlite3 (+ store.check.ts)
src/core/runtime.ts     NodeExecutor seam + real GitHarness + ClaudeCodeExecutor
src/core/loop.ts        node loop (execute→verify→record→repair, retry cap) + Verifier seam
src/core/verify.ts      DeterministicVerifier (build/test → evidence)
src/core/browser.ts     BrowserWorker seam + Playwright (lazy) + fake
src/core/visual.ts      hybrid visual QA (extract → score → pixel re-check)
src/core/compiler.ts    Design Compiler intake (brief → IR)
src/core/plan.ts        exec-graph generation (skeleton + fan-out + release)
src/core/deploy.ts      Deployer seam (CommandDeployer/FakeDeployer) — gated RELEASE
src/core/ingest/        tree-sitter parse + repo sweep + code→design mapping
src/mcp/                MCP server (weave-mcp) exposing the Engine as tools
src/core/state.ts       .agent/ init (auto-gitignores .agent/)
src/core/events/        event log (§100 taxonomy)
src/cli/index.ts        first adapter (init/run/status/graph/gates/approve/reject/watch)
examples/robotics-landing.brief   sample brief
scripts/deploy.sh       auto-deploy to GitHub (private repo "Weave"; `pnpm ship`)
scripts/demo.mjs        end-to-end pipeline demo (`pnpm demo`)
```
Phases 0–7 are wired end-to-end; the remaining "seams" that need live creds are the Claude/browser adapters (`ClaudeDecision`, `ClaudeCodeExecutor`, `PlaywrightBrowserWorker`), exercised via fakes.

## 8. Scaffold status (Phases 0–7 + ingestion + MCP/parallel/deploy — V1 DoD met)
Built + verified: `pnpm build` clean, **14 self-checks** pass (IR, policy, projection+gaps, store, decision-runner, node-loop, verifier, visual, orchestrator), `pnpm demo` runs end-to-end, CLI `init/run/status/graph/gates/approve/reject` work. Git on `main` (uncommitted). **Implemented for real:** contracts; Design IR + validation + projection; SQLite store (KG + runs + exec graph + gates, commit↔node) wired into `Engine` + CLI; policy resolvers; `DecisionRunner` + `ClaudeDecision`/`FakeDecision`; real `GitHarness` + `ClaudeCodeExecutor` + `runNode` loop; `DeterministicVerifier` + `BrowserWorker`(Playwright/fake) + hybrid `visualQA`; `compileBrief` + exec-graph planner + `Engine.run/resolveGate/cancel` orchestration with gates + budget; event log; `.agent/` init (auto-gitignores). **Proven:** cross-process persistence (P2); node loop over real git (P4); full run→gates→fan-out→repair→done on real git + `pnpm demo` (P6/P7); **§115 V1 success criteria met**. **Need credentials to run live (via fakes in tests):** `ClaudeDecision` (API key), `ClaudeCodeExecutor` (`claude` CLI), `PlaywrightBrowserWorker` (playwright dep).

## 9. Open / ongoing
- **#1** — resolved: MCP is the next adapter; plugin/website future versions.
- **#8** — escalation framework implemented; real threshold values await calibration data.
- **#10** — provider-routing seam implemented; parity-harness execution awaits Jev access.
- Store impl for Phase 2: **resolved — better-sqlite3** (GraphStore implemented).

## 10. Build plan
See `implementation-plan.md` — Phase 0 (scaffold) done; Phase 1 (knowledge front: IR→graph projection + gaps) in progress; then persistence → decision provider → execution → verification → orchestration → first demo.
