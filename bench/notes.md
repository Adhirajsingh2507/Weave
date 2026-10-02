# Reading the benchmark (D7, 2026-10-02)

`benchmark.md` is the table as measured; `benchmark.json` has every run. This page says what
the table does and does not show. Nothing here changes a number.

## What was run

- The robotics brief (`examples/robotics-landing.brief`), the `futuristic` guide, `go2.glb`.
- **3 pairs**: one plain `claude -p` build and one governed Weave build each, on a Claude Pro
  subscription, Opus 5.5, same tools, both isolated from the user's Claude Code setup.
- Scored only by free tools: Lighthouse, axe, gitleaks, `pnpm audit`. No model judged anything.
- All 6 builds produced a site. Three pairs is a small sample: read direction, not a mean ± sd.

## What it shows

**The plain agent won on these scorers.** Lighthouse performance 32 vs 20, best-practices 100 vs
96, agentic-browsing 100 vs 82, on all three pairs. Accessibility (100 vs 99.3), axe violations,
secrets, vulnerable dependencies and SEO are level.

Why the Weave builds scored lower — checked on one of the three Weave builds:

- **Best-practices 96:** two console/network findings from Weave's own scaffold — no favicon
  (a 404), and the bundled 3D viewer naming a source map that is not shipped. Both are fixed in
  the scaffold after this measurement; the table predates the fix.
- **Agentic-browsing 82:** layout shift (0.185 in the build checked).
- **Performance:** both arms are slow (a 950 KB 3D model on a landing page). The Weave build
  checked had 2.0 s of blocking time and a 10.8 s largest paint; the cause was not isolated.
- **axe:** the one Weave violation is `landmark-unique` from the viewer's own live region,
  repeated when a build uses the viewer in two sections.

## What is not the same between the arms

- **The Weave build is served under its own Content-Security-Policy** (its `vercel.json`, which
  Weave's server honours); the plain build has no security headers at all. Served without them,
  the same Weave build scores 100 on best-practices and agentic-browsing. No scorer here rewards
  having a CSP, HSTS or framing protection.
- **The plain agent had open network access** and vendored three.js itself; Weave's agents work
  behind an allowlist that refuses the npm registry.
- **Time:** plain 6.8 / 9.3 / 14.7 min; Weave 12.0 / 4.8 / 5.6 min. Weave opened no gate beyond
  its two mandatory ones in any pair; its first-pass rate was 83%, 100%, 100%.

## What these scorers cannot see

They grade the finished page. They do not measure what Weave is for: that each requirement is
traced to evidence, that agents could not read secrets or reach other hosts, that a risky change
is held, that the result is checked again once it is live. A benchmark that would show that —
planted secrets, a tempting dependency, a brief with a trap — does not exist yet.

**The honest summary for the demo:** on page-quality scorers, a strong model unaided is as good
or better on a simple brief. Weave's case is control and evidence, and this benchmark does not
measure it.
