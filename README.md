# Weave

A **graph-driven autonomous engineering platform** — turns human intent + multimodal design inputs into software via bounded agent loops, with persistent state, evidence, and human gates. (Package/CLI: `weave`; MCP: `weave-mcp`.)

> **Status: v1.** End-to-end vertical slice is complete — intent → knowledge graph → gated autonomous build → verified result, with persisted state/evidence, tree-sitter ingestion, an MCP server, parallel worktrees, and gated deployment. **15 self-checks + `pnpm demo` green.** The credentialed adapters (Claude executor/decision, Playwright, real deploy) are implemented and exercised via fakes — set `ANTHROPIC_API_KEY` + the `claude` CLI for real builds (see below). Design docs live in `docs/` (start with `information.md`).

## The idea in one breath
- **Knowledge graph** = what the project *is* (design ↔ code, two layers joined by confidence-weighted mapping edges).
- **Execution graph** = how work moves (fixed skeleton + one impl node per *unrealized design node*).
- **Loop** = local quality inside each node (discover → execute → verify → record → repair).
- **Harness** = each node's bounded env (context pack, git worktree, permissions).
- **Decision layer (System One)** decides/scores/classifies; **Claude Code (System Two)** creates.

## Layout
```
src/
  index.ts          public core API surface (one stable contract)
  core/
    api.ts          Engine — commands / queries / events
    types.ts        shared primitives
    ir/schema.ts    Design IR (Zod, canonical/versioned)
    graph/types.ts  KG + execution graph node/edge kinds
    decision/       Decision (System One) seam + v1 catalog
    runtime.ts      NodeExecutor seam + GitHarness (sandbox)
    state.ts        .agent/ layout
    events/         append-only event log + subscribe
  cli/index.ts      first adapter (thin) over the core
docs/               the living design (start with current-info.md)
```

## Quickstart
```bash
pnpm install
pnpm build
pnpm check                       # 15 self-checks (IR, policy, store, loop, verify, ingest, orchestrator, parallel, deploy, mcp…)
pnpm demo                        # end-to-end pipeline on a throwaway repo (no creds)

node dist/cli/index.js init      # create .agent/ (+ state.db) in cwd
node dist/cli/index.js status    # initialized? latest run + open gates + gap counts
node dist/cli/index.js graph     # unrealized-design + orphan-code
node dist/cli/index.js ingest    # (existing repos) sweep code → dependency graph (tree-sitter)
```

## Real Claude-built site (end to end)
Needs `ANTHROPIC_API_KEY` (Decision layer) and the `claude` CLI on PATH (code generation).
```bash
export ANTHROPIC_API_KEY=sk-...            # your key
cd /path/to/your/new/project && git init && git commit --allow-empty -m init
node <weave>/dist/cli/index.js init
node <weave>/dist/cli/index.js run --brief <weave>/examples/robotics-landing.brief --name robotics-landing
node <weave>/dist/cli/index.js gates       # → design-approval gate id
node <weave>/dist/cli/index.js approve <design-gate-id>   # fan-out: Claude Code builds each component on a worktree, per-node verify, commit
node <weave>/dist/cli/index.js status      # watch progress / find the pre-release gate
node <weave>/dist/cli/index.js approve <pre-release-gate-id>   # verified build on the working branch
```
`run` intakes + plans and stops at the design gate; approving drives the fan-out through the node loop (real `ClaudeCodeExecutor`) to a verified build on the `weave/<run>` branch. Deployment is off by default; provide a `Deployer` (e.g. `CommandDeployer("vercel", ["--prod"])`) to make the pre-release approval deploy. For a creds-free walkthrough of the same flow, run `pnpm demo`.

## MCP server (delivery mode)
```bash
node dist/mcp/bin.js               # or the `weave-mcp` bin — stdio MCP server
```
Exposes the Engine as MCP tools (`init`, `run`, `ingest`, `status`, `gaps`, `gates`, `resolve_gate`, `exec_graph`) for any MCP client.

## Deploy to GitHub
Runs `pnpm build` + `pnpm check` first (aborts if either fails — never pushes a broken tree), then: first run creates a **private** repo `Weave`; every run stages, commits, and pushes. Requires `pnpm` and the GitHub CLI (`gh`) authenticated.
```bash
./scripts/deploy.sh "your commit message"     # or: pnpm ship "your commit message"
```
Overrides: `WEAVE_REPO=<name>` and `WEAVE_VISIBILITY=private|public`.

## Stack
TypeScript · Node 24 LTS (runs on ≥22.6) · pnpm · Zod · tree-sitter (ingestion) · Playwright (browser/visual QA) · SQLite→Postgres · Claude Code runtime. See `docs/current-info.md`.
