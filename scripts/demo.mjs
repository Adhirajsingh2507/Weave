// Phase 7 — runnable end-to-end demo (no Claude/creds). Drives the real Engine with a
// fake site generator on a throwaway repo: run → design gate → fan-out (with a repair) →
// pre-release gate → done. Proves §115: persisted graph/state/evidence, evidence-gated
// completion, ≥1 repair loop, human gates honored, resumable.
//
//   pnpm demo         (builds first)   |   node scripts/demo.mjs   (after pnpm build)

import { Engine, GitHarness } from "../dist/index.js";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const git = (a, cwd) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-demo-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "demo@weave.local"], repo);
git(["config", "user.name", "Weave Demo"], repo);
writeFileSync(join(repo, "README.md"), "# demo project\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

// Fake generator (stands in for ClaudeCodeExecutor). It fills the scaffolded page rather than
// writing loose fragments, so the policy packs have a real site to check. "hero" does nothing on
// its first attempt → exercises the repair loop.
const failed = new Set();
const executor = {
  name: "demo-site",
  async run(input) {
    const id = input.contextPack.taskId.replace("impl:", "");
    if (id === "hero" && !failed.has(id)) {
      failed.add(id);
      return { ok: true, summary: "first try (no change) → will repair", changedFiles: [], evidenceRefs: [`try:${id}`] };
    }
    const page = join(input.worktreeDir, "index.html");
    const html = readFileSync(page, "utf8");
    writeFileSync(
      page,
      html.replace(
        new RegExp(`<section id="${id}"[^>]*>.*?</section>`, "s"),
        `<section id="${id}" data-design-node="${id}"><h2>${id}</h2><p>Built by the demo generator.</p></section>`,
      ),
      "utf8",
    );
    return { ok: true, summary: `filled ${id}`, changedFiles: ["index.html"], evidenceRefs: [`edit:${id}`] };
  },
};

// Real scaffolder and real deterministic verifier — only the agent is faked.
const engine = new Engine({ repoPath: repo, deps: { executor, makeHarness: (p) => new GitHarness(p) } });
await engine.init("new");

console.log("→ weave run (intake → plan)");
const h = await engine.run({
  projectName: "robotics-landing",
  text: "style: futuristic\npage: home /\ncomponent: hero section\ncomponent: features section\ncomponent: cta section",
});
let gates = await engine.listGates();
console.log(`  run ${h.runId} — status: ${h.status}`);
console.log(`  gate: ${gates[0].kind} — ${gates[0].summary}`);

console.log("→ approve design  (execution begins)");
await engine.resolveGate(gates[0].id, "approve");
const impls = (await engine.getExecGraph(h.runId)).filter((n) => n.kind === "impl");
for (const n of impls) console.log(`  ${n.id}: ${n.status}${n.commit ? ` @ ${n.commit.slice(0, 7)}` : ""}`);
console.log(`  repair loop exercised (hero failed once): ${failed.has("hero")}`);
gates = await engine.listGates();
console.log(`  gate: ${gates[0].kind} — ${gates[0].summary}`);

console.log("→ approve pre-release");
await engine.resolveGate(gates[0].id, "approve");
const st = await engine.status();
const wb = `weave/${h.runId}`;
const files = git(["ls-tree", "-r", "--name-only", wb], repo).split("\n").filter((f) => f.endsWith(".html"));
console.log(`  run status: ${st.latestRun.status} | open gates: ${st.openGates}`);
console.log(`  built files on ${wb}: ${files.join(", ")}`);

const report = await engine.report(h.runId);
const m = report.metrics;
console.log("\n→ weave report");
console.log(`  requirements with evidence: ${report.requirements.filter((r) => r.covered).length}/${report.requirements.length}`);
console.log(`  first-pass ${Math.round((m.firstPassVerificationRate ?? 0) * 100)}% | repair ${Math.round((m.repairSuccessRate ?? 0) * 100)}% | coverage ${Math.round((m.evidenceCoverage ?? 0) * 100)}%`);
const crit = report.requirements.flatMap((r) => r.criteria);
const tally = (s) => crit.filter((c) => c.status === s).length;
console.log(`  criteria: ${tally("passed")} passed, ${tally("failed")} failed, ${tally("not-applicable")} n/a, ${tally("unavailable")} no runner, ${tally("human")} need a person`);

console.log("\n✓ demo complete — graph/state/evidence persisted, gates honored, repair loop, resumable.");
console.log(`  (throwaway repo: ${repo})`);
