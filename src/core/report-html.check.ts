// ponytail: V2.5 — the explorer is one self-contained file. It must open with no network: no
// scripts, no stylesheets, no fonts, no external URLs. It must contain every requirement and
// gate of the run, and it must escape what it prints — requirement text and evidence come from
// briefs, agents and tools, none of which is trusted markup.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { renderExplorer } from "./explorer.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { ExecInput } from "./runtime.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-explorer-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

// A run with a repair in it, so the trail and the timeline have something to show.
let first = true;
const engine = new Engine({
  repoPath: repo,
  deps: {
    executor: {
      name: "r",
      async run(input: ExecInput) {
        if (input.contextPack.taskId === "impl:hero" && first) {
          first = false;
          return realise(input, "<h1>two h1s</h1>");
        }
        return realise(input);
      },
    },
    makeHarness: (p) => new GitHarness(p),
    concurrency: 2,
  },
});
await engine.init("new");
const { runId } = await engine.run({ projectName: "Explorer", text: "page: home /\ncomponent: hero section\ncomponent: cta section" });
await engine.resolveGate((await engine.listGates())[0]!.id, "approve");

const html = await engine.reportHtml(runId);
const report = await engine.report(runId);

// ── Self-contained ────────────────────────────────────────────
assert.doesNotMatch(html, /<script\b/i, "no scripts");
assert.doesNotMatch(html, /<link\b/i, "no linked stylesheets or fonts");
assert.doesNotMatch(html, /@import|url\(/i, "no CSS imports or url() fetches");
assert.doesNotMatch(html, /\b(?:src|href)\s*=\s*["'](?!#)/i, "no src/href pointing anywhere but the page itself");
assert.match(html, /^<!doctype html>/i);

// ── Complete ──────────────────────────────────────────────────
assert.ok(report.requirements.length >= 6, "a run with requirements");
for (const req of report.requirements) assert.ok(html.includes(req.id), `${req.id} is missing from the explorer`);
for (const g of report.gates) assert.ok(html.includes(`<code>${g.kind}</code>`), `gate ${g.kind} is missing`);
assert.ok(html.includes(runId));
assert.match(html, /aria-label="Execution graph"/, "the DAG is drawn");
assert.match(html, /aria-label="Attempt timeline"/, "the timeline is drawn");
assert.match(html, /impl:hero<\/code> — check failed: .*must not contain an &lt;h1&gt;/, "the repair trail carries the reason, escaped");
assert.match(html, /Explorer<\/h1>/, "titled with the project name");

// ── Escaped ───────────────────────────────────────────────────
const hostile = renderExplorer({
  ...report,
  requirements: [{ ...report.requirements[0]!, title: `<img src=x onerror="alert(1)">` }],
  nodeFailures: [{ nodeId: "impl:x", detail: `"><script>alert(2)</script>` }],
});
assert.doesNotMatch(hostile, /<img src=x|<script>alert/, "text is never markup");
assert.match(hostile, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);

rmSync(repo, { recursive: true, force: true });
console.log(`report html check passed (self-contained, ${report.requirements.length} requirements, repair trail with reasons, escaped)`);
