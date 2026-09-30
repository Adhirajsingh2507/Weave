// The benchmark (V2.5): the same brief, a plain agent session vs a governed Weave run, scored by
// third-party tools only. Needs the `claude` CLI (and ANTHROPIC_API_KEY for the decision layer).
// Real agent runs cost money: runs × arms builds.
//
//   node scripts/benchmark.mjs [--brief examples/robotics-landing.brief] [--runs 3] [--arms plain,weave] [--out bench]
//
// Fairness: both arms get the same brief text and the same style guide. The Weave arm approves
// every gate automatically (it is headless) and records how many it opened; that count is part
// of the result, not hidden by it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  Engine,
  GitHarness,
  adapterDeps,
  compileBrief,
  loadStyle,
  scrubbedEnv,
  styleBrief,
} from "../dist/index.js";
import { renderBenchmark, runBenchmark } from "../dist/core/benchmark.js";

const { values } = parseArgs({
  options: {
    brief: { type: "string", default: "examples/robotics-landing.brief" },
    runs: { type: "string", default: "3" },
    arms: { type: "string", default: "plain,weave" },
    out: { type: "string", default: "bench" },
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

const plain = {
  name: "plain",
  async build(text, dir) {
    initRepo(dir);
    const prompt = [
      "Build this website as a static site in the current directory, with index.html at the root.",
      text,
      guide ? `Follow this design guide:\n${guide}` : "",
    ].join("\n\n");
    const started = Date.now();
    try {
      execFileSync("claude", ["-p", prompt, "--permission-mode", "acceptEdits"], {
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
    const { deployer: _none, ...deps } = adapterDeps();
    const engine = new Engine({ repoPath: dir, deps: { ...deps, makeHarness: (p) => new GitHarness(p), concurrency: 3 } });
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

const arms = values.arms.split(",").map((a) => ({ plain, weave })[a.trim()]).filter(Boolean);
const result = await runBenchmark({
  brief,
  arms,
  runs: Number(values.runs),
  onProgress: (line) => console.log(line),
});

mkdirSync(values.out, { recursive: true });
writeFileSync(join(values.out, "benchmark.json"), `${JSON.stringify(result, null, 2)}\n`);
const table = renderBenchmark(result);
writeFileSync(join(values.out, "benchmark.md"), `# Benchmark — ${values.brief}\n\n${table}\n`);
console.log(`\n${table}\n\nwrote ${values.out}/benchmark.json and benchmark.md`);
