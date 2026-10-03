# Handoff — start here in a new session

> Where the last session (2026-09-30 → 10-03) stopped, what to read, and how to work. Read this
> first, then the files it points to. Update it at the end of every session.

_Last updated: 2026-10-03_

## In one paragraph

Weave is the control and governance layer for AI coding agents: agents build, Weave bounds,
checks and records them. V2 (V2.0–V2.7) is complete, and the demonstration plan (D0–D9) took it
from stand-in agents to real ones. Real Claude Code agents, each in its own tmux window inside
bubblewrap, on the owner's Claude Pro subscription, built a robotics landing page twice (D5 from a
brief, D6 from screenshots of a live site), and Weave deployed it to
**https://weave-robotics-demo.vercel.app** (post-deploy checks 12 passed, 0 failed). A 3-pair
benchmark ran, and **Weave lost on page-quality scorers**. Everything the real runs found —
results, defects, the benchmark — is in `findings.md`.

## Where things stand

- **Weave repo** (`Adhirajsingh2507/Weave`, **public**): last commit `20688c6`, CI green, working
  tree clean, 39 self-checks.
- **Demo site repo** (`Adhirajsingh2507/weave-robotics-demo`, **private**): the build's history,
  one commit per agent; last commit `0650e94`. The live site is built by Vercel from this repo's
  code (project `weave-robotics-demo`), but **not yet on push** — see below.
- **Nothing is half-built.** No run is in progress; no tmux sessions are open.

| Phase | State |
|---|---|
| D0–D4.5 (preflight, subscription decisions and vision, tools, themes, 3D, tmux agents) | done |
| D5 first measured build | done — 11.9 min, 6 sessions, 0 retries, autonomous |
| D6 screenshot intake + public deploy | done — live, 12/12 post-deploy checks |
| D7 benchmark (3 pairs) | done — plain wins Lighthouse performance, best-practices, agentic-browsing; the rest level (`bench/notes.md`) |
| D8 Jev | built and proven against a stand-in; **the real run needs `TYPESAFE_API_KEY`** |
| D9 recording kit | built (`pnpm demo:real`, `docs/runbook.md`); **the owner's dry run is pending** |

## Waiting on the owner

| # | Item | Needed for |
|---|---|---|
| 7 | Their description of how Weave should look and work — owed since 2026-09-30 | the next direction |
| 15 | What the demo shows in place of a winning benchmark | the demo's "is it better?" step |
| 16 | Whether to score both benchmark arms the same way (CSP vs none) | the next benchmark |
| 17 | A dry run of `pnpm demo:real`, making every gate call themselves | D9 |
| 12 | `TYPESAFE_API_KEY` on this machine | D8's real parity run |
| 13 | Vercel's GitHub app given access to `weave-robotics-demo` (github.com → Settings → Applications → Vercel → Repository access), then `vercel git connect` in the site repo | deploy-on-push |
| 6, 14 | A name and a licence — the public repo is all rights reserved without one | anyone else using Weave |

Numbers are rows in `to-be-discussed.md`.

## Working rules the owner set

- **Always ask; never assume.** Any choice, preference or edge case → ask, as multiple choice with
  the recommended option first. If an answer is unclear, explain and ask again.
