#!/usr/bin/env node
// D9 — the real demo as one command: `pnpm demo:real`. Everything real (decision #75 onward):
// Claude Code agents in tmux windows on the subscription, decisions and vision on Opus 5.5, the
// sandbox on, a real website read from screenshots, a public Vercel deploy, live checks on it.
//
// Idempotent and resumable: all state lives in the workspace's .agent/. Run it again after an
// interruption and it continues from the open gate; run it after it finished and it reprints the
// results. Every gate stops and asks — those decisions are the demo — unless --yes is given.
//
//   pnpm demo:real [--dir ~/weave-demo/robotics] [--url <site>] [--yes] [--no-deploy]

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { Engine, GitHarness, adapterDeps, doctor, renderDoctor, renderUsage } from "../dist/index.js";
import { PlaywrightBrowserWorker } from "../dist/core/browser.js";
import { GraphStore } from "../dist/core/store/graph-store.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const { values } = parseArgs({
  options: {
    dir: { type: "string", default: join(homedir(), "weave-demo", "robotics") },
    url: { type: "string", default: "https://ai-robots.apps.mdxpreview.xyz/unitree-go2" },
    project: { type: "string", default: "weave-robotics-demo" },
    yes: { type: "boolean", default: false },
    "no-deploy": { type: "boolean", default: false },
  },
});
const dir = values.dir;
const say = (s) => console.log(`\n▸ ${s}`);

// The brief: structure and the robot, no style — the style comes from what intake reads (D6).
const BRIEF = `page: home /
component: nav nav
component: hero section
component: features section
component: cta section
component: footer footer
asset: robot 3d go2.glb in:hero
`;

// ── 0. Preflight ─────────────────────────────────────────────
say("weave doctor");
const rows = await doctor({});
console.log(renderDoctor(rows));
if (rows.some((r) => r.status === "fail")) process.exit(1);

// ── 1. Workspace (created once) ──────────────────────────────
const git = (args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
if (!existsSync(join(dir, ".git"))) {
  say(`new workspace ${dir}`);
  mkdirSync(dir, { recursive: true });
  git(["init", "-q"]);
  git(["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(["config", "user.email", "demo@weave.local"]);
  git(["config", "user.name", "Weave demo"]);
  writeFileSync(join(dir, "README.md"), "# Robotics landing page — built by Weave\n");
  writeFileSync(join(dir, ".gitignore"), "intake/\n");
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "init"]);
}

const env = {
  ...process.env,
  ...(values["no-deploy"] ? {} : { WEAVE_DEPLOY: "vercel", WEAVE_DEPLOY_PROD: "1", WEAVE_DEPLOY_PROJECT: values.project }),
};
const deps = adapterDeps(env, dir);
const engine = new Engine({ repoPath: dir, deps: { ...deps, makeHarness: (p) => new GitHarness(p), concurrency: 3, assetFolders: [join(ROOT, "examples", "assets")] } });
if (deps.executor?.attachCommand) console.log(`agents run in tmux windows — watch or step in with: ${deps.executor.attachCommand}`);

// ── 2. Intake: the live site, read from screenshots ──────────
let run = existsSync(join(dir, ".agent", "state.db")) ? (await engine.status()).latestRun : undefined;
if (!run) {
  await engine.init("new");
  const shots = join(dir, "intake");
  if (!existsSync(shots) || !readdirSync(shots).length) {
    say(`capturing ${values.url}, one viewport at a time`);
    mkdirSync(shots, { recursive: true });
    await new PlaywrightBrowserWorker({ width: 1440, height: 900 }).captureViewports(values.url, shots, { count: 6 });
  }
  const screenshots = readdirSync(shots).filter((f) => f.endsWith(".png")).sort().map((f) => join(shots, f));
  say(`intake: brief + ${screenshots.length} screenshots → design (vision on Opus 5.5)`);
  const handle = await engine.run({ projectName: "Unitree Go2", text: BRIEF, screenshots });
  run = { runId: handle.runId };
}
const runId = run.runId;

// ── 3. Gates: each one stops and asks ────────────────────────
const rl = values.yes ? undefined : createInterface({ input: process.stdin, output: process.stdout });
for (;;) {
  const [gate] = await engine.listGates({ runId });
  if (!gate) break;
  say(`gate: ${gate.kind} — ${gate.summary}`);
  for (const e of gate.evidenceRefs ?? []) console.log(`    · ${e}`);
  let decision = "approve";
  let notes = "approved in the demo";
  if (rl) {
    const answer = (await rl.question("  approve / reject / notes:<text> (approve with notes) › ")).trim();
    if (answer.startsWith("reject")) decision = "reject";
    else if (answer.startsWith("notes:")) notes = answer.slice(6).trim();
  }
  await engine.resolveGate(gate.id, decision, notes);
  if (decision === "reject") break;
}
rl?.close();

// ── 4. Results ───────────────────────────────────────────────
const final = await engine.getRun(runId);
say(`run ${runId}: ${final?.status}`);
const report = join(dir, ".agent", "report.html");
writeFileSync(report, await engine.reportHtml(runId));
console.log(`explorer: ${report}`);
console.log(renderUsage(await engine.usage(runId)));
const release = new GraphStore(join(dir, ".agent", "state.db")).evidenceFor({ runId, nodeId: "release" }).filter((e) => e.kind === "deploy");
for (const e of release) console.log(`release: ${e.detail}`);
