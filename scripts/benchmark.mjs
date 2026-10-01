// The benchmark (V2.5, run in D7): the same brief, a plain agent session vs a governed Weave run,
// scored by free open-source tools only (Lighthouse, axe, gitleaks, pnpm audit — decision #81).
// Both arms run on the `claude` subscription login; nothing is billed per token.
//
//   node scripts/benchmark.mjs [--brief examples/robotics-landing.brief] [--runs 3] [--arms plain,weave] [--out bench]
//
// Fairness: both arms get the same brief, the same style guide, the same assets, the same model
// (Opus 5.5), the same tools and the same isolation from the user's setup. The Weave arm approves
// every gate automatically and records how many it opened; that count is part of the result.
// Before every build the subscription is pinged: a refusal or a usage limit stops the benchmark
// and the partial result is written — a build starved by a limit would score as a loss it is not.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { copyFileSync } from "node:fs";
import {
  AGENT_TOOLS,
  DECISION_MODEL,
  Engine,
  GitHarness,
  ISOLATED_CLAUDE_ARGS,
  ModelUnavailableError,
  adapterDeps,
  claudeJson,
  compileBrief,
  loadStyle,
  scrubbedEnv,
  styleBrief,
} from "../dist/index.js";
import * as z4 from "zod/v4";
import { renderBenchmark, runBenchmark } from "../dist/core/benchmark.js";

const { values } = parseArgs({
  options: {
    brief: { type: "string", default: "examples/robotics-landing.brief" },
    runs: { type: "string", default: "3" },
    arms: { type: "string", default: "plain,weave" },
    out: { type: "string", default: "bench" },
    assets: { type: "string", default: "examples/assets" },
  },
});

const brief = readFileSync(values.brief, "utf8");
const ir = compileBrief({ text: brief });
const guide = ir.meta.style ? styleBrief(loadStyle(ir.meta.style)) : "";
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function initRepo(dir) {
  git(["init", "-q"], dir);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], dir);
  git(["config", "user.email", "bench@weave.local"], dir);
  git(["config", "user.name", "Weave Bench"], dir);
  writeFileSync(join(dir, "README.md"), "# benchmark\n");
  git(["add", "-A"], dir);
  git(["commit", "-q", "-m", "init"], dir);
}

/** Build the project if it knows how; score dist/ when it exists, else the root. */
function siteOf(dir) {
  if (existsSync(join(dir, "package.json"))) {
    try {
      execFileSync("pnpm", ["-s", "build"], { cwd: dir, stdio: "ignore", timeout: 300_000 });
    } catch {
      // an unbuildable project is scored as it stands
    }
  }
  return existsSync(join(dir, "dist", "index.html")) ? join(dir, "dist") : dir;
}

/** One tiny call on the subscription: a refusal or a limit stops the benchmark here. */
async function preflight() {
  await claudeJson("Reply ok: true.", z4.object({ ok: z4.boolean() }));
}

const assets = ir.assets.map((a) => a.src.split("/").pop()).filter((f) => existsSync(join(values.assets, f)));

const plain = {
  name: "plain",
  async build(text, dir) {
    initRepo(dir);
    mkdirSync(join(dir, "assets"), { recursive: true });
    for (const f of assets) copyFileSync(join(values.assets, f), join(dir, "assets", f));
    const prompt = [
      "Build this website as a static site in the current directory, with index.html at the root.",
      text,
      assets.length ? `These asset files are already in assets/: ${assets.join(", ")}. Use them where the brief places them.` : "",
      guide ? `Follow this design guide:\n${guide}` : "",
    ].join("\n\n");
    const started = Date.now();
    try {
      execFileSync("claude", ["-p", prompt, "--model", DECISION_MODEL, "--permission-mode", "acceptEdits", "--allowedTools", ...AGENT_TOOLS, ...ISOLATED_CLAUDE_ARGS], {
        cwd: dir,
        env: scrubbedEnv(),
        stdio: "ignore",
        timeout: 30 * 60_000,
      });
    } catch (e) {
      return { ok: false, siteDir: dir, log: String(e), meta: { wallMs: Date.now() - started } };
    }
    return { ok: true, siteDir: siteOf(dir), meta: { wallMs: Date.now() - started } };
  },
};

const weave = {
  name: "weave",
  async build(text, dir) {
    initRepo(dir);
    const { deployer: _none, ...deps } = adapterDeps(process.env, dir);
    const engine = new Engine({ repoPath: dir, deps: { ...deps, makeHarness: (p) => new GitHarness(p), concurrency: 3, assetFolders: [values.assets] } });
    await engine.init("new");
    const started = Date.now();
    const { runId } = await engine.run({ projectName: "benchmark", text });
    const opened = [];
    for (let i = 0; i < 20; i++) {
      const [gate] = await engine.listGates({ runId });
      if (!gate) break;
      opened.push(gate.kind);
      await engine.resolveGate(gate.id, "approve", "benchmark: auto-approved");
    }
    const run = await engine.getRun(runId);
    const metrics = await engine.metrics(runId);
    if (run?.workingBranch) git(["checkout", "-q", run.workingBranch], dir);
    return {
      ok: run?.status === "done",
      siteDir: siteOf(dir),
      meta: { wallMs: Date.now() - started, gates: opened, firstPass: metrics.firstPassVerificationRate, repair: metrics.repairSuccessRate },
    };
  },
};

let stopped;
const guarded = (arm) => ({
  name: arm.name,
  async build(text, dir) {
    if (stopped) return { ok: false, siteDir: dir, meta: { skipped: stopped } };
    try {
      await preflight();
    } catch (e) {
      stopped = e instanceof ModelUnavailableError ? `stopped: ${e.message}` : `stopped: ${String(e)}`;
      console.log(stopped);
      return { ok: false, siteDir: dir, meta: { skipped: stopped } };
    }
    return arm.build(text, dir);
  },
});
const arms = values.arms.split(",").map((a) => ({ plain, weave })[a.trim()]).filter(Boolean).map(guarded);
const result = await runBenchmark({
  brief,
  arms,
  runs: Number(values.runs),
  onProgress: (line) => console.log(line),
});
if (stopped) result.stopped = stopped;

mkdirSync(values.out, { recursive: true });
writeFileSync(join(values.out, "benchmark.json"), `${JSON.stringify(result, null, 2)}\n`);
const table = renderBenchmark(result);
writeFileSync(join(values.out, "benchmark.md"), `# Benchmark — ${values.brief}\n\n${stopped ? `**Stopped early:** ${stopped}. The table holds the runs that completed.\n\n` : ""}${table}\n`);
console.log(`\n${table}\n\nwrote ${values.out}/benchmark.json and benchmark.md`);
