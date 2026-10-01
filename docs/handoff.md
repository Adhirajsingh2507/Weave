# Handoff — start here in a new session

> Where the last session (2026-09-29 → 30) stopped, what to read, and how to work. Read this
> first, then the files it points to. Update it at the end of every session.

_Last updated: 2026-09-30_

## Where we stopped

**The owner was about to explain how Weave should look and work.** That discussion comes first.
Listen, then ask about anything ambiguous; correct them where it conflicts with what is built or
decided (they asked for that).

Nothing is half-built. The last code commit is `6614981` (V2.7); the last commit overall is the
docs update after `84c7e6d`. CI is green on `main`.

## Working rules the owner set

- **Always ask; never assume.** Any edge case, preference or choice → ask (the owner prefers
  multiple-choice questions with a recommended option first). If an answer is unclear, explain
  and ask again rather than picking.
- **Commit and push only when asked.** The repo is **private** and pushed straight to `main`
  (the project's convention).
- **Documentation is pushed now and after every phase** (#83).
- Report honestly: what was verified, what was not, and why. Checks never pass silently on an
  unproven machine — they say "NOT verified here".

## Read in this order

1. `docs/current-info.md` — every decision (#1–#83), status, what's next. Decisions #75–#83 are
   the newest direction.
2. `docs/demo-plan.md` — the plan now being executed (D0–D9) and what was decided for it.
3. `docs/to-be-discussed.md` — open questions (#7–#11 are the live ones) and known gaps.
4. `docs/implementation-v2.md` — how V2.0–V2.7 were built and what each proved.
5. `docs/architecture.md` — the design, including the planned two ways to run.
6. `README.md` and `SETUP.md` — the outward view and the new-device guide.
7. `docs/past-info.md` — history, newest first, when you need the reasoning behind a change.

## State of the project

- **V2 complete** (V2.0–V2.7): DAG with file ownership, sandbox + egress proxy + risky-op gates,
  gated Vercel deploy with live checks, the HTML explorer, policy packs with a repair loop,
  multimodal intake, 91 style guides as IR tokens and MCP resources, assets acquired and budgeted
  (never built by an agent), pages rendered in Chrome with visual QA.
- **Not yet done with a real agent.** Everything is proven with stand-in agents and recorded
  readings. The calibration corpus and the benchmark are empty.
- **Verify on any machine:** `pnpm install --frozen-lockfile && pnpm build && pnpm check`
  (39 checks) `&& node scripts/check-design.mjs && pnpm demo`.

## The direction just decided (#75–#83)

- Two ways to run: **subscription mode** (Claude Code via the `claude` login) and **API mode**
  (same agents, API key, billed per token).
- Subscription mode: **one tmux window per agent, own folder**; the owner can **watch and step
  in**; their messages **count as interventions**; repairs continue **in the same session**;
  permissions **fully automatic**.
- **Decisions and vision through the subscription** on Opus 5.5 — no API key; refused or
  rate-limited → stop and ask.
- Tests may use Claude; **benchmarks use free open-source scorers**, builds on the subscription.
- Platforms: Linux, macOS, Windows/WSL2; **a macOS sandbox** (`sandbox-exec`, which Apple marks
  deprecated but still ships — the owner was told).
- Demo: engineering leaders; a recorded real run plus a live walkthrough; everything real; the
  robotics landing page; Vercel project `weave-robotics-demo` (code private); model-viewer
  bundled; tools as devDependencies; templates styled for real with runnable style checks;
  reference pictures as links only.

## Waiting on the owner

| Item | Needed for |
|---|---|
| Their description of how Weave should look and work | before D0 |
| `TYPESAFE_API_KEY` on this machine (Jev docs received — #84) | D8 |
| Benchmark size | after the first measured build (D5) |

Settled 2026-09-30: Jev API and data (#84, #85), intake site (#86), robot model (#87), this
Linux machine only with all platforms still supported (#88).

## This machine (as of 2026-09-30)

Linux, Node 22.23, pnpm 9.15. bubblewrap works (the sandbox check proves `.env` unreadable).
Google Chrome installed (renders verified). `claude` CLI 2.1.285 logged in with a **Claude Pro
subscription**; Opus 5.5 answers through it. Vercel CLI logged in. **No `ANTHROPIC_API_KEY`** —
and the owner does not want one for now. tmux is installed. The demo tools (D2) are installed;
`weave doctor` says **Ready**.

## Next steps, in order

1. The design discussion (above) — record outcomes as decisions in `current-info.md`.
2. `demo-plan.md` D5 onward. D0–D4.5 are done. Code and docs
   are pushed after each phase (#90).
