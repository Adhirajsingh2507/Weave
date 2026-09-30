// ponytail: V2.4 — risky-op gates on a node's diff. Deterministic rules always gate; the
// decision layer can add a gate and fills the calibration corpus, but can never remove one.
//   1. a node that adds a dependency is parked behind a risky-op gate naming the package, and
//      approval integrates it;
//   2. a cosmetic diff sails through;
//   3. blocked egress is a finding;
//   4. the decision layer judging a cosmetic diff risky adds a gate and writes the corpus;
//      an unavailable provider is recorded, never fatal;
//   5. rejecting a risky gate discards the parked branch.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { FakeDecision } from "./decision/providers.js";
import { GitHarness } from "./runtime.js";
import { GraphStore } from "./store/graph-store.js";
import type { EngineDeps } from "./api.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Scaffolder } from "./scaffold.js";
import type { Decision } from "./decision/index.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

function newRepo(tag: string): string {
  const repo = mkdtempSync(join(tmpdir(), `weave-risk-${tag}-`));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);
  return repo;
}

// An existing-style project the template did not create: nodes are unrestricted, so a node can
// reach package.json — which is exactly when a dependency change has to be caught.
const plain: Scaffolder = {
  name: "plain",
  async scaffold(input) {
    writeFileSync(
      join(input.repoPath, "package.json"),
      `${JSON.stringify({ name: "plain", private: true, scripts: { build: "node -e 0", check: "node -e 0" }, dependencies: {} }, null, 2)}\n`,
    );
    return { files: ["package.json"], summary: "plain project" };
  },
};

/** Writes <id>.txt; nodes listed in `addDep` also add a dependency; `egress` fakes a blocked call. */
function agent(opts: { addDep?: string[]; egress?: string[] } = {}): NodeExecutor {
  return {
    name: "risky",
    async run(input: ExecInput): Promise<ExecResult> {
      const id = input.contextPack.taskId.replace("impl:", "");
      writeFileSync(join(input.worktreeDir, `${id}.txt`), `${id}\n`);
      const changed = [`${id}.txt`];
      if (opts.addDep?.includes(id)) {
        const path = join(input.worktreeDir, "package.json");
        const pkg = JSON.parse(readFileSync(path, "utf8")) as { dependencies: Record<string, string> };
        pkg.dependencies["left-pad"] = "^1.3.0";
        writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
        changed.push("package.json");
      }
      return {
        ok: true,
        summary: id,
        changedFiles: changed,
        evidenceRefs: [],
        ...(opts.egress?.includes(id) ? { egress: [{ host: "exfil.example", allowed: false, count: 2 }] } : {}),
      };
    },
  };
}

async function start(repo: string, text: string, deps: EngineDeps): Promise<{ engine: Engine; runId: string }> {
  const engine = new Engine({
    repoPath: repo,
    deps: { makeHarness: (p) => new GitHarness(p), scaffolder: plain, defaultPacks: [], ...deps },
  });
  await engine.init("new");
  const { runId } = await engine.run({ projectName: "Risk", text });
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  return { engine, runId };
}

// ── 1. A dependency is named, held, then integrated on approval ──
{
  const repo = newRepo("dep");
  const { engine, runId } = await start(repo, "component: calm section\ncomponent: deps section", {
    executor: agent({ addDep: ["deps"] }),
    concurrency: 2,
  });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "risky-op", `a dependency change must gate, got ${gate.kind}`);
  assert.ok(gate.evidenceRefs.some((r) => r.includes("impl:deps: adds dependency left-pad@^1.3.0")), `the gate names the package: ${JSON.stringify(gate.evidenceRefs)}`);

  const graph = await engine.getExecGraph(runId);
  assert.equal(graph.find((n) => n.id === "impl:deps")?.status, "blocked", "the risky node is parked");
  assert.equal(graph.find((n) => n.id === "impl:calm")?.status, "complete", "its safe sibling integrated");
  const branch = `weave/${runId}`;
  assert.doesNotMatch(git(["show", `${branch}:package.json`], repo), /left-pad/, "nothing risky integrated before approval");
  assert.match(git(["branch", "--list", "weave/node/*"], repo), /impl-deps/, "the parked work survives on its branch");

  await engine.resolveGate(gate.id, "approve", "left-pad is fine");
  assert.equal((await engine.listGates())[0]?.kind, "pre-release", "approval resumes the run");
  assert.match(git(["show", `${branch}:package.json`], repo), /left-pad/, "approval integrates the parked change");
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "impl:deps")?.status, "complete");
  const report = await engine.report(runId);
  assert.ok(report.nodeFailures.some((f) => f.nodeId === "impl:deps" && /adds dependency left-pad/.test(f.detail)), "the finding is on the record");
  rmSync(repo, { recursive: true, force: true });
}

