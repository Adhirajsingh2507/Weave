# Architecture

> The living architecture. Improve in place as decisions firm up. Reflects `current-info.md`.

_Last updated: 2026-09-24_

## What V2.0 changed

The structure below still holds. These are the deltas, so read them first:

- **A scaffold node** runs between ARCHITECTURE and the impl fan-out. It is a fixed, non-AI
  template step that creates the project on the working branch, so impl nodes inherit something
  that builds. It never touches an existing project.
- **The design system feeds the loop.** `design-guide/<style>.md` supplies tokens (written into
  the project as CSS variables) and machine-readable checks. Those checks are the first concrete
  source of acceptance criteria, which until now had no implementation.
- **Harness state is persisted** on the run (`working_branch`, `base_branch`, `stashed`), so a
  later process can finish or cancel a run. Git remains the checkpoint mechanism; the difference
  is that the record of it survives the process.
- **Mapping edges are written by construction** when a node commits — the "new project → mapping
  created by construction" path described below is now real, not aspirational.
- **Execution is genuinely async.** The executor and verifier no longer block the event loop, so
  the parallel worktree path actually overlaps; both carry timeouts.
- **Gates keep history.** Ids are sequenced, notes are recorded and reach the next attempt.
- **Naming.** "System One / System Two" is retained below for continuity with the canonical doc,
  but is being retired in favour of **decision layer** and **execution layer** (phase V2.5).

Phase plan: `implementation-v2.md`.

## Headless core + frontends
The same engine must ship (eventually) as a Claude Code plugin, an MCP server, and a website. None of those *is* the engine — they are thin callers of one headless core.

```
        ┌───────────────────────────────┐
        │   FRONTENDS (per delivery mode)│
        │   plugin  │  MCP  │  website   │
        └───────────────┬───────────────┘
                        │  one stable core API
        ┌───────────────▼───────────────┐
        │          HEADLESS CORE         │
        └───────────────────────────────┘
```
Design implication: the central v1 question is *the core's API surface*, not any single frontend.

## Core API surface (v1)
Transport-agnostic **commands / queries / events**. Stack: TypeScript, Node 24, Zod-validated I/O. First adapter: **CLI**; same core later wrapped as MCP tools, HTTP routes, or imported in-process (Next.js/plugin).

**Commands (mutations; async ones return a `runId`, observed via events):**
- `project.init(repoPath, mode: new | existing)` — create `.agent/` (SQLite + files)
- `run(inputs?)` — **the autonomous driver**: intake → ingest → plan → execute → loop, stopping only at a gate or completion. Returns `runId`.
- `cancel(runId)`
- `gate.resolve(gateId, decision: approve | reject, notes?)` — also how a human confirms/rejects a low-confidence inferred **mapping** (mapping confirmation *is* a gate; no separate command in v1)

**Queries (sync reads):**
- `project.status()`
- `exec.getGraph()` · `exec.getNode(id)`
- `kg.query(q)` · `kg.getNode(id)` · `kg.neighbors(id)` · `kg.mappings(filter)` · `kg.gaps()` (unrealized-design + orphan-code)
- `gate.list()` · `gate.get(id)`
- `decision.schemas()` · `decision.get(id)`
- `evidence.forNode(id)` · `run.get(id)` · `run.logs(id)`
- `state.get()` · `version.list()` · `version.diff(a, b)`

**Events (append-only log + subscribe):**
- `events.subscribe(filter)` → structured events (node started/finished, decision made + confidence, evidence recorded, gate opened, escalation, error), backed by `.agent/history/execution-log.jsonl` + traces.

Everything else (per-node run/pause/skip, manual mapping ops, rollback) is **deferred** — added only when a frontend (e.g. the visual graph) needs it.

**CLI mapping (first adapter):** `autodesign init` · `run` · `status` · `graph` · `gates` · `approve <id>` / `reject <id>` · `watch` (tail events).

