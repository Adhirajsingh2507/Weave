// ponytail: cross-process resume. Each Engine instance stands in for one CLI invocation
// (`weave run`, then `weave approve <id>`), which is how the documented flow actually works.
//
// Regression: harness state used to live only in memory, so the process that approved the
// pre-release gate had no harness to finish. The user was left on the weave branch with their
// uncommitted work sitting in a stash.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Verifier } from "./loop.js";

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-resume-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# base\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

const executor: NodeExecutor = {
  name: "fake",
  async run(input: ExecInput): Promise<ExecResult> {
    return realise(input);
  },
};
const verifier: Verifier = {
  async verify(dir: string) {
    return { ok: git(["status", "--porcelain"], dir).length > 0, evidence: [] };
  },
};
// A fresh Engine per step — no shared in-memory harness, exactly like separate CLI runs.
const engine = (): Engine =>
  new Engine({ repoPath: repo, deps: { executor, verifier, makeHarness: (p) => new GitHarness(p), defaultPacks: [] } });

await engine().init("new");

// The user has uncommitted work when the run starts.
writeFileSync(join(repo, "README.md"), "# base\nwork in progress\n");

const handle = await engine().run({ text: "component: hero section" });
assert.equal(handle.status, "gated");

// Process 2: approve the design gate. Cuts the working branch and auto-stashes.
const designGate = (await engine().listGates())[0]!;
assert.equal(designGate.kind, "design-approval");
await engine().resolveGate(designGate.id, "approve", "keep the hero copy short");
const mid = await engine().getRun(handle.runId);
assert.equal(mid?.workingBranch, `weave/${handle.runId}`, "working branch persisted");
assert.equal(mid?.baseBranch, "main", "base branch persisted");
assert.equal(mid?.stashed, true, "auto-stash recorded");

// Notes are recorded, not discarded — the next attempt's context pack reads them.
const resolved = await engine().getGate(designGate.id);
assert.equal(resolved?.notes, "keep the hero copy short", "gate notes persisted");
assert.ok(resolved?.resolvedAt, "resolution timestamped");

// Process 3: approve pre-release. This process never created a harness.
const releaseGate = (await engine().listGates())[0]!;
assert.equal(releaseGate.kind, "pre-release");
await engine().resolveGate(releaseGate.id, "approve");

const done = await engine().getRun(handle.runId);
assert.equal(done?.status, "done");
assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], repo), "main", "user is back on their branch");
assert.equal(git(["stash", "list"], repo), "", "auto-stash was popped, not stranded");
assert.match(readFileSync(join(repo, "README.md"), "utf8"), /work in progress/, "uncommitted work restored");
assert.equal(done?.stashed, false, "nothing left to restore");

// The build still happened: the impl commit is on the working branch.
const built = git(["ls-tree", "-r", "--name-only", `weave/${handle.runId}`], repo);
assert.match(built, /sections\/hero\.html/, "node work committed to the working branch");

rmSync(repo, { recursive: true, force: true });

// ── A process that dies mid-build: the run is still "running", with no gate to resolve. ──
// A later process resumes it: finished nodes are kept, the one in flight starts again clean.
{
  const repo2 = mkdtempSync(join(tmpdir(), "weave-resume-dead-"));
  for (const a of [["init", "-q"], ["symbolic-ref", "HEAD", "refs/heads/main"], ["config", "user.email", "t@weave.local"], ["config", "user.name", "Weave Test"]]) git(a, repo2);
  writeFileSync(join(repo2, "README.md"), "# base\n");
  git(["add", "-A"], repo2);
  git(["commit", "-q", "-m", "init"], repo2);
  let die = true;
  const flaky: NodeExecutor = {
    name: "fake",
    async run(input: ExecInput): Promise<ExecResult> {
      if (die && input.contextPack.taskId === "impl:cta") throw new Error("the process was killed");
      return realise(input);
    },
  };
  const proc = (): Engine => new Engine({ repoPath: repo2, deps: { executor: flaky, makeHarness: (p) => new GitHarness(p), defaultPacks: [] } });
  await proc().init("new");
  const h = await proc().run({ text: "page: home /\ncomponent: hero section\ncomponent: cta section" });
  await assert.rejects(proc().resolveGate((await proc().listGates())[0]!.id, "approve"), /killed/);
  assert.equal((await proc().getRun(h.runId))?.status, "running", "the dead process left the run running");
  assert.equal((await proc().listGates()).length, 0, "with no gate to resume from");

  die = false;
  const resumed = await proc().resume(h.runId);
  assert.equal(resumed.status, "gated");
  assert.equal((await proc().listGates())[0]?.kind, "pre-release");
  const nodes = await proc().getExecGraph(h.runId);
  for (const id of ["impl:hero", "impl:cta", "impl:home"]) assert.equal(nodes.find((n) => n.id === id)?.status, "complete", id);
  assert.equal(git(["worktree", "list"], repo2).split("\n").length, 1, "no stale worktrees left");
  rmSync(repo2, { recursive: true, force: true });
}
console.log("cross-process resume (branch + stash restored by a later process) check passed");
