// ponytail: V2.3 — parallelism as a property of the graph. Three scenarios on real repos:
//   1. the DAG: components run concurrently, a page waits for its own sections, integration
//      assembles fragments into pages, and the report records what parallelism bought;
//   2. ownership: a node that edits a shared file fails verification, naming the file;
//   3. conflict: two nodes collide on integration, the loser re-runs on the new tip and
//      completes with no human involved, both tries on the evidence trail.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { Engine } from "./api.js";
import { renderReport } from "./report.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Scaffolder } from "./scaffold.js";
import type { EngineDeps } from "./api.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

function newRepo(tag: string): string {
  const repo = mkdtempSync(join(tmpdir(), `weave-dag-${tag}-`));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);
  return repo;
}

async function start(repo: string, text: string, deps: EngineDeps): Promise<{ engine: Engine; runId: string }> {
  const engine = new Engine({ repoPath: repo, deps: { makeHarness: (p) => new GitHarness(p), defaultPacks: [], ...deps } });
  await engine.init("new");
  const { runId } = await engine.run({ projectName: "Dag", text });
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  return { engine, runId };
}

// ── 1. The DAG ────────────────────────────────────────────────
{
  const repo = newRepo("order");
  const spans = new Map<string, { start: number; end: number }>();
  const executor: NodeExecutor = {
    name: "timed",
    async run(input: ExecInput): Promise<ExecResult> {
      const id = input.contextPack.taskId.replace("impl:", "");
      const start = Date.now();
      await sleep(300);
      const res = realise(input);
      spans.set(id, { start, end: Date.now() });
      return res;
    },
  };
  const { engine, runId } = await start(
    repo,
    "page: home / hero features\npage: about /about team\ncomponent: hero section\ncomponent: features section\ncomponent: team section",
    { executor, concurrency: 4 },
  );

  const graph = await engine.getExecGraph(runId);
  const node = (id: string) => graph.find((n) => n.id === id)!;
  assert.deepEqual(node("impl:home").dependsOn, ["scaffold", "impl:hero", "impl:features"], "a page depends on its own sections");
  assert.deepEqual(node("impl:about").dependsOn, ["scaffold", "impl:team"]);
  assert.deepEqual(node("impl:hero").owns, ["sections/hero.html", "sections/hero/", "styles/sections/hero.css"]);
  assert.deepEqual(node("impl:home").owns, ["index.html", "styles/pages/home.css"], "the home page owns index.html");
  assert.ok(graph.filter((n) => n.kind === "impl").every((n) => n.status === "complete"), "every impl node completed");

  const s = (id: string) => spans.get(id)!;
  for (const [page, sections] of [["home", ["hero", "features"]], ["about", ["team"]]] as const) {
    for (const sec of sections) {
      assert.ok(s(page).start >= s(sec).end, `${page} started before its section ${sec} finished`);
    }
  }
  const firstEnd = Math.min(s("hero").end, s("features").end, s("team").end);
  assert.ok(["hero", "features", "team"].every((c) => s(c).start < firstEnd), "components ran concurrently");

  // Integration assembled each fragment into its own page, on the working branch.
  const index = readFileSync(join(repo, "index.html"), "utf8");
  assert.match(index, /<!-- weave:fragment hero -->[\s\S]*<section id="hero"/, "hero assembled into index.html");
  assert.match(index, /<!-- weave:fragment features -->/);
  assert.doesNotMatch(index, /weave:fragment team/, "team belongs to the about page");
  assert.match(readFileSync(join(repo, "about.html"), "utf8"), /<!-- weave:fragment team -->/);
  assert.equal(node("integration").status, "complete");

  const report = await engine.report(runId);
  assert.ok(report.timing, "timing recorded");
  assert.ok(report.timing!.serialMs > report.timing!.wallMs * 1.3, `parallelism should save time: ${JSON.stringify(report.timing)}`);
  assert.match(renderReport(report), /impl wall-clock\s+\d+ms vs \d+ms run one at a time/);
  rmSync(repo, { recursive: true, force: true });
}