// ── 2 + 3. A cosmetic diff sails through; blocked egress does not ──
{
  const repo = newRepo("egress");
  const { engine, runId } = await start(repo, "component: quiet section\ncomponent: chatty section", {
    executor: agent({ egress: ["chatty"] }),
    concurrency: 2,
  });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "risky-op");
  assert.deepEqual(gate.evidenceRefs, ["impl:chatty: tried to reach hosts off the allowlist: exfil.example"]);
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "impl:quiet")?.status, "complete", "a cosmetic diff is not gated");
  const report = await engine.report(runId);
  assert.ok(report.nodeFailures.some((f) => f.nodeId === "impl:chatty" && /egress: exfil\.example ×2 \(blocked\)/.test(f.detail)), "the network record is evidence");
  rmSync(repo, { recursive: true, force: true });
}

// ── 4. The decision layer adds a gate and writes the corpus; a down provider is recorded ──
{
  const repo = newRepo("judged");
  const judge = new FakeDecision(() => ({ value: "risky", confidence: 0.93 }));
  const { engine, runId } = await start(repo, "component: subtle section", { executor: agent(), riskDecision: judge });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "risky-op", "the decision layer can add a gate a rule did not");
  assert.match(gate.evidenceRefs[0]!, /decision layer judged the change risky at confidence 0\.93/);
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "impl:subtle")?.status, "blocked");

  const corpus = join(repo, ".agent", "evidence", "decisions.jsonl");
  assert.ok(existsSync(corpus), "the verdict lands in the decision corpus");
  const entry = JSON.parse(readFileSync(corpus, "utf8").trim().split("\n").at(-1)!) as Record<string, unknown>;
  assert.equal(entry["name"], "risk.classifyOperation");
  assert.equal(entry["value"], "risky");
  assert.ok((entry["state"] as { changes: unknown[] }).changes.length > 0, "the corpus keeps the state needed for replay");
  rmSync(repo, { recursive: true, force: true });

  const repo2 = newRepo("down");
  const down: Decision = {
    async decide() {
      throw new Error("ANTHROPIC_API_KEY is not set");
    },
  };
  const second = await start(repo2, "component: plain section", { executor: agent(), riskDecision: down });
  assert.equal((await second.engine.listGates())[0]?.kind, "pre-release", "a provider outage never blocks the run");
  const rows = new GraphStore(join(repo2, ".agent", "state.db")).evidenceFor({ runId: second.runId });
  assert.ok(rows.some((r) => r.kind === "risk" && /decision layer unavailable: ANTHROPIC_API_KEY is not set/.test(r.detail)), "but the outage is on the record");
  rmSync(repo2, { recursive: true, force: true });
}

// ── 5. Rejecting discards the parked work ─────────────────────
{
  const repo = newRepo("reject");
  const { engine, runId } = await start(repo, "component: deps section", { executor: agent({ addDep: ["deps"] }) });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "risky-op");
  await engine.resolveGate(gate.id, "reject", "no new dependencies");
  assert.equal((await engine.getRun(runId))?.status, "failed");
  assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], repo), "main", "the user is back on their branch");
  assert.equal(git(["branch", "--list", "weave/node/*"], repo), "", "the parked branch is gone");
  rmSync(repo, { recursive: true, force: true });
}

console.log("risky-op check passed (dependency named + held + integrated on approval, egress gated, decision layer adds gates and fills the corpus)");
