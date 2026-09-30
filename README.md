# Weave

**Coding agents write the code. Weave governs the run: what they may touch, how their work is
checked, what a person must approve, and a record of every step.**

(Package/CLI: `weave`; MCP server: `weave-mcp`. Private, pre-release.)

## The problem

A coding agent can build a website from a paragraph. What it cannot give you is a reason to
trust the result:

- **"Done" is the agent's opinion.** Nothing independent checks that each requirement was met.
- **Nothing is bounded.** The agent can read your `.env`, add dependencies, and reach any host.
- **Nothing is remembered.** The next session starts from zero; there is no record of what was
  decided, built, failed, repaired or approved.
- **Parallel agents collide.** Two agents editing the same page produce a merge conflict, not a site.

## What Weave does

You give it a brief — a few lines of text, a screenshot, or a live URL — and a style. Weave:

1. **Turns intent into a checkable plan.** The brief becomes a versioned design document; every
   page, section and constraint becomes a requirement with criteria, written *before* any code
   exists so the implementer cannot grade its own work.
2. **Runs agents inside boundaries.** Each piece of work runs in its own git worktree, owns only
   its own files, cannot read secrets (bubblewrap on Linux, plus Claude Code's own deny rules),
   and reaches only allowlisted hosts. Anything risky — a new dependency, a migration, a deletion,
   a secret — is held for approval. Assets (images, logos, 3D models) are never "built" by an
   agent: Weave acquires, measures and budgets them, and the agent only places them.
3. **Verifies with evidence, not opinion.** Build, structural checks, 50 policy-pack items
   (security, accessibility, SEO, performance) and style rules run on every piece and on the
   assembled site. Failures go back to the agent with the reason; whole-site failures get one
   automatic repair before a person is asked.
4. **Asks a person at the points that matter** — design approval, uncertain readings, risky
   changes, blocked policy items, release — and records every answer.
5. **Records everything.** Every requirement traces to its design, code, criteria, evidence,
   commit and approval. One command renders it as a self-contained page.

## See it

No credentials needed:

```bash
pnpm install && pnpm demo
```

The demo builds a robotics landing page with a stand-in agent that makes common mistakes, and
shows Weave catching each one:

```
→ approve design  (execution begins)
  impl:cta, impl:features, impl:hero: complete      components built in parallel
  impl:home: complete                               the page, after its sections
  repair loop exercised (hero failed once)          an <h1> inside a section, and the robot model
                                                    it was told to place, missing — both caught
  asset:robot (no agent): complete                  acquired, 2,400 triangles, within budget
  policy repair: complete                           a new-tab link without rel=noopener, caught by
                                                    the security pack on the assembled site
→ approve pre-release  (deploys only now)
  ✓ deployed 2e50707 to http://127.0.0.1:…
  ✗ post-deploy checks: 10 passed, 2 failed         the host sends no HSTS or Referrer-Policy
  crit:robot.asset-present: passed                  referenced in the hero section
  crit:robot.asset-visible: unavailable             the screenshot shows an empty hero — the
                                                    model needs a renderer; a vision pass
                                                    (with a key) would fail it
  impl wall-clock 4.3s vs 6.7s one at a time
  explorer: …/.agent/report.html
```

The explorer (`weave report --html out.html`) is one file — no scripts, no network — with the
outcome metrics, the dependency graph as it ran, every attempt on a timeline, each requirement
with its evidence, the repair trail, the gates and the boundary records.

## What is different from running an agent yourself

| | An agent session | A Weave run |
|---|---|---|
| Who decides it is done | the agent | criteria written before the code, checked by tools |
| Secrets and network | whatever the agent's process can reach | masked, hidden and allowlisted, with a record |
| Risky changes | applied | held behind a gate, named |
| Parallel work | one session, or conflicts | a dependency graph with file ownership |
| Afterwards | a chat log | a traceable record: requirement → code → evidence → commit → approval |

**Is the result actually better?** `scripts/benchmark.mjs` answers that with third-party tools
only (Lighthouse, axe, gitleaks, `pnpm audit`) — never Weave's own checks — over N paired runs,
with variance and the runs Weave loses. **It has not been run yet**: it needs real agent runs and
their cost. Until it has, the claim above is about control and evidence, not about quality.

## How it works

```
brief / screenshot / URL
   │  intake: compile to a versioned design (IR); uncertain readings gate
   ▼
knowledge graph ── requirements + criteria (frozen before implementation)
   │
   ▼  plan: scaffold → components ─┬→ pages → integration → policy packs → release
   │                               └ (parallel, each in its own worktree, owning its files)
   ▼
node loop: execute → verify → record → repair  (bounded retries, then a gate)
```

- **Decision layer** — every structured judgement (normalising a reading, classifying a diff's
  risk) is a typed call with a confidence; low confidence goes to a person. Deterministic checks
  are always preferred where they exist.
- **Execution layer** — Claude Code does the building, behind the `NodeExecutor` seam.
- **State** — `.agent/` in your repo: the design, a SQLite graph of requirements, evidence,
  attempts and gates, and an append-only event log. Truth lives there, not in a model's memory.

## Design system

91 style guides in `design-guide/`, each with machine-readable tokens and style-specific checks
(739 checks, ~86% deterministic). `style: swiss-design` in a brief selects one; its tokens travel
in the design document and become the project's `styles/tokens.css`. `weave styles --suggest
"a robotics launch"` proposes three with reasons. `_base.md` is the floor every style inherits.

## Quickstart

New device? **[SETUP.md](SETUP.md)** walks through Linux, macOS and Windows (WSL2) step by step.

```bash
pnpm install
pnpm build
pnpm check                       # 31 self-checks
node scripts/check-design.mjs    # validates the 91 guides and their picture folders
pnpm demo                        # the end-to-end run above, no credentials
```

### A real build

Needs the `claude` CLI on PATH; `ANTHROPIC_API_KEY` adds the decision layer (risk judgement on
every diff, and screenshot intake).

`weave` is `node <weave>/dist/cli/index.js`; `pnpm link --global` in this repo puts it on PATH.

```bash
cd /path/to/new/project && git init && git commit --allow-empty -m init
weave init
weave run --brief <weave>/examples/robotics-landing.brief --assets ./design --name robotics-landing
#   or: weave run --screenshot mock.png --brief two-sentences.txt
#   or: weave run --url https://example.com
weave gates                                     # the intake gate
weave approve <gate-id> --concurrency 3          # builds: components in parallel, pages after
weave gates                                     # risky-op / policy gates if any, then pre-release
weave approve <pre-release-gate-id>             # the verified build is on weave/<run>
weave report --html report.html                  # the whole run, one file
```

`weave sandbox` says how agents are confined on this machine. With Chrome or Chromium installed,
every built page is rendered and screenshotted as evidence. Deployment is off by default;
`WEAVE_DEPLOY=vercel` (with `VERCEL_TOKEN` or a `vercel login`) makes pre-release approval deploy
and re-check the live site. The token reaches only the `vercel` process — never an agent.

### MCP

```bash
weave-mcp          # stdio MCP server
```

Tools: `init`, `run` (with `style`, `screenshots`, `url`), `gates`, `resolve_gate`, `status`,
`gaps`, `ingest`, `exec_graph`, `list_styles`, `suggest_styles`. Resources: every guide
(`style://<slug>`) and its reference pictures (`style-picture://<slug>/<file>`), so a client can
browse styles by example and pick one.

## Status

V2 (V2.0–V2.7) shipped — see `docs/implementation-v2.md`. Proven with stand-in agents and
recorded readings; **not yet exercised with a real Claude Code run**, so the calibration corpus
and the benchmark are empty and no vision verdict has been produced live. Next: the
demonstration plan (`docs/demo-plan.md`) — subscription and API modes, agents in tmux windows,
a real measured build, a public deploy, a free benchmark, and Jev once its docs arrive.

Docs: `docs/handoff.md` is where to start (where work stopped, how to work),
`docs/information.md` the overview, `docs/current-info.md` the decisions,
`docs/demo-plan.md` the current plan, `docs/architecture.md` the design,
`docs/to-be-discussed.md` what is open.

### Publishing this repo

`./scripts/deploy.sh "message"` (or `pnpm ship`) runs build + checks first and never pushes a
broken tree. Requires `gh`; `WEAVE_REPO` and `WEAVE_VISIBILITY` override the defaults.

## Stack

TypeScript · Node ≥22.6 · pnpm · Zod · SQLite · tree-sitter · the Anthropic SDK · Claude Code ·
bubblewrap (optional) · Chrome or Chromium (optional, for rendering) · Playwright (optional).
