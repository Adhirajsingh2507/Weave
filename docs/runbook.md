# Demo runbook — Weave for engineering leaders

> How to record the real run and walk through it live. One command produces everything; this page
> says what to click, what to say, where each proof lives, what to cut for a shorter slot, and
> what to do when something misbehaves. Numbers quoted here are from real runs on this machine
> (see "Measured" at the end) — re-measure before you quote them on stage.

_Last updated: 2026-10-01_

## Before the day (once)

1. `weave doctor` says **Ready** (`node dist/cli/index.js doctor`). It checks the `claude` login
   and plan, one real Opus 5.5 call through the egress proxy, Vercel, bubblewrap, Chrome, tmux,
   the tools and gitleaks.
2. Vercel: the project `weave-robotics-demo` exists (`vercel project add weave-robotics-demo`
   once; the deploy creates nothing else).
3. Plan limits: one real build is ~6 agent sessions plus ~10–20 Opus calls. On a **Pro** plan,
   record early in your usage window; if a limit hits mid-run, Weave stops and asks — re-run the
   same command later and it resumes.
4. Two terminals side by side, large font: left for `pnpm demo:real`, right for
   `tmux attach -t weave-robotics` (the agents' windows). A browser for the explorer and the URL.

## Record the run (one command)

```bash
pnpm demo:real            # stops at every gate and asks; --yes approves all; --no-deploy skips Vercel
```

What happens, in order, and what to say:

| Step | On screen | Say |
|---|---|---|
| Doctor | a table of `ok` rows | "Before anything is spent, Weave checks this machine can do it — login, model, sandbox, deploy." |
| Capture | six screenshots of the Go2 site | "A real website. Weave reads it like a person scrolling — one screen at a time, after the animations run." |
| Intake | the design gate, with readings and a **style suggestion** | "Vision read the layout, colours and type. It suggests a style but never picks one alone — the look the whole build rests on is my call." Approve with notes if you change anything. |
| Build | tmux: five agent windows, three at a time | "Each agent is a real Claude Code session in its own folder. It can only touch its own files; secrets are unreadable to it; the network is closed except the model. I can watch — and if I type, that's recorded as an intervention." |
| A failure | a node fails a check, a repair message appears in the same window | "That's not staged. Weave checked the work, found a real problem, and sent the reason back into the same session. The agent fixed it." |
| Risk / policy gates | a gate listing findings | "Anything risky — a dependency, a secret-shaped string, a host off the list — is held for a person, with the reason." |
| Pre-release | "Build verified; N page(s) rendered; visual QA …" | "It rendered the page in a browser, under the production security policy, and a vision check confirmed the robot is actually visible." Approve → deploy. |
| Release | `release: deployed … to https://…vercel.app` and post-deploy checks | "Live. The same security checks re-run against the public URL." |
| Usage | the usage table | "What it cost, measured — sessions, retries, tokens, decision calls." |

## The live walkthrough (the explorer)

Open `~/weave-demo/robotics/.agent/report.html` (one offline file). Show, in this order:

1. **Requirements → evidence.** Each requirement, its criteria, the evidence for each, the commit
   and who approved it. Click the hero: placed, within budget, *visible* — three facts, three proofs.
2. **The repair trail.** The failed check, the reason, the second attempt that passed.
3. **Boundaries.** Per node: sandbox (bubblewrap), the hosts it contacted, what was refused.
4. **Metrics.** First-pass rate, repair success, interventions, evidence coverage.
5. **The live site.** Open the URL; open devtools → Network → response headers: the CSP and HSTS
   that the live checks verified.
6. **Is it better?** `bench/benchmark.md` and `bench/notes.md` — plain `claude -p` vs Weave, same
   brief, scored only by Lighthouse, axe, gitleaks and `pnpm audit`. **Weave does not win it**:
   on page scores a strong model unaided is as good or better. Say so, then say what those
   scorers cannot see — the evidence, the boundaries, the gates you just showed.

## Shorter slots

| Slot | Keep | Cut |
|---|---|---|
| 5 min | the problem, the explorer (requirements → evidence), the live URL | the recording, the benchmark |
| 10 min | + the recording sped up 8× through the build, the repair moment at 1× | per-node boundaries |
| 20 min | everything above + boundaries + the benchmark | — |
| 30+ min | + a live intervention: type into an agent's window and show it counted | — |

## When something misbehaves

| Problem | Do |
|---|---|
| A usage limit mid-run | Weave stops at a gate naming it. Stop, play the recording instead; re-run `pnpm demo:real` later — it resumes. |
| The live site is slow or down | The explorer is offline; show the deploy evidence and the post-deploy check results inside it. |
| An agent window looks stuck | Attach and watch; a turn has a 30-minute ceiling, then the node fails and repairs. Do not type unless you mean it — typing counts as an intervention. |
| The style suggestion is wrong | That is the feature: correct it in the gate notes and approve. |
| Vercel asks for login | `vercel login` before the session; Weave never handles the token itself. |

## Where each proof lives

| Claim | Proof |
|---|---|
| Every requirement traced to code and evidence | `.agent/report.html`, `weave report` |
| Agents confined | per-node `sandbox` and `network` evidence; `src/core/sandbox.check.ts` |
| A secret is unreadable to an agent | `sandbox.check` (CI, every push) |
| The robot is visible, not just referenced | the `asset-visible` criterion with its screenshot |
| The deploy is checked live | `release` evidence: URL, commit, post-deploy checks |
| Decisions are typed and recorded | `.agent/evidence/decisions.jsonl` (model, confidence, usage per call) |
| Cost | `weave usage` |

## Measured (2026-10-01, this machine, Claude Pro, Opus 5.5)

| Run | What | Wall clock | Agent sessions | Retries | Gates beyond the two mandatory | Result |
|---|---|---|---|---|---|---|
| D5 | robotics brief, style given | 11.9 min | 6 | 0 | 0 | done, autonomous; 26 criteria passed, 0 failed |
| D6 | brief + six screenshots, style read | 33.1 min | 9 | 0 | 2 (uncertain readings; a refused registry call) | deployed; live checks 12/12 |

- One build is roughly 250–660k output tokens across its sessions, plus 6–7 decision calls
  (API-price equivalent about $0.30, not billed on a subscription).
- A Pro session limit is reachable inside two builds in one window. Weave stops at a gate naming
  it; re-run `pnpm demo:real` after the reset.
- A real agent failure and repair happened in one of four builds. Do not count on it live.
- Benchmark (3 pairs): plain wins Lighthouse performance (32 vs 20), best-practices (100 vs 96)
  and agentic-browsing (100 vs 82); everything else is level. See `bench/notes.md`.
