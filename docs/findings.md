# Findings — what running Weave for real showed

> Weave was built and proven with stand-in agents. Between 2026-09-30 and 2026-10-02 it ran for
> real: real Claude Code agents, on a Claude Pro subscription, building and deploying a site. This
> page collects what that found — the results, the defects no stand-in could have caught, and the
> benchmark, losses included. Per-phase detail is in `demo-plan.md`; decisions are in
> `current-info.md` (#84–#118).

_Last updated: 2026-10-02_

## The result

- **A real site, built and deployed by Weave:** https://weave-robotics-demo.vercel.app — code in
  the private repo `Adhirajsingh2507/weave-robotics-demo`, one commit per agent. Since 2026-10-02
  the live site is built by Vercel from that repository's code (12 of 12 post-deploy checks pass).
- **Two measured builds** (`weave usage`):

| Run | Input | Wall clock | Agent sessions | Retries | Gates beyond the two mandatory | Outcome |
|---|---|---|---|---|---|---|
| D5 | a brief, style given | 11.9 min | 6 | 0 | 0 | done, autonomous; 26 criteria passed, 0 failed |
| D6 | a brief + six screenshots of a live site, style read from them | 33.1 min | 9 | 0 | 2 | deployed; post-deploy checks 12 passed, 0 failed |

- One build is roughly 250–660k output tokens across its agent sessions, plus 6–7 decision calls
  on Opus 5.5 (API-price equivalent about $0.30; nothing is billed per token on a subscription).
- A Pro plan's session window holds about two builds.

## What worked as designed, for real

- **Boundaries.** A real agent could not read a denied `.env` (Claude Code's own rules and
  bubblewrap). A real agent reached for the npm registry: refused by the egress proxy, held at a
  risky-op gate, and judged risky at 0.62 by the decision layer.
- **Uncertain readings gate.** Vision read six screenshots; the layout, the type scale and the
  suggested style were named with their confidence and stopped for a person.
- **Evidence over self-report.** A hero agent finished without placing the 3D model; the
  placement check failed it, the reason went into the same session, and the second attempt
  passed. Real agent failures were repaired this way in two of the seven real builds that
  completed (that D6 run, and the benchmark's first Weave build).
- **Visual QA.** A vision pass confirmed the model was visible on the rendered page — placed in
  the markup and actually drawn are separate facts.
- **Plan limits.** When the subscription's limit was reached, the benchmark stopped and said so;
  it resumed in the next window from what it had saved.

## Defects only a real run found

Each was found by running, fixed at its cause, and given a check.

| Found in | Defect | Fix |
|---|---|---|
| D0 | Weave's agents inherited the owner's Claude Code setup: MCP servers that can deploy and push, plugins, hooks | every `claude` Weave starts is isolated; verified the deny rules still hold |
| D1 | the CLI rejects the `$schema` key Zod emits | dropped before the call |
| D3 | unquoted font names with digits invalidated whole CSS declarations; font tokens were written as `[object Object]`; the static server crashed on a folder request | quoted stacks; a flattener for `{role, family}`; index files served |
| D4 | the 3D viewer fetches decoders from CDNs and compiles WebAssembly; the security pack scanned the vendored viewer as project source | models are quantised (no decoder); `'wasm-unsafe-eval'` in the CSP; `vendor/` is not project source |
| D4.5 | the folder-trust dialog can take over 30 s to appear inside bubblewrap; agents open Chrome to look at their work and Chrome's background calls gated the change; an a11y pattern failed every multi-line `<nav>` | the dialog is watched for all turn long; browser background hosts are refused and recorded but not a finding; the pattern fixed |
| D6 | an existing `.gitignore` left `dist/` tracked, so the verifier's own build failed every node's ownership check | the scaffold appends to the file |
| D6 | "a turn ends when every prompt has had its Stop": a message queued mid-turn shares one Stop, so Weave waited forever | a turn ends when a Stop follows the latest prompt; a timed-out turn is interrupted |
| D6 | a section's scripts had no place in the build; the 3D optimiser left a temporary file beside the asset | `sections/<id>/` ships; the file is removed |
| D6 | live checks ran against Vercel's per-deployment URL, which is behind a login redirect — they graded the login page | the public alias is used; a response from another host is refused |
| D6 | the build reused the reference site's headlines and brand, against decision #86 | vision is told to describe, not transcribe; agents are told to write original copy |
| D7 | no favicon (a 404) and a dangling source-map reference in the bundled viewer | an empty icon link; the reference is stripped |
| publishing | a deploy built by Vercel from the site's repo was **BLOCKED**: on a Hobby plan the latest commit must be authored by the account's owner, and the site's commits are authored by Weave's agents | an owner-authored commit on top; Weave's direct deploy uploads `dist/` with no git metadata and is unaffected |
| D7 | the benchmark's checkout collided with the user's restored files; a run that died at the plan limit counted as a loss | scored from its own worktree; marked stopped; resumable |

## The benchmark

Same brief, same style guide, same model and tools; a plain `claude -p` build against a governed
Weave build; 3 pairs; scored only by Lighthouse, axe, gitleaks and `pnpm audit`.
`bench/benchmark.md` is the table, `bench/benchmark.json` every run, `bench/notes.md` the reading.

| Metric | Plain | Weave | Head-to-head |
|---|---|---|---|
| Lighthouse performance | 32 ± 5.3 | 20 ± 2.6 | plain 3–0 |
| Lighthouse best-practices | 100 | 96 | plain 3–0 |
| Lighthouse agentic-browsing | 100 | 82 ± 7.5 | plain 3–0 |
| Lighthouse accessibility | 99.3 ± 1.2 | 100 | Weave 1–0, 2 ties |
| axe violations | 0.3 ± 0.6 | 0.3 ± 0.6 | 1–1, 1 tie |
| Secrets, vulnerable dependencies, SEO | level | level | ties |

**Weave did not win it.** On page-quality scorers, a strong model unaided is as good or better on
a simple brief. Three things to know before quoting it:

- The Weave build is scored under its own Content-Security-Policy; the plain build has no security
  headers. Without them the Weave build that was checked scores 100 on best-practices and
  agentic-browsing. No scorer here rewards having the headers.
- Two of the lost points were Weave's own scaffold (the favicon and the source map), fixed after
  the measurement.
- The plain agent had open network access and vendored its own 3D library; Weave's agents work
  behind an allowlist.

These scorers grade the finished page. They do not measure what Weave is for — requirements
traced to evidence, agents that cannot read secrets or reach other hosts, risky changes held,
the result re-checked once live. **A benchmark of that does not exist yet**; building it
(planted secrets, a tempting dependency, a brief with a trap) is the open question.

## What is still unproven

- **Jev.** The adapter, the parity harness and the routing are built and checked against a
  stand-in of its API. No real call has been made: there is no key on this machine. The corpus has
  only `risk.classifyOperation` entries, too few for calibration.
- **A repair on demand.** Two of seven completed real builds had an agent failure to repair; it
  cannot be staged.
- **The owner's own run.** Every gate in the recorded runs was approved by Claude with `--yes`.
- **Style-check coverage.** 110 of 674 deterministic style checks have a rendered-page runner;
  39 can pass. The rest are pending.
- **Other platforms.** Everything was run on one Linux machine. The macOS sandbox is not built.