## The four layers
```
              HUMAN (intent, constraints, acceptance criteria, gates)
                                  │
                                  ▼
                     INTENT / DESIGN COMPILER
                (multimodal input → Design IR + graph, once)
                                  │
                                  ▼
                    PROJECT KNOWLEDGE GRAPH
     requirements ↔ design ↔ components ↔ assets ↔ APIs
     ↔ constraints ↔ decisions ↔ tests ↔ evidence
                                  │
                                  ▼
                     EXECUTION / AGENT GRAPH
        plan → design → implement → integrate → QA → gate → release
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                  NODE          NODE          NODE
                (loop)        (loop)         (loop)
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                          QUALITY SYSTEM
                    tests · browser QA · visual QA · security
                                  │
                             ┌────┴────┐
                             ▼         ▼
                           PASS       FAIL → diagnose → repair → loop
```

## Node loop (local execution)
```
discover → execute → verify → record evidence → (meets acceptance?) → done | diagnose → repair → execute
```
Graph decides the route; loop decides local quality.

## Harness (per node)
Each node runs with a **Context Pack**: task id, relevant graph nodes, relevant files, design rules, constraints, previous failures, tools, and read/write/deny permissions. The agent gets only what the node needs — not the whole project context.

Runtime = **Claude Code** (single, for now). The harness invokes it and collects evidence.

## Sandbox / execution environment (local-first)
Node work (Claude Code editing files + the Playwright worker) runs **on the user's machine against their repo**. Git provides isolation, checkpointing, and rollback — no separate snapshot system.

```
run() ─► create dedicated WORKING BRANCH off HEAD   (dirty tree → auto-stash, restore after)
           │
           ▼   for each node (sequential in v1):
      git WORKTREE off working-branch tip   ← isolation unit
           │   Claude Code does the work; Playwright builds/drives from this worktree
           ▼
      pass (retry cap 3) ? ──yes──► commit + advance working branch, remove worktree
           │ no
           └──► discard worktree → escalate to gate
           ...
      INTEGRATION (merge seam; trivial while sequential, real when parallel)
           ▼
      working branch holds the full result; human gate reviews the diff
```

