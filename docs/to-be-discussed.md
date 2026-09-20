# To Be Discussed

> Open questions not yet decided. Move each to `current-info.md` / `architecture.md` once resolved.

_Last updated: 2026-09-19_

## Still open / ongoing (data/access-blocked tails only)
- **#1 — RESOLVED:** CLI → **MCP next** (v1's only additional adapter); plugin + website deferred to future versions (order decided then).
- **#8 — framework done, values pending:** `resolveEscalation` + `ThresholdPolicy` implemented + self-checked; real per-type thresholds await **calibration data** from logged (name, confidence, outcome).
- **#10 — seam done, execution pending:** `providerFor` + `ProviderPolicy` implemented; parity-harness *execution* awaits **Jev access**.

## Resolved (see current-info.md / architecture.md)
- #2 Core API surface · #3 Design Compiler (incl. IR Zod schema, modality order, criteria-pass model) · #4 Acceptance-criteria independence · #5 Sandbox/execution env · #5b Deployment scope (out of v1) · #6 Ingestion grammars + monorepo (full multi-package) · #7 Decision-schema catalog · #9 Model roster (all-Claude, procedural independence).
- Plus audit forks: execution-graph generation, run safety ceilings, default gates, decision provider.

## Scaffold — DONE
Repo scaffolded + verified (build/check/CLI green), git on `main`, canonical-aligned. See `current-info.md` → Scaffold status and `../README.md`.

## Next candidates
Per canonical §112/§114, the next real step is **one end-to-end vertical slice** wiring the currently-stubbed seams, in roughly this order:
1. `state.db` (SQLite) + graph store behind the read queries.
2. `Decision` provider (Claude structured-output wrapper).
3. Design Compiler intake (text → IR → design-subgraph).
4. `ClaudeCodeExecutor` (Agent SDK/headless) + `GitHarness` (working branch + worktree + commit/discard).
5. Deterministic QA (build/test) → evidence → gate → resumable `run`.

First slice target (canonical §62/§93): a small "build a landing page" request driven through intake → graph → one impl node loop → deterministic QA → visual evidence → gate → verified build.