- **Commit and push code and docs after each phase** (#90), straight to `main`; watch CI.
- **Report honestly**: what was verified, what was not, and why. Checks never pass silently on an
  unproven machine — they say "NOT verified here", and CI (`WEAVE_REQUIRE_TOOLS=1`) fails on it.
- **Real runs spend the owner's plan usage** (a Pro session window holds about two builds). Ask
  before starting one that was not requested. A limit stops Weave at a gate; everything resumes.
- When a decision changes, update `current-info.md` and move the old version to `past-info.md`.

`CLAUDE.md` at the repo root repeats these and the traps below; it loads into every session.

## Read in this order

1. `docs/findings.md` — what running for real showed.
2. `docs/current-info.md` — every decision (#1–#120), status, what is next.
3. `docs/to-be-discussed.md` — open questions and known gaps.
4. `docs/demo-plan.md` — D0–D9, each with what was done and what it found.
5. `docs/runbook.md` — how to record and present the demo; measured numbers.
6. `docs/architecture.md` and `docs/implementation-v2.md` — the design; how V2 was built.
7. `README.md` and `SETUP.md` — the outward view and machine setup.
8. `docs/past-info.md` — history, newest first, when you need the reasoning behind a change.

## How to pick up

```bash
cd /home/adhiraj-singh/project/autodesign
git pull && pnpm install --frozen-lockfile && pnpm build
pnpm check                          # 39 checks
node dist/cli/index.js doctor       # should say Ready (makes one real model call)
```

- **The real demo:** `pnpm demo:real` — a fresh workspace in `~/weave-demo/robotics`, capture of
  the reference site, intake, agents in tmux (`tmux attach -t weave-robotics`), every gate asks,
  deploy, explorer and usage. Re-run it to resume. `--yes` approves every gate; the owner's
  recording should not use it.
- **The benchmark:** `node scripts/benchmark.mjs --runs 3 --out bench` resumes from
  `bench/benchmark.json`; delete that file to start over.
- **Redeploy the demo site:** from a clone of `weave-robotics-demo`, `vercel link --project
  weave-robotics-demo` then `vercel deploy --prod`. The latest commit must be authored by the
  owner (Vercel Hobby blocks other authors on deploys it builds from git).

## Traps hit in this session

- Real runs consume the plan; a session limit mid-run is normal — approve the stop gate after it
  resets.
- Do not rebuild `dist/` while a real run is using it.
- `pkill -f <pattern>` and `ps | grep` loops match their own shell's command line and kill it; kill
  by a PID you looked up separately.
- A laptop that sleeps mid-turn makes the turn "time out" on wake; it is interrupted and repaired.
- Never rewrite pushed history (the permission system blocks force-pushes); add a commit.
- The Weave repo is public: never commit secrets, `.env*`, `.vercel/` or scratch workspaces.

## Things to know before the next real run

- Every gate in the recorded runs was approved by Claude with `--yes`, at the owner's request for
  "one go" — including style suggestions read from screenshots.
- A real agent failure and repair happened in two of seven completed real builds; it cannot be
  staged. The scripted `pnpm demo` still carries that moment.
- References are read for design only (#117): the site's copy and name ("Quadruped Robotics") are
  original; the Go2 model is Unitree's (BSD-3-Clause, credited) and carries a "Go2" marking.
- `weave usage` reports what a run cost; nothing is billed per token on the subscription.

## This machine (as of 2026-10-03)

Linux, Node 22.23, pnpm 9.15. bubblewrap, tmux, Google Chrome, Playwright Chromium, Lighthouse,
axe, sharp, gltf-transform and gitleaks are installed; `weave doctor` says **Ready**. `claude` CLI
2.1.287 logged in with a **Claude Pro** subscription; Opus 5.5 answers through it. Vercel CLI
logged in (`techadhiraj07-1630`). `gh` logged in; both repos push over SSH. **No
`ANTHROPIC_API_KEY` and no `TYPESAFE_API_KEY`.** This is the only machine in use (#88).

Scratch workspaces from the real runs live under `/tmp` and are not kept; everything worth keeping
is in the two repos, `bench/` and the docs.

## Next steps, in order

1. Decide what the demo says about the benchmark (#15) — and whether to build a benchmark of
   control (planted secrets, a tempting dependency, a brief with a trap).
2. The owner's dry run of `pnpm demo:real` (#17), and fixes from it.
3. `TYPESAFE_API_KEY` → `weave parity --write` → one real run with Jev serving the types that pass.
4. Vercel's GitHub access for deploy-on-push (#13); a name and licence (#6, #14).
5. The design discussion (#7), and whatever it changes.