- **Isolation:** one **git worktree per node**; discard on failure = instant rollback.
- **Concurrency:** **sequential in v1**, behind a parallel-ready worker abstraction — worktrees let parallel switch on later without reshaping the graph. Each node branches off the latest tip, so it sees prior nodes' committed work (sequential dependency chain).
- **Permissions:** write-scoped to the repo; reads of secrets (`.env`, credentials) denied.
- **Network:** allowed (user's machine), but the harness **audits all outbound calls** and **gates unusual ones** (unknown hosts, credential-shaped payloads).
- **Checkpoint/rollback = git:** dedicated working branch, per-node commits; revert on failure; gate reviews the diff. `state.db` records which commit corresponds to which node/run.
- **Later isolation tiers** (same worker abstraction): Docker, Vercel Sandbox, cloud workers.

## Decision layer (System One) vs generation (System Two)
Two kinds of work, cleanly split (after Kahneman, via TypeSafe's naming):

| | System One — Decision layer | System Two — Generation |
|---|---|---|
| Does | classify, route, score, extract, map, verify, judge | write code, design components, deliberate reasoning |
| Shape | unstructured state in → **typed probabilistic decision** out (+ calibrated confidence) | prompt → free-form artifacts (code, design) |
| Provider | `Decision` interface: **our own wrapper on Claude structured outputs now → Jev later** | Claude Code |
| Speed/cost | ~100ms, ~free (Jev); cheap either way | slow, expensive |
| Guarantees | no type errors, no hallucination, calibrated confidence (Jev) | none — output must be verified by System One + evidence |

**The decision layer decides; Claude Code creates.** This is what makes the graph's routing/scoring/gating concrete rather than hand-wavy.

Every decision point has a **predefined, typed, versioned schema** in `.agent/policies/decisions/`. No untyped decisions.

### Escalation ladder (calibrated confidence → the human boundary)
```
decision needed
      │
System One (typed probabilistic call)
      │
 confidence ≥ high?  ──yes──► auto-accept
      │ no
 confidence ≥ mid?   ──yes──► System Two LLM (deliberate call)
      │ no / ambiguous
      ▼
   HUMAN GATE
```
Thresholds are per-decision-type and versioned. This is "put the human at the expensive boundary," made measurable.

**Starting thresholds (placeholders until calibration):** high ≥ 0.85 (auto-accept) · 0.6–0.85 (→ System Two LLM) · < 0.6 (→ human gate). Per-type overrides in `policies/`: inferred mappings and risky ops use stricter high (≥ 0.9); **security-sensitive decisions always gate regardless of confidence**. Calibration: log `(decision, confidence, eventual outcome)` → reliability curve → adjust thresholds per type.

### Provider constraints (Jev, when adopted)
- **No vision** — Jev scores structured state, not images (see Visual QA below).
- **Cardinality ≤ 255** — for large choice sets (e.g. "which of 900 files"), pre-filter candidates via code-graph edges, then 2-stage score-then-choose.
- **Early access** — hence LLM-wrapper-now behind the `Decision` seam; swapping providers changes no callers.

### Jev adoption path
Default provider is **our own Claude-structured wrapper**. Adopt Jev **per-decision-type, behind a flag**, once (a) access is granted and (b) a **parity harness** passes: replay recorded `(state → decision)` pairs through both providers and require agreement + calibration within tolerance on that decision type. No caller changes (same `Decision` interface). Until then Jev is aspirational.

### Model roster (all-Claude, procedural independence)
| Role | Model | Independence |
|---|---|---|
| interpreter / generation | Claude (Claude Code) | — |
| visual-QA extract + re-check | Claude vision | — |
| Decision wrapper (System One) | Claude structured outputs (Zod) + elicited confidence | — |
| criteria pass | Claude — separate call from intent + IR, frozen pre-implementation | **structural** (pre-impl, from intent) |
| independent evaluator (gate) | Claude — separate call/prompt, isolated from implementer context | procedural |

One provider dependency. Residual risk: same family may share blind spots → mitigated by **structural** independence (criteria frozen from intent before any implementation) + isolated contexts. A cross-model evaluator can be switched on later via the `policies/` model map without other changes.

### Decision-schema catalog (v1)
Every point below has a typed, versioned schema in `policies/decisions/` (input state → typed output + confidence):
| Decision | In → Out |
|---|---|
| `ingest.classifyFileRole` | file (tree-sitter facts) → role `{component\|page\|api\|util\|config\|test\|asset}` + conf |
| `interpret.normalizeField` | draft IR field + candidates → enum value + conf (intake) |
| `map.classifyFileToDesign` | (path, exports, imports, symbols, design vocab) → designNodeId(s) + conf (cardinality ≤255 → prefilter) |
| `criteria.normalizeMeasurable` | intent element → measurable criterion type + conf (criteria pass) |
| `qa.scoreEvidence` | (criterion, extracted facts) → `pass\|fail\|partial` + conf + reason |
| `risk.classifyOperation` | planned action → risk `{deps\|migration\|deletion\|secret\|none}` + conf → gate? |
| `route.branch` | node result + graph state → `continue\|repair\|escalate` + conf |
| `gate.evaluate` | node evidence + criteria → recommend `approve\|reject` + conf (human still decides) |

Deferred schemas: `merge.classifyConflict` (parallel execution), post-deploy/monitoring decisions.

## Policy layer (thresholds + provider routing)
Pure, versioned policies (typed defaults in `src/core/policy/`, per-project overrides in `.agent/policies/`). The resolvers are **deterministic and implemented now**; only the threshold *values* and the Jev *swap* need calibration/access.

### Escalation thresholds (#8)
`ThresholdPolicy = { version, default:{high,mid}, perDecision: name → {high?, mid?, alwaysGate?} }`.
`resolveEscalation(name, confidence, policy) → accept | llm | human` — implemented + self-checked.
- Placeholders: default high **0.85** / mid **0.6**; `map.classifyFileToDesign` high **0.9** (mapping errors propagate).
- **Security-sensitive *outcomes*** (from `risk.classifyOperation`) gate at the **value level**, separately from this confidence resolver (which sees only name + confidence).
- Calibration: log `(name, confidence, outcome)` → per-type reliability curve → set `high` where accuracy ≥ target, `mid` at a lower bar → bump policy `version`.

### Provider routing + Jev parity (#10)
`providerFor(name, policy) → claude-wrapper | jev` — implemented. Default every type to `claude-wrapper`; swap **per decision type, behind a flag**, only after the parity harness passes. No caller changes (same `Decision` interface).

Parity harness (spec — execution needs Jev access + a decision corpus):
1. **Record** every live decision `(name, state, candidates?, result{value,confidence}, outcome?)` to a corpus.
2. **Replay** `(name, state, candidates)` through the candidate provider (Jev).
3. **Compare per type:** agreement vs incumbent (and accuracy vs logged outcomes where available) ≥ `minAgreement` (0.95); confidence calibration error (ECE/Brier) ≤ `maxCalibrationError` (0.05).
4. **Swap** that type's flag to jev on pass; **roll back** if live metrics regress.

## Code↔design mapping (one graph, two layers)
Code graph (from FS ingestion, *ground truth*) and design graph (from intent, *what we want*) are distinct node layers in **one** knowledge graph, joined by mapping edges:

```
   DESIGN NODE (Hero)                         CODE NODES
   concept / intent                           files / modules (FS)
        │  realized_by  ┌──────────────────►  Hero.tsx      (conf 0.94)
        │  (many-to-    ├──────────────────►  hero.css      (conf 0.88)
        │   many)       ├──────────────────►  useHero.ts    (conf 0.71 → escalate)
        │               └──────────────────►  hero.glb      (conf 0.90)
        ▼
   edge attrs: confidence · provenance · timestamp · source
```

First-class states that *define the work*:
- **Unrealized design** — a design concept with no code. New-project mode = *everything* is unrealized; the execution graph drives each `unrealized → realized (with evidence)`. Modify-existing: unrealized = the feature gap.
- **Orphan code** — a file with no design mapping (utils, infra, dead code). Flagged for review.

Mapping **provenance differs by mode**:
- **New project** → mapping is created **by construction**: a task is tied to a design node, so writing `Hero.tsx` creates the edge at high confidence by definition.
- **Modify existing** → mapping is **inferred**: state = (path, exports, imports, symbols), the decision layer classifies which design concept(s) a file realizes + confidence. High auto-accepts, mid escalates to LLM, low/ambiguous → human gate or left `unmapped`. This is also where the decision layer serves as the **independent evaluator** (separate from the implementer → guards against evaluation leakage).

## Persistent state — local-first `.agent/` (proposed layout)
Structured, queryable state (both graphs + mapping edges + run state) lives in **SQLite**; everything else is files.
```
.agent/
├── state.db         SQLite: knowledge graph, execution graph, mapping edges,
│                    run state, decision records  (Postgres when hosted)
├── project/         IR versions, design spec exports, architecture notes (files)
├── policies/        permissions, quality, approval, decisions/ (typed decision schemas)
├── evidence/        screenshots, test-results, browser-traces, visual-reviews (files)
├── artifacts/       manifests, generated specs (files)
└── history/         execution-log.jsonl  (append-only events + traces)
```
Checkpoints are **git commits** on the working branch (per node); `state.db` maps commit ↔ node/run (see Sandbox, #5).

## Design Compiler (intake — the `run` front door)
Multimodal inputs → interpreted **once** → **Design IR** (canonical, versioned) → projected **design-subgraph** → separate **criteria pass** authors acceptance criteria.

```
inputs
  ├─ text/brief ────► LLM interpret ─────┐
  ├─ screenshots ───► vision LLM ────────┤
  ├─ existing code ─► tree-sitter ───────┤ (reconcile with intent)
  └─ asset folders ─► manifest (type/size/dims)
                                         ▼
                            draft interpretation (System Two)
                                         │
              System One normalizes discrete/enum fields (+ calibrated confidence)
                                         │   low-confidence → HUMAN GATE
                                         ▼
                    DESIGN IR  (canonical · versioned · provenance per field)
                    { visualLanguage, layout, typography, colors, components,
                      pages, interactions, animations, assets, responsiveRules,
                      constraints }
                                         │  project (stable element IDs)
                                         ▼
                    design-subgraph nodes  ← code↔design mapping edges rebind here
                                         │
        ┌────────────────────────────────┘
        ▼
  CRITERIA PASS (independent of both compiler and implementer)
  reads raw intent + IR → measurable acceptance criteria, bound to IR elements,
  stored as their own versioned artifact/nodes
```

Decisions baked in:
- **IR is canonical**; the design-subgraph is projected from it. Design nodes carry **stable IDs from IR element IDs** so mapping edges survive re-projection.
- **v1 modalities:** text, screenshots (vision LLM), existing code (tree-sitter), asset folders (manifest). URL / Figma / deep video / 3D-understanding / PDF are **stubbed behind the same input interface**, added later.
- **Interpretation split:** System Two (LLM/vision) interprets → System One normalizes discrete fields with confidence → low-confidence interpretations open a gate. Confidence is present from intake.
- **Acceptance criteria:** authored by a **separate independent pass** (not the compiler, not the implementer) from intent + IR → independent by construction; stored & versioned separately, bound to design elements.
- **Provenance:** every IR field / design node records which input produced it (also serves responsible-AI asset-ownership tracking).
- **Re-compilation:** adding/changing an input produces **IR v2**, diffed against v1; the graph updates from the diff. Incremental live-merge deferred.

### Design IR schema (Zod sketch)
Canonical, versioned, Zod-validated. Every element carries a **stable `id`** (used for graph projection + mapping-edge rebind). Enum/discrete fields (marked ⟐) are what System One normalizes with confidence.
```ts
DesignIR = {
  version, meta: { projectName, createdAt, sourceInputs: InputRef[] },
  visualLanguage: { mood⟐, themes: ('light'|'dark')[]⟐, keywords[] },
  typography:     { scale⟐ ('compact'|'default'|'large'|'display'), families: FontRef[] },
  colors:         { mode⟐ ('light'|'dark'|'both'), palette: ColorToken[] },
  layout:         { system⟐ ('grid'|'asymmetric'|'centered'|…), density⟐, breakpoints[] },
  components:     Component[]   // { id, name, kind⟐, role, props?, variants? }
  pages:          Page[]        // { id, name, route, sections: SectionRef[] }
  interactions:   Interaction[] // { id, trigger⟐, target, behavior }
  animations:     Animation[]   // { id, type⟐, target, params }
  assets:         Asset[]       // { id, type⟐('3d'|'image'|'video'|'logo'|'font'), src, sizeBytes, dims?, budget? }
  responsiveRules: Rule[],
  constraints:    { mobile:bool, accessibility⟐, performance:{budgets}, seo:bool, technical:{stack, apis?} },
  provenance:     Record<elementId, InputRef[]>   // every element → its source input(s)
}
```

## Repo ingestion (existing-repo mode) — tiered
Two consumers pull in opposite directions, so ingestion is tiered:
- **Planner** needs *broad, shallow* coverage of the whole repo (what exists, dependency shape) to reason about ripple/siblings.
- **Executor** needs *deep, narrow* detail only about the slice it edits.

```
Cheap sweep (whole repo)              Deep parse (on demand, per node)
  tree-sitter per file                  full symbols/types/call-sites
  → file/module nodes                   → symbol-level nodes for touched files
  → import/export/route edges           → attached under the file node
  (no grammar → file-tree-only)
```

- **Cheap tier:** tree-sitter per language → file/module nodes + dependency edges. Languages without a grammar fall back to file-tree-only (known ceiling; add a grammar to upgrade).
- **Deep tier:** on demand, materialize symbol-level nodes for the files a task touches. Keeps the graph small by default.
- **Freshness:** git-diff driven — re-ingest only files changed since last ingest. Deterministic, fits local-first + evidence trail; no daemon.
- **Granularity:** file/module nodes by default; symbols on demand.
- **Grammar order:** TS/TSX/JS/JSX first, then JSON/CSS/HTML, then Python; others via added grammars (file-tree-only until a grammar exists).

### Monorepo / multi-package (full orchestration)
Repo boundary = git root. Detect workspaces (`pnpm-workspace.yaml`, `package.json` workspaces, turbo/nx configs). Each **package = a sub-region** of the knowledge graph (package node + its file/module nodes); cross-package imports become **cross-package dependency edges**. The execution graph is **topologically ordered across packages** — a package's impl waits on packages it depends on. The working branch/worktrees span the whole repo (a change may touch several packages). Fan-out + sequential execution still applies, but respects cross-package order. (This is the one place v1 takes the heavier option.)

## Quality & evidence
- **Deterministic-first (§113.7, §22):** build, typecheck, lint, tests, a11y/perf audits are deterministic pass/fail — no LLM. The decision layer scores only what has no deterministic check (visual QA, code↔design mapping).
- Independent checkers separate from the implementer — the **decision layer** is the independent evaluator (avoid evaluation leakage).
- Acceptance criteria are measurable, bound to design nodes, and authored by the **independent criteria pass** (outside the implementer); the decision layer scores evidence against them.
- Baselines (existing site/build) compared against candidates.
- Human gates are explicit graph nodes; the v1 default set is in "Default gates" (under Execution-graph generation, below): design approval, low-confidence, risky ops, pre-release — reached via the escalation ladder.

### Visual QA (screenshots → decisions) — hybrid
Jev/the decision layer can't read pixels, so:
```
screenshot ─► vision LLM: extract structured facts
              (layout, overlaps, spacing, element presence, 3D placement, responsive)
                      │
                      ▼
              decision layer: score facts vs acceptance criteria (+ confidence)
                      │
             confidence low? ──► deliberate vision LLM re-inspects the actual screenshot
                      │
                      ▼
                 pass / fail + evidence
```
Keeps criteria independent of the extractor and routes everything through the one scoring path, with a pixel-level fallback only when it's uncertain.

## Versioning & adaptability
Version everything meaningful: code, design spec, knowledge graph, execution graph, agent config, prompts, policies, evaluation criteria, tests, artifacts. Graph is re-executable across versions; post-deploy observation can spawn new graph work.

## Execution-graph generation (fixed template + dynamic fan-out)
The graph is **not** freely synthesized. A fixed canonical skeleton is instantiated per project; the **only** dynamic part is fan-out — one implementation+loop node per **unrealized design node**. Predictable and inspectable, still project-shaped, and "keeps the graph small" by construction.
```
INTAKE → PLAN → DESIGN ANALYSIS → ARCHITECTURE →
   ┌─────────── fan-out: one impl+loop node per unrealized design node ───────────┐
   │   impl(Hero)     impl(Nav)     impl(ProductCard)     impl(3D robot) ...        │
   └───────────────────────────────────┬──────────────────────────────────────────┘
INTEGRATION → CODE QA → BROWSER QA → VISUAL QA → PRE-RELEASE GATE ▮
```
▮ **v1 ends at the verified build** — the working branch + evidence is the deliverable. RELEASE/deploy is **out of v1** (a later gated node with deploy-provider + secrets handling). Each impl node loops internally.

### Run safety ceilings
- **Per-node repair retry cap** (default 3): after N failed repair loops a node **escalates to a gate** instead of looping forever.
- **Run cost/step budget:** when exceeded, `run` **halts to a gate** rather than spending unboundedly.
- Both live in `policies/` and are configurable.

### Default gates (v1) — autonomous-with-gates
All four on by default: **design approval** (human reviews the interpreted IR before implementation), **low-confidence decisions** (the escalation ladder's human rung, incl. inferred code→design mappings), **risky ops** (dependency changes, DB migrations, deletions, security-sensitive edits — gated individually mid-run), **pre-release/final review** (finished build + evidence).

### Recovery, baselines, tests
- **Resumable:** checkpoint after each node; a gate halts and returns control, resumed by `gate.resolve`.
- **Baseline (modify mode):** snapshot build/tests/lighthouse at intake, before edits.
- **Tests:** gate-tests derived from the independent acceptance criteria (not the implementer).

### State machines (canonical §97 / §98)
- **Project:** `draft → planning → executing → verifying → awaiting-approval → released → monitoring → maintenance → archived` (can return to planning/executing/verifying when requirements change). v1 exercises through `awaiting-approval`; monitoring/maintenance are post-deploy (out of v1).
- **Node:** `pending → ready → running → verifying → (complete | retry → blocked → escalated)`, plus `cancelled`. Encoded as `ProjectStatus` / `ExecNodeStatus` types in the scaffold.

## Repository layout (platform scaffold)
Single TypeScript package (extract to a pnpm workspace per canonical §58 when other-language
workers arrive). Runs on Node ≥22.6, targets 24 LTS. Current layout is listed in
`information.md` §7; the short version:

```
src/core/     api (Engine) · types · ir · graph · decision · policy · store · runtime
              loop · verify · scaffold · design/style · browser · visual · compiler
              plan · deploy · ingest · state · events
src/mcp/      MCP server (weave-mcp)
src/cli/      CLI adapter
design-guide/ 91 style guides + _base.md floor + styles.json
demo-design/  reference pictures per style
```

Seams that still need live credentials — `ClaudeDecision`, `ClaudeCodeExecutor`,
`PlaywrightBrowserWorker` — are implemented and exercised via fakes in the 22 self-checks.