// ── 2. Ownership ──────────────────────────────────────────────
{
  const repo = newRepo("owns");
  const executor: NodeExecutor = {
    name: "overreach",
    async run(input: ExecInput): Promise<ExecResult> {
      const res = realise(input);
      // Helpfully "fixes" the shared tokens as well — exactly the edit that makes branches collide.
      writeFileSync(join(input.worktreeDir, "styles", "tokens.css"), ":root { --accent: hotpink; }\n");
      return { ...res, changedFiles: [...res.changedFiles, "styles/tokens.css"] };
    },
  };
  const { engine, runId } = await start(repo, "component: rogue section", { executor });

  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "low-confidence", "an out-of-bounds write fails the node");
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "impl:rogue")?.status, "escalated");
  const report = await engine.report(runId);
  const failure = report.nodeFailures.find((f) => f.nodeId === "impl:rogue");
  assert.ok(failure, "the failure is in the report");
  assert.match(failure!.detail, /outside its ownership: styles\/tokens\.css/, "and it names the file");
  assert.match(renderReport(report), /impl:rogue — changed files outside its ownership: styles\/tokens\.css/);
  rmSync(repo, { recursive: true, force: true });
}

// ── 3. Conflict → re-run on the new tip ───────────────────────
{
  const repo = newRepo("conflict");
  // A project the template did not create, so ownership does not apply and a collision can happen.
  const plain: Scaffolder = {
    name: "plain",
    async scaffold(input) {
      writeFileSync(
        join(input.repoPath, "package.json"),
        `${JSON.stringify({ name: "plain", private: true, scripts: { build: "node -e 0", check: "node -e 0" } })}\n`,
      );
      return { files: ["package.json"], summary: "plain project" };
    },
  };
  let conflicted = 0;
  const executor: NodeExecutor = {
    name: "collider",
    async run(input: ExecInput): Promise<ExecResult> {
      const id = input.contextPack.taskId.replace("impl:", "");
      const shared = join(input.worktreeDir, "shared.txt");
      // Both start from the same tip and create the same file: an add/add conflict. On a re-run
      // from the new tip the file exists, so the node adds its line instead.
      if (existsSync(shared)) writeFileSync(shared, `${readFileSync(shared, "utf8")}${id}\n`);
      else writeFileSync(shared, `${id}\n`);
      if (input.contextPack.previousFailures.some((f) => f.includes("conflicted"))) conflicted++;
      writeFileSync(join(input.worktreeDir, `${id}.txt`), id);
      return { ok: true, summary: id, changedFiles: ["shared.txt", `${id}.txt`], evidenceRefs: [] };
    },
  };
  const { engine, runId } = await start(repo, "component: x section\ncomponent: y section", {
    executor,
    scaffolder: plain,
    concurrency: 2,
  });

  const gates = await engine.listGates();
  assert.equal(gates.length, 1);
  assert.equal(gates[0]!.kind, "pre-release", `the conflict resolved without a human, got ${gates[0]!.kind}: ${gates[0]!.summary}`);
  assert.equal(conflicted, 1, "exactly one node re-ran, told why");
  const impls = (await engine.getExecGraph(runId)).filter((n) => n.kind === "impl");
  assert.ok(impls.every((n) => n.status === "complete"), "both nodes completed");
  assert.deepEqual(readFileSync(join(repo, "shared.txt"), "utf8").trim().split("\n").sort(), ["x", "y"], "both changes landed");

  const report = await engine.report(runId);
  const loser = report.nodeFailures.find((f) => /merge conflict/.test(f.detail));
  assert.ok(loser, "the conflict is on the evidence trail");
  const attempts = (await engine.metrics(runId)).firstPassVerificationRate;
  assert.equal(attempts, 0.5, "the re-run counts as a second attempt, not a first pass");
  rmSync(repo, { recursive: true, force: true });
}

console.log("DAG check passed (dependencies respected, ownership enforced with the file named, conflict re-run on the new tip)");
