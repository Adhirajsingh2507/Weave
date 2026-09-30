# INFORMATION — Master Reference

> The single consolidated reference for the **Weave** project: vision, principles, every decision, the full architecture, the scaffold, and what's open. Consolidates `current-info.md` (decisions), `architecture.md` (design), `implementation-plan.md` (build plan), `to-be-discussed.md` (open), and `past-info.md` (history). Those remain the working docs; this is the read-once overview.
>
> **Ultimate source of truth:** `../autonomous-engineering-universal-context.md` (canonical, 123 sections). This project's docs are the *distilled decided layer* over it.

_Last updated: 2026-09-30_

> **V2 is complete.** Identity: the control and governance layer for AI coding agents, web
> apps first — agents execute; Weave governs, verifies, records. V2 (phases V2.0–V2.7) has shipped;
> the phased plan is `implementation-v2.md`, decisions #42–83 are in `current-info.md`, and the
> next work is `demo-plan.md`. New session? Read `handoff.md` first.

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
- **Decision layer**, cross-cutting — every structured decision (route, score, classify, map, extract, gate-eval) is a typed probabilistic call with calibrated confidence. **Generation (the execution layer) = Claude Code.** Slogan: *the decision layer decides, Claude Code creates.*

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
Decision layer: Decision-layer control plane; **our Claude-structured wrapper now → Jev later** behind one `Decision` interface; tiered escalation (decision layer → LLM → human); typed versioned decision schemas.
Design intake: **IR canonical + versioned**, design-subgraph projected with stable IDs; v1 modalities text/screenshot/code/assets; Execution layer interprets → decision layer normalizes; **separate independent acceptance-criteria pass**; per-field provenance; re-compile + diff.
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
Inputs (text, screenshots→vision LLM, existing code→tree-sitter, asset folders→manifest) → Execution layer interprets → decision layer normalizes discrete/enum fields (+confidence; low → gate) → **Design IR** (canonical, versioned, provenance per field) → project to **design-subgraph** (stable IDs so mapping edges rebind) → **separate criteria pass** authors measurable acceptance criteria (independent of compiler + implementer). Re-compile → IR v2 → diff → graph update.

**Design IR (Zod):** `version, meta, visualLanguage, typography, colors, layout, components, pages, interactions, animations, assets, responsiveRules, constraints, provenance, designTokens` — every element a stable `id`; enum fields normalized by the decision layer; `designTokens` carries the chosen guide (V2.6).

### 6.4 Knowledge graph & code↔design mapping
Code nodes (from FS ingestion, ground truth) + design nodes (from IR, intent) are distinct layers in one graph, joined by many-to-many `realizes`/`realized_by` edges carrying confidence + provenance + timestamp. **Unrealized design** = the work list; **orphan code** = review flag. New-project mappings by construction; modify-existing inferred (via `map.classifyFileToDesign` + gate on low confidence).

### 6.5 Repo ingestion (modify-existing) — tiered
Cheap sweep (tree-sitter → file/module nodes + import/export/route edges over the whole repo) + deep parse (symbols on demand per touched file). git-diff freshness. Monorepo: workspace detection → package sub-regions + cross-package dependency edges + topologically-ordered execution.

### 6.6 Execution graph & loop
Fixed skeleton `INTAKE → PLAN → DESIGN ANALYSIS → ARCHITECTURE → [impl fan-out] → INTEGRATION → CODE QA → BROWSER QA → VISUAL QA → PRE-RELEASE GATE`. v1 ends at the verified build (deployment out). Each impl node loops: discover → execute → verify → record → (meets acceptance?) done | diagnose → repair. Retry cap 3 → escalate; run cost/step budget → halt to gate.

### 6.7 Harness & sandbox (local-first)
Per-node **Context Pack** (task, relevant nodes/files, constraints, prior failures, permissions). Git is isolation + checkpoint + rollback: `run` cuts a dedicated **working branch** off HEAD (auto-stash dirty tree), each node runs in its **own worktree** (sequential in v1, parallel-ready), success commits + advances the branch, failure discards the worktree. Network allowed + audited/gated; FS write-scoped to repo, secrets denied. Later tiers: Docker, Vercel Sandbox, cloud.

### 6.8 Decision layer, escalation & policy
Decision layer = classify/route/score/extract/map/verify → typed value + calibrated confidence. Provider = our Claude-structured wrapper now → Jev later, one interface. **Escalation:** `confidence ≥ high → accept; ≥ mid → execution-layer LLM; else → human gate` (`resolveEscalation`, implemented). Placeholders 0.85/0.6, mapping 0.9. Security-sensitive **outcomes** gate at the value level. **Provider routing** (`providerFor`) defaults to Claude-wrapper; per-type swap to Jev after a **parity harness** (record → replay → compare agreement + calibration) passes. v1 decision catalog: `ingest.classifyFileRole, interpret.normalizeField, map.classifyFileToDesign, criteria.normalizeMeasurable, qa.scoreEvidence, risk.classifyOperation, route.branch, gate.evaluate`.

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

