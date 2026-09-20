// ponytail: gated deployment — approving pre-release runs the RELEASE node via a deployer.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { GitHarness } from "./runtime.js";
import { FakeDeployer } from "./deploy.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Verifier } from "./loop.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-deploy-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

const executor: NodeExecutor = {
  name: "w",
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
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
  deps: {
    executor,
    verifier,
    makeHarness: (p) => new GitHarness(p),
    deployer: new FakeDeployer("https://weave.example/deploy-123"),
  },
});
let deployUrl: unknown;
engine.events.subscribe((e) => {
  if (e.type === "deployment.completed") deployUrl = e.data?.["url"];
});

await engine.init("new");
const h = await engine.run({ text: "component: hero section" });

let gates = await engine.listGates();
await engine.resolveGate(gates[0]!.id, "approve"); // design → execute → pre-release
gates = await engine.listGates();
assert.equal(gates[0]!.kind, "pre-release");

await engine.resolveGate(gates[0]!.id, "approve"); // triggers deploy
const rel = (await engine.getExecGraph(h.runId)).find((n) => n.kind === "release");
assert.equal(rel?.status, "complete", "release node deployed");
assert.equal((await engine.getRun(h.runId))?.status, "done");
assert.equal(deployUrl, "https://weave.example/deploy-123");

rmSync(repo, { recursive: true, force: true });
console.log("deploy (gated release) check passed");
