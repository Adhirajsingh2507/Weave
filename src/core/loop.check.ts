// ponytail: end-to-end check of the node loop over the REAL GitHarness, using a fake
// executor (stands in for ClaudeCodeExecutor) in a throwaway git repo. Part of `pnpm check`.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GitHarness } from "./runtime.js";
import type { ContextPack, ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import { runNode } from "./loop.js";
import type { VerifyResult } from "./loop.js";
import type { Verifier } from "./loop.js";

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

// Throwaway git repo with one commit on main.
const repo = mkdtempSync(join(tmpdir(), "weave-loop-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "test@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# temp\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

const harness = new GitHarness(repo);
await harness.createWorkingBranch("weave/run-1");

function ctx(goal: string): ContextPack {
  return {
    taskId: "t",
    goal,
    relevantNodeIds: [],
    relevantFiles: [],
    constraints: [],
    previousFailures: [],
    permissions: { write: ["**"], deny: [".env"] },
  };
}

// Fake executor that writes a file into the worktree (stands in for Claude Code).
class WritingExecutor implements NodeExecutor {
  readonly name = "fake-writer";
  #file: string;
  #content: string;
  constructor(file: string, content: string) {
    this.#file = file;
    this.#content = content;
  }
  async run(input: ExecInput): Promise<ExecResult> {
    writeFileSync(join(input.worktreeDir, this.#file), this.#content);
    return { ok: true, summary: `wrote ${this.#file}`, changedFiles: [this.#file], evidenceRefs: [`edit:${this.#file}`] };
  }
}

const fileExists = (name: string): Verifier => ({
  async verify(dir: string): Promise<VerifyResult> {
    const ok = existsSync(join(dir, name));
    return { ok, evidence: [{ kind: "structural", ok, detail: `${name}=${ok}` }] };
  },
});

// SUCCESS: write hero.tsx, verifier passes → commit + fast-forward onto the working branch.
const okRes = await runNode({
  harness,
  executor: new WritingExecutor("hero.tsx", "export const Hero = () => null;\n"),
  verifier: fileExists("hero.tsx"),
  node: { id: "impl:hero", contextPack: ctx("build hero") },
});
assert.equal(okRes.status, "complete");
assert.ok(okRes.commit && okRes.commit.length >= 7);
assert.ok(existsSync(join(repo, "hero.tsx"))); // present on the working branch
assert.ok(okRes.evidence.some((e) => e.detail === "edit:hero.tsx"), "agent evidence kept");

const commitsAfterSuccess = git(["rev-list", "--count", "HEAD"], repo);

// FAILURE: verifier always fails → retries then escalate; no new commit; worktree discarded.
const badRes = await runNode({
  harness,
  executor: new WritingExecutor("nav.tsx", "x"),
  verifier: { async verify() { return { ok: false, evidence: [{ kind: "structural" as const, ok: false, detail: "forced fail" }] }; } },
  node: { id: "impl:nav", contextPack: ctx("build nav") },
  retryCap: 3,
});
assert.equal(badRes.status, "escalated");
assert.equal(badRes.attempts, 3);
assert.equal(git(["rev-list", "--count", "HEAD"], repo), commitsAfterSuccess); // unchanged
assert.ok(!existsSync(join(repo, "nav.tsx"))); // discarded with the worktree

// Only the main worktree remains.
assert.equal(git(["worktree", "list"], repo).split("\n").filter(Boolean).length, 1);

await harness.finish();

// Idempotent createWorkingBranch: a fresh harness (e.g. a new process) re-attaches to the
// existing working branch instead of failing — backs cross-process resume.
const harness2 = new GitHarness(repo);
await harness2.createWorkingBranch("weave/run-1");
assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], repo), "weave/run-1");
await harness2.finish();

rmSync(repo, { recursive: true, force: true });
console.log("node loop + git harness check passed");