## 7. Repository layout
Single TS package for v1/V2.0 (extract to a workspace when other-language workers arrive).
```
src/index.ts            public core API surface
src/core/api.ts         Engine — run/resolveGate/cancel orchestration + reads + events
src/core/types.ts       primitives + project/node state machines
src/core/ir/schema.ts   Design IR (Zod) + schema.check.ts
src/core/graph/         KG + exec graph kinds; IR → design-subgraph projection + gaps
src/core/decision/      Decision seam + catalog; ClaudeDecision/FakeDecision; DecisionRunner
src/core/policy/        escalation resolver + provider routing
src/core/store/         SQLite store (KG, runs, exec_nodes, gates) — better-sqlite3
src/core/runtime.ts     NodeExecutor seam, scrubbedEnv, real GitHarness, ClaudeCodeExecutor
src/core/loop.ts        node loop (execute→verify→record→repair) + Verifier seam
src/core/verify.ts      DeterministicVerifier (async, timeouts) → evidence
src/core/scaffold.ts    scaffold node: zero-dependency template + command override
src/core/design/style.ts  reads design-guide/*.md → tokens, brief, checks
src/core/browser.ts     BrowserWorker seam + Playwright (lazy) + fake
src/core/visual.ts      hybrid visual QA (extract → score → pixel re-check)
src/core/compiler.ts    Design Compiler intake (brief → IR, incl. style: directive)
src/core/plan.ts        exec-graph generation (skeleton + scaffold + fan-out + release)
src/core/deploy.ts      Deployer seam — gated RELEASE
src/core/ingest/        tree-sitter parse + repo sweep + code→design mapping
src/core/state.ts       .agent/ init (self-ignoring)
src/core/events/        append-only event log
src/mcp/                MCP server (weave-mcp)
src/cli/index.ts        CLI adapter

design-guide/           91 style guides + _base.md + styles.json (the design system)
demo-design/            reference pictures, one folder per style
docs/                   current-info, past-info, architecture, implementation-v2, v2-inputs
examples/               robotics-landing.brief
scripts/demo.mjs        end-to-end demo (`pnpm demo`)
scripts/check-design.mjs  design-guide validator
scripts/deploy.sh       GitHub sync (`pnpm ship`)
.github/workflows/ci.yml  build + checks + design validator on every push
```

## 8. Status
**v1:** complete (phases 0–7 + ingestion + MCP + parallel + gated deploy; §115 DoD met). The v1
phase plan is archived in `past-info.md`.

**V2.0:** shipped — persisted harness state, kept gate history with notes, design→code edges on
commit, genuinely async parallel execution with timeouts, a zero-dependency scaffold node, and
style-aware context packs drawn from the 91 design guides.

**V2.1:** shipped — requirement and criterion nodes, typed evidence and attempts tables, the five
metrics computed from persisted state, and `weave report` rendering requirement → design → code →
criterion → evidence → commit → approval.

**V2.2:** shipped — 4 policy packs, 46 items, dependency-free runners, applicability facts
(not-applicable is recorded with its reason), and a `policy` gate whose approval is a per-item
waiver.

**V2.3:** shipped — parallelism as a DAG: scaffold → components → pages → integration, ownership
by construction (components write fragments, pages own their file), conflicts re-run on the new
tip, an integration node that assembles and checks the whole site, and measured wall-clock.

**V2.4:** shipped — agents confined by Claude Code's deny rules, bubblewrap (secrets masked, the
checkout hidden) and an egress proxy (allowlist + audit); risky diffs parked behind a `risky-op`
gate, judged by deterministic rules and, with credentials, the decision layer; Vercel release
with deploy evidence and post-deploy checks against the live URL.

**V2.5:** shipped — the static explorer (`weave report --html`), one coverage definition, gates
scoped to a run, a bounded whole-site repair before a policy gate, the benchmark harness (not yet
run) and the outcome-first README.

**V2.6:** shipped — every guide token carried in the IR, screenshot and URL intake with
confidence-gated readings, style suggestion, and the guides as MCP resources.

**V2.7:** shipped — assets acquired, measured and budgeted by the engine (never built by an
agent), placement checked, pages rendered by headless Chrome, visibility judged on the hybrid
path.

**Design system:** 91 guides, 739 checks (~86% deterministic), 89 picture folders, validated by
`scripts/check-design.mjs`.

**Verification:** 37 self-checks + the design validator. `pnpm demo` runs end to end without
credentials, including a gated deploy to a local stand-in host.

## 9. Open / ongoing
- **#8** — escalation framework implemented; threshold values await calibration data, which V2.4
  begins producing by putting the decision layer in the run path.
- **#10 / #57** — provider routing implemented; Jev parity awaits early-access approval.
- Name and licence — see `to-be-discussed.md`. Metric definitions, default packs and the deploy
  target (Vercel) are decided.
- Carried gaps: `listGates()` spans runs; browser and visual QA are `skipped`; the IR has no home
  for the guides' shape/motion/spacing tokens; the full list is in `to-be-discussed.md`.

## 10. Build plan
See **`implementation-v2.md`** — V2.0–V2.7 done; a first credentialed run next, then V3 planning,
with the Jev track alongside.
