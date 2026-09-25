// ponytail: end-to-end orchestration check (Phase 6/7) on a REAL git repo with a fake
// executor — proves run → design gate → resume → fan-out impl (incl. a repair loop) →
// pre-release gate → done, all persisted + resumable. No Claude/network.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import { GitHarness } from "./runtime.js";
import type { Verifier } from "./loop.js";

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

// Real repo the engine will operate on.
const repo = mkdtempSync(join(tmpdir(), "weave-orch-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# temp\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

// Fake executor: writes <designId>.html; fails the FIRST attempt for "nav" to exercise repair.
const failedOnce = new Set<string>();
class SiteExecutor implements NodeExecutor {
  readonly name = "fake-site";
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
    if (id === "nav" && !failedOnce.has(id)) {
      failedOnce.add(id);
      return { ok: true, summary: "first attempt (no file)", changedFiles: [], evidenceRefs: [`try:${id}`] };
    }
    const file = `${id}.html`;
    writeFileSync(join(input.worktreeDir, file), `<!-- ${id} -->\n`);
    return { ok: true, summary: `wrote ${file}`, changedFiles: [file], evidenceRefs: [`edit:${file}`] };
  }
}
// Verifier (deterministic): the node must have produced an uncommitted change in its worktree.
const verifier: Verifier = {
  async verify(dir: string) {
    const ok = git(["status", "--porcelain"], dir).length > 0;
    return { ok, evidence: [{ kind: "structural" as const, ok, detail: `worktree changed=${ok}` }] };
  },
};

const engine = new Engine({
  repoPath: repo,
  deps: { executor: new SiteExecutor(), verifier, makeHarness: (p) => new GitHarness(p), defaultPacks: [] },
});
await engine.init("new");

// run() → design-approval gate.
const handle = await engine.run({
  projectName: "landing",
  text: "page: home /\ncomponent: hero section\ncomponent: nav nav",
});
assert.equal(handle.status, "gated");
let gates = await engine.listGates();
assert.equal(gates.length, 1);
assert.equal(gates[0]!.kind, "design-approval");

// approve design → executes fan-out (hero + nav, nav repairs once) → pre-release gate.
await engine.resolveGate(gates[0]!.id, "approve");
const exec = await engine.getExecGraph(handle.runId);
const impls = exec.filter((n) => n.kind === "impl");
assert.equal(impls.length, 3); // home (page) + hero + nav
assert.ok(impls.every((n) => n.status === "complete" && n.commit));

gates = await engine.listGates();
assert.equal(gates.length, 1);
assert.equal(gates[0]!.kind, "pre-release");

// artifacts are on the working branch.
assert.ok(existsSync(join(repo, "hero.html")));
assert.ok(existsSync(join(repo, "nav.html")));
assert.ok(failedOnce.has("nav")); // repair loop happened

// approve pre-release → run done.
await engine.resolveGate(gates[0]!.id, "approve");
assert.equal((await engine.getRun(handle.runId))?.status, "done");
assert.equal((await engine.listGates()).length, 0);

// persisted + resumable: a FRESH engine reads the finished state.
const fresh = new Engine({ repoPath: repo });
const st = await fresh.status();
assert.equal(st.initialized, true);
assert.equal(st.latestRun?.status, "done");

rmSync(repo, { recursive: true, force: true });
console.log("orchestrator (run→gates→fanout→repair→done) check passed");
