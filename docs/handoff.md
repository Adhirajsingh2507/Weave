# Handoff — start here in a new session

> Where the last session (2026-09-30 → 10-02) stopped, what to read, and how to work. Read this
> first, then the files it points to. Update it at the end of every session.

_Last updated: 2026-10-02_

## Where we stopped

**The demo plan (D0–D9) is built and has run for real.** Real Claude Code agents, in tmux windows
inside bubblewrap, on the owner's Claude Pro subscription, built the robotics landing page twice
(D5 from the brief; D6 from screenshots of a live site) and Weave deployed it:
**https://weave-robotics-demo.vercel.app** (post-deploy checks 12 passed, 0 failed).

What is and is not finished:

| Item | State | What it needs |
|---|---|---|
| **D7 benchmark** (3 pairs) | **done** — the plain agent wins on page scorers; read `bench/notes.md` before quoting it | a decision on what to show instead (a benchmark of control does not exist yet) |
| **D8 Jev** | adapter, parity harness and routing built and proven against a stand-in | `TYPESAFE_API_KEY` on this machine, then `weave parity --write` in a workspace with a corpus |
| **D9 dry run** | `pnpm demo:real` and `docs/runbook.md` are ready | the owner runs it and reports what to fix |

**The owner's description of how Weave should look and work is still owed** (open item #7). The
demo phases were started without it at the owner's request.

## Working rules the owner set

- **Always ask; never assume.** Any edge case, preference or choice → ask (the owner prefers
  multiple-choice questions with a recommended option first). If an answer is unclear, explain
  and ask again rather than picking.
- **Code and docs are committed and pushed after each phase** (#90); CI is watched. The repo is
  **private** and pushed straight to `main`.
- Report honestly: what was verified, what was not, and why. Checks never pass silently on an
  unproven machine — they say "NOT verified here", and CI (`WEAVE_REQUIRE_TOOLS=1`) fails on it.
- Real runs cost the owner's plan usage. A **Pro** session window holds about two builds; a
  limit stops Weave at a gate, and everything real is resumable.

## Read in this order

1. `docs/current-info.md` — every decision (#1–#117), status, what's next.
2. `docs/demo-plan.md` — D0–D9, each with what was done, when, and what it found.
3. `docs/runbook.md` — how to record and present the demo; measured numbers.
4. `docs/to-be-discussed.md` — open questions and known gaps.
5. `docs/implementation-v2.md` and `docs/architecture.md` — how V2 was built; the design.
6. `README.md` and `SETUP.md` — the outward view and the machine setup.
7. `docs/past-info.md` — history, newest first.

## State of the project

- **V2 complete** (V2.0–V2.7) and **D0–D6 done**: `weave doctor`; decisions and vision through
  the subscription (Opus 5.5); the tools installed and proven in CI; 91 styles rendered for real
  with style checks on the rendered page; the real Go2 in a bundled 3D viewer under a strict CSP;
  agents in tmux windows the owner can watch and type into; a measured real build; screenshot
  intake and a public deploy.
- **Verify on any machine:** `pnpm install --frozen-lockfile && pnpm exec playwright install
  chromium && pnpm tools:gitleaks && pnpm build && pnpm check` (39 checks) `&& node
  scripts/check-design.mjs && pnpm demo`. Then `node dist/cli/index.js doctor`.
- **What real runs found that stand-ins could not** is recorded per phase in `demo-plan.md`. The
  short list: agents inheriting the owner's MCP servers; Chrome's background calls gating;
  an existing `.gitignore` failing every node; a folded turn that never ended; live checks
  grading Vercel's login page; the reference site's copy and brand being reused.

## Things to know before the next real run

- Gates in the recorded runs were approved by Claude with `--yes`, at the owner's request for
  "one go". **The owner's recording should make those calls.**
- A real agent failure and repair happened in one of four builds — it cannot be staged; the
  scripted `pnpm demo` still carries that moment.
- The live site uses the Go2 mesh (BSD-3-Clause, credited in `examples/assets/go2.CREDITS.md`);
  its copy and name are original (#117). The model itself carries a "Go2" marking.
- Usage is measured, not billed: `weave usage` in a workspace.

## Waiting on the owner

| Item | Needed for |
|---|---|
| Their description of how Weave should look and work | the next direction |
| `TYPESAFE_API_KEY` on this machine | D8's real parity run |
| What to show in place of a winning benchmark | the demo's "is it better?" step |
| A dry run of `pnpm demo:real` | D9 |
| Name and licence (#6) | before any public launch |

## This machine (as of 2026-10-02)

Linux, Node 22.23, pnpm 9.15. bubblewrap, tmux, Google Chrome, Playwright Chromium, Lighthouse,
axe, sharp, gltf-transform and gitleaks are installed; `weave doctor` says **Ready**. `claude` CLI
2.1.28x logged in with a **Claude Pro** subscription; Opus 5.5 answers through it. Vercel CLI
logged in (`techadhiraj07-1630`); project `weave-robotics-demo` exists. **No `ANTHROPIC_API_KEY`
and no `TYPESAFE_API_KEY`.** This is the only machine in use (#88).

## Next steps, in order

1. Decide what the demo says about the benchmark (`bench/notes.md`): Weave did not win on page
   scorers, and no benchmark of control exists yet.
2. The owner's dry run of `pnpm demo:real`, and fixes from it.
3. `TYPESAFE_API_KEY` → `weave parity --write` → one real run with Jev serving the passing types.
4. The design discussion (open item #7), and whatever it changes.
