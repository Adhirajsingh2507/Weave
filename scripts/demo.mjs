// Runnable end-to-end demo (no Claude/creds) — the acceptance test every V2 phase keeps green.
// Drives the real Engine with a fake site generator on a throwaway repo:
//   run → design gate → DAG fan-out (components in parallel, page after its sections, one
//   repair) → integration assembles the page → policy packs → pre-release gate → deploy →
//   post-deploy checks against the live URL → done.
// A local server stands in for the host, so the release and its live checks are real too.
//
//   pnpm demo         (builds first)   |   node scripts/demo.mjs   (after pnpm build)

import { Engine, GitHarness, GraphStore, detectSandbox } from "../dist/index.js";
import { realise, tinyGlb } from "../dist/core/testing.js";
import { ChromeBrowserWorker } from "../dist/core/browser.js";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
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

// Fake generator (stands in for ClaudeCodeExecutor), following the V2.3 contract: each
// component writes its own fragment, the page builds its shell, integration assembles them.
// "hero" makes a common agent mistake on its first try — an <h1> in its section, when the page
// already owns one — so the real check fails it and the repair loop fixes it. (Scripted; the
// natural failure from a real agent is V2.5.)
const failed = new Set();
const executor = {
  name: "demo-site",
  async run(input) {
    await new Promise((r) => setTimeout(r, 200)); // stand-in for agent time, so parallelism shows
    const id = input.contextPack.taskId.replace("impl:", "");
    if (id === "hero" && !failed.has(id)) {
      failed.add(id);
      // Wrong twice over: an <h1> the page already owns, and the robot it was told to place is missing.
      return realise(input, `<h1>Robots that work</h1><p>Built by the demo generator.</p>`);
    }
    if (id === "hero") return realise(input); // places what its brief names: assets/robot.glb
    // Another common miss: an external link opened in a new tab without rel="noopener". Every
    // node check passes; only the whole-site security pack sees it, and the repair node fixes it.
    if (id === "cta") {
      return realise(input, `<h2>Book a demo</h2><p><a href="https://example.com/book" target="_blank">Talk to sales</a></p>`);
    }
    if (id === "repair:policy") return repairLinks(input);
    return realise(input, `<h2>${id}</h2><p>Built by the demo generator.</p>`);
  },
};

/** The repair node's fix: add rel="noopener" to every new-tab link in the fragments. */
function repairLinks(input) {
  const dir = join(input.worktreeDir, "sections");
  const changed = [];
  for (const f of readdirSync(dir)) {
    const path = join(dir, f);
    const html = readFileSync(path, "utf8");
    const fixed = html.replace(/<a\b(?![^>]*\brel=)([^>]*target="_blank")/g, '<a rel="noopener"$1');
    if (fixed !== html) {
      writeFileSync(path, fixed, "utf8");
      changed.push(`sections/${f}`);
    }
  }
  return { ok: true, summary: `added rel="noopener" in ${changed.join(", ")}`, changedFiles: changed, evidenceRefs: [] };
}

// The designer's asset folder: the robot model lives outside the project until Weave acquires it.
const designDir = mkdtempSync(join(tmpdir(), "weave-demo-assets-"));
writeFileSync(join(designDir, "robot.glb"), tinyGlb(2400));

// Stand-in host: serves whatever the deployer published, with some security headers set.
const host = createServer((req, res) => {
  const file = join(repo, "dist", req.url === "/" ? "index.html" : (req.url ?? "").slice(1));
  if (!existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { "content-type": "text/html", "x-content-type-options": "nosniff", "x-frame-options": "DENY" });
  res.end(readFileSync(file));
});
await new Promise((r) => host.listen(0, "127.0.0.1", r));
const liveUrl = `http://127.0.0.1:${host.address().port}`;
const deployer = {
  async deploy(path, ctx) {
    execFileSync("pnpm", ["-s", "build"], { cwd: path });
    return { ok: true, url: liveUrl, log: `published ${ctx?.commit ?? ""}` };
  },
};

