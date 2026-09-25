// ponytail: parallel worktrees — 3 disjoint impl nodes run concurrently and integrate clean.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { GitHarness } from "./runtime.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Verifier } from "./loop.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-par-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

// Each node writes a distinct file → parallel branches merge without conflict.
class Writer implements NodeExecutor {
  readonly name = "w";
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
    writeFileSync(join(input.worktreeDir, `${id}.txt`), id);
    return { ok: true, summary: id, changedFiles: [`${id}.txt`], evidenceRefs: [] };
  }
}
const verifier: Verifier = {
  async verify(dir) {
    return { ok: git(["status", "--porcelain"], dir).length > 0, evidence: [] };
  },
};

const engine = new Engine({
  repoPath: repo,
  deps: { executor: new Writer(), verifier, makeHarness: (p) => new GitHarness(p), defaultPacks: [], concurrency: 3 },
});
await engine.init("new");
const h = await engine.run({ text: "component: a section\ncomponent: b section\ncomponent: c section" });

const gates = await engine.listGates();
await engine.resolveGate(gates[0]!.id, "approve"); // parallel execute + sequential integrate

const impls = (await engine.getExecGraph(h.runId)).filter((n) => n.kind === "impl");
assert.equal(impls.length, 3);
assert.ok(impls.every((n) => n.status === "complete" && n.commit), "all impls complete");

const wb = `weave/${h.runId}`;
const files = git(["ls-tree", "-r", "--name-only", wb], repo).split("\n").filter((f) => f.endsWith(".txt")).sort();
assert.deepEqual(files, ["a.txt", "b.txt", "c.txt"], "all files integrated onto working branch");

const g2 = await engine.listGates();
assert.equal(g2[0]!.kind, "pre-release");
await engine.resolveGate(g2[0]!.id, "approve");
assert.equal((await engine.getRun(h.runId))?.status, "done");

rmSync(repo, { recursive: true, force: true });
console.log("parallel worktrees check passed");
