# Weave — context for every session

Weave is the control and governance layer for AI coding agents (web apps first): agents execute;
Weave governs, verifies and records. TypeScript headless core + CLI (`weave`) + MCP (`weave-mcp`).
The decision layer decides (typed decisions with confidence), Claude Code creates.

**Start every session by reading `docs/handoff.md`** — where work stopped, what is waiting on the
owner, and the reading order. Decisions live in `docs/current-info.md` (numbered; never contradict
one silently), open questions in `docs/to-be-discussed.md`, what real runs found in
`docs/findings.md`.

## How the owner works

- **Always ask; never assume.** Any choice, preference or edge case → ask, as multiple choice with
  the recommended option first. If an answer is unclear, explain and ask again.
- **Commit and push code and docs after each phase** (#90), straight to `main`; watch CI.
- **Report honestly**: what was verified, what was not, and why. A check never passes on an
  unproven machine — it says "NOT verified here", and CI (`WEAVE_REQUIRE_TOOLS=1`) fails on that.
- When a decision changes, update `current-info.md` and move the old one to `past-info.md`.
- Docs: plain, precise, no hype. Keep every status line true — grep for stale claims.

## Commands

```bash
pnpm install --frozen-lockfile && pnpm exec playwright install chromium && pnpm tools:gitleaks
pnpm build && pnpm check            # 39 self-checks (WEAVE_REQUIRE_TOOLS=1 to forbid "NOT verified")
node scripts/check-design.mjs       # the 91 design guides
pnpm demo                           # end to end with stand-in agents, no accounts
node dist/cli/index.js doctor       # can this machine run the real thing? (one real model call)
pnpm demo:real                      # the real demo: agents in tmux, gates ask, deploys (costs plan usage)
```

A check is `src/core/<name>.check.ts`, built to `dist/` and listed in `package.json` → `check`.

## Things that bite

- **Real runs spend the owner's Claude Pro usage** (about two builds per session window). Ask
  before starting one that was not requested. Agents run in tmux session `weave-<repo>`.
- **Do not rebuild `dist/` while a real run is using it.** Compile elsewhere
  (`npx tsc --outDir <scratch>`) if you must.
- **`pkill -f <pattern>` and `ps … | grep` loops match your own shell's command line** and kill it.
  Kill by a PID you looked up separately.
- Every `claude` Weave starts is isolated from the owner's setup (`ISOLATED_CLAUDE_ARGS`); keep it
  that way — the owner's MCP servers can deploy and push.
- No `ANTHROPIC_API_KEY` is wanted (subscription mode); `TYPESAFE_API_KEY` (Jev) is not set yet.
- Vercel Hobby blocks deploys built from git unless the latest commit is the owner's. Never rewrite
  pushed history to fix that — add a commit.
- The repo is **public**. Never commit secrets, `.env*`, `.vercel/`, or workspace scratch.

## Layout

`src/core/` engine (api.ts is the Engine), `src/core/design/` themes and style checks,
`src/core/decision/` decision providers (Claude subscription, API, Jev), `src/cli/`, `src/mcp/`,
`design-guide/` the 91 guides, `packs/` policy packs, `examples/` the robotics brief and the Go2
model, `bench/` the benchmark, `scripts/` demo, benchmark, tools, the Go2 converter.

Related: the demo site's code is in the private repo `Adhirajsingh2507/weave-robotics-demo`; it is
live at https://weave-robotics-demo.vercel.app.