// Real scaffolder, verifier, integration and packs — only the agent and the host are faked.
const engine = new Engine({
  repoPath: repo,
  deps: {
    executor,
    makeHarness: (p) => new GitHarness(p),
    concurrency: 3,
    deployer,
    assetFolders: [designDir],
    ...(ChromeBrowserWorker.find() ? { browser: new ChromeBrowserWorker({ width: 1280, height: 1600 }) } : {}),
  },
});
await engine.init("new");

console.log("→ weave run (intake → plan)");
const h = await engine.run({
  projectName: "robotics-landing",
  text: "style: futuristic\npage: home /\ncomponent: hero section\ncomponent: features section\ncomponent: cta section\nasset: robot 3d robot.glb in:hero",
});
let gates = await engine.listGates();
console.log(`  run ${h.runId} — status: ${h.status}`);
console.log(`  gate: ${gates[0].kind} — ${gates[0].summary}`);

console.log("→ approve design  (execution begins)");
await engine.resolveGate(gates[0].id, "approve");
const impls = (await engine.getExecGraph(h.runId)).filter((n) => n.kind === "impl");
for (const n of impls) console.log(`  ${n.id}: ${n.status}${n.commit ? ` @ ${n.commit.slice(0, 7)}` : ""}`);
const hero = (await engine.report(h.runId)).nodeFailures.find((f) => f.nodeId === "impl:hero");
console.log(`  repair loop exercised (hero failed once): ${failed.has("hero")}${hero ? ` — ${hero.detail.slice(0, 90)}` : ""}`);
const robotNode = (await engine.getExecGraph(h.runId)).find((n) => n.id === "asset:robot");
const robot = (await engine.getNode("robot"))?.attrs ?? {};
console.log(`  asset:robot (no agent): ${robotNode?.status} — ${robot.path}, ${Math.round(robot.sizeBytes / 1024)} KB, ${robot.triangles} triangles, from ${robot.from}`);
const repair = (await engine.getExecGraph(h.runId)).find((n) => n.id === "repair:policy");
if (repair) console.log(`  policy repair (whole-site check failed, fixed without a human): ${repair.status}`);
gates = await engine.listGates();
console.log(`  gate: ${gates[0].kind} — ${gates[0].summary}`);

console.log("→ approve pre-release  (deploys only now)");
await engine.resolveGate(gates[0].id, "approve");
host.close();
const release = new GraphStore(join(repo, ".agent", "state.db"))
  .evidenceFor({ runId: h.runId })
  .filter((r) => r.node_id === "release" && r.kind === "deploy");
for (const r of release) console.log(`  ${r.ok ? "✓" : "✗"} ${r.detail}`);
const st = await engine.status();
const wb = `weave/${h.runId}`;
const files = git(["ls-tree", "-r", "--name-only", wb], repo).split("\n").filter((f) => f.endsWith(".html") && !f.startsWith("scripts/"));
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
if (report.timing) {
  console.log(`  impl wall-clock ${report.timing.wallMs}ms vs ${report.timing.serialMs}ms one at a time`);
}
for (const id of ["crit:robot.asset-budget", "crit:robot.asset-present", "crit:robot.asset-visible"]) {
  const c = crit.find((x) => x.id === id);
  console.log(`  ${id}: ${c.status} — ${c.evidence.at(-1)?.detail ?? c.rule}`);
}
const shot = new GraphStore(join(repo, ".agent", "state.db")).evidenceFor({ runId: h.runId }).find((r) => r.node_id === "browser-qa" && r.artifact_path);
console.log(`  screenshot: ${shot ? shot.artifact_path : "none — no browser on this machine"}`);
console.log(`  agent sandbox on this machine: ${detectSandbox().detail}`);
const explorer = join(repo, ".agent", "report.html");
writeFileSync(explorer, await engine.reportHtml(h.runId), "utf8");
console.log(`  explorer: ${explorer}`);

console.log("\n✓ demo complete — DAG, repair, integration, packs, gated deploy, live checks; all persisted.");
console.log(`  (throwaway repo: ${repo})`);
