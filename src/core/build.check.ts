// ponytail: greenfield end-to-end with the REAL scaffolder and the REAL deterministic
// verifier — only the agent is faked.
//
// Two regressions guarded here:
//   - greenfield was unbuildable: an empty repo has no package.json, so `pnpm build`
//     failed in every worktree and nodes burned their retries on nothing.
//   - the graph never learned: no design→code edges were written on commit, so gaps
//     stayed full and a re-run re-planned work that was already done.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { GitHarness } from "./runtime.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-build-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# greenfield\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

/** Stands in for the coding agent: fills its section in the scaffolded page. */
const agent: NodeExecutor = {
  name: "fake-agent",
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
    const page = join(input.worktreeDir, "index.html");
    const html = readFileSync(page, "utf8");
    const filled = html.replace(
      new RegExp(`<section id="${id}"[^>]*>.*?</section>`, "s"),
      `<section id="${id}" data-design-node="${id}"><h2>${id}</h2><p>Built by ${input.contextPack.taskId}.</p></section>`,
    );
    writeFileSync(page, filled, "utf8");
    return { ok: true, summary: `filled ${id}`, changedFiles: ["index.html"], evidenceRefs: [`edit:${id}`] };
  },
};

// Real scaffolder, real DeterministicVerifier (pnpm build + pnpm check on the template).
const engine = (): Engine =>
  new Engine({ repoPath: repo, deps: { executor: agent, makeHarness: (p) => new GitHarness(p) } });

await engine().init("new");
const handle = await engine().run({
  projectName: "Robotics",
  text: "style: swiss-design\npage: home /\ncomponent: hero section\ncomponent: features section",
});

const designGate = (await engine().listGates())[0]!;
await engine().resolveGate(designGate.id, "approve");

// The scaffold ran before any agent and is committed.
const graph = await engine().getExecGraph(handle.runId);
const scaffold = graph.find((n) => n.kind === "scaffold");
assert.equal(scaffold?.status, "complete", "scaffold node completed");
assert.ok(scaffold?.commit, "scaffold work was committed");
assert.ok(existsSync(join(repo, "package.json")), "project exists in the working tree");

// Style tokens reached the project, generated from the guide rather than invented.
const tokens = readFileSync(join(repo, "styles", "tokens.css"), "utf8");
assert.match(tokens, /Swiss Design/, "tokens.css generated from the chosen guide");
assert.match(tokens, /--colors-palette-accent: #E3000F;/, "guide palette became CSS variables");

// Every impl node passed the REAL verifier, which only works because the scaffold exists.
const impls = graph.filter((n) => n.kind === "impl");
assert.ok(impls.length >= 3, `expected page + components, got ${impls.length}`);
for (const node of impls) {
  assert.equal(node.status, "complete", `${node.id} did not complete`);
  assert.ok(node.commit, `${node.id} has no commit`);
  assert.ok(node.evidence?.length, `${node.id} kept no evidence`);
  assert.equal(node.attempts, 1, `${node.id} should pass first time`);
}

// The graph learned: design nodes are now realized by real files.
const mappings = await engine().mappings({ provenance: "by_construction" });
assert.ok(mappings.length > 0, "no by-construction mapping edges were written");
const gaps = await engine().gaps();
assert.deepEqual(gaps.unrealizedDesign, [], "design nodes should no longer be unrealized");

// Which means a second run plans nothing — the point of having a graph at all.
const second = await engine().run({
  projectName: "Robotics",
  text: "style: swiss-design\npage: home /\ncomponent: hero section\ncomponent: features section",
});
const replanned = (await engine().getExecGraph(second.runId)).filter((n) => n.kind === "impl");
assert.equal(replanned.length, 0, "an identical re-run should have no work left to plan");

rmSync(repo, { recursive: true, force: true });
console.log("greenfield build (scaffold + real verifier + design→code edges) check passed");
