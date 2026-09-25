// ponytail: parallel halt cleanup + resume. A node fails mid-batch → gate; the batch must
// leave NO dangling worktrees, reset unfinished nodes, and resume cleanly to completion.

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

const repo = mkdtempSync(join(tmpdir(), "weave-parres-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

let bBroken = true; // "b" produces no change until fixed → verification fails
const executor: NodeExecutor = {
  name: "w",
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
    if (id === "b" && bBroken) return { ok: true, summary: "b broken", changedFiles: [], evidenceRefs: [] };
    writeFileSync(join(input.worktreeDir, `${id}.txt`), id);
    return { ok: true, summary: id, changedFiles: [`${id}.txt`], evidenceRefs: [] };
  },
};
const verifier: Verifier = {
  async verify(dir) {
    return { ok: git(["status", "--porcelain"], dir).length > 0, evidence: [] };
  },
};

const engine = new Engine({
  repoPath: repo,
  deps: { executor, verifier, makeHarness: (p) => new GitHarness(p), defaultPacks: [], concurrency: 3 },
});
await engine.init("new");
const h = await engine.run({ text: "component: a section\ncomponent: b section\ncomponent: c section" });

let gates = await engine.listGates();
await engine.resolveGate(gates[0]!.id, "approve"); // parallel batch → b escalates → halt

// Halted cleanly: gated, NO dangling worktrees, ≥1 integrated, unfinished reset to pending.
assert.equal((await engine.getRun(h.runId))?.status, "gated");
gates = await engine.listGates();
assert.equal(gates[0]!.kind, "low-confidence");
assert.equal(git(["worktree", "list"], repo).split("\n").filter(Boolean).length, 1, "no dangling worktrees");
const impls1 = (await engine.getExecGraph(h.runId)).filter((n) => n.kind === "impl");
assert.ok(impls1.some((n) => n.status === "complete"), "≥1 node integrated before halt");
assert.ok(impls1.some((n) => n.status === "pending"), "unfinished nodes reset to pending");

// Resume: fix b, approve → re-run pending → complete → pre-release → done.
bBroken = false;
await engine.resolveGate(gates[0]!.id, "approve");
const impls2 = (await engine.getExecGraph(h.runId)).filter((n) => n.kind === "impl");
assert.ok(impls2.every((n) => n.status === "complete" && n.commit), "all impls complete after resume");
gates = await engine.listGates();
assert.equal(gates[0]!.kind, "pre-release");
await engine.resolveGate(gates[0]!.id, "approve");
assert.equal((await engine.getRun(h.runId))?.status, "done");
const wb = `weave/${h.runId}`;
const files = git(["ls-tree", "-r", "--name-only", wb], repo).split("\n").filter((f) => f.endsWith(".txt")).sort();
assert.deepEqual(files, ["a.txt", "b.txt", "c.txt"]);

rmSync(repo, { recursive: true, force: true });
console.log("parallel halt cleanup + resume check passed");
