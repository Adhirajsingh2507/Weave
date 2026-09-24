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
// This one also switches style, which a per-engine style cache would get wrong.
const second = await engine().run({
  projectName: "Robotics",
  text: "style: brutalism\npage: home /\ncomponent: hero section\ncomponent: features section",
});
const replanned = (await engine().getExecGraph(second.runId)).filter((n) => n.kind === "impl");
assert.equal(replanned.length, 0, "a re-run of the same components should have no work left to plan");

// Run 1's pre-release gate is still open, so pick this run's gate rather than the first.
const secondGate = (await engine().listGates()).find(
  (g) => g.runId === second.runId && g.kind === "design-approval",
)!;
assert.ok(secondGate, "second run should have its own design gate");
await engine().resolveGate(secondGate.id, "approve");
const restyled = readFileSync(join(repo, "styles", "tokens.css"), "utf8");
assert.match(restyled, /Brutalism/, "second run should re-generate tokens for its own style");
assert.doesNotMatch(restyled, /Swiss Design/, "stale style cache leaked the first run's guide");
assert.match(
  readFileSync(join(repo, "package.json"), "utf8"),
  /"name": "robotics"/,
  "the scaffolded project should survive the second run untouched",
);

// An unknown style must fail at intake, not half way through a run.
await assert.rejects(
  () => engine().run({ text: "style: not-a-real-style\ncomponent: hero section" }),
  /unknown style 'not-a-real-style'/,
  "a typo in the brief should fail fast",
);

rmSync(repo, { recursive: true, force: true });

// Modify-existing mode: the scaffolder must not clobber a real project.
const existing = mkdtempSync(join(tmpdir(), "weave-existing-"));
const pkg = `{ "name": "theirs", "scripts": { "build": "their-build" } }\n`;
writeFileSync(join(existing, "package.json"), pkg);
writeFileSync(join(existing, "index.html"), "<!doctype html><title>theirs</title>\n");
writeFileSync(join(existing, ".gitignore"), "their-ignores/\n");

const { TemplateScaffolder } = await import("./scaffold.js");
const { loadStyle } = await import("./design/style.js");
const res = await new TemplateScaffolder().scaffold({
  repoPath: existing,
  projectName: "Theirs",
  style: loadStyle("brutalism"),
});

assert.equal(readFileSync(join(existing, "package.json"), "utf8"), pkg, "package.json was overwritten");
assert.match(readFileSync(join(existing, "index.html"), "utf8"), /theirs/, "index.html was overwritten");
assert.equal(readFileSync(join(existing, ".gitignore"), "utf8"), "their-ignores/\n", ".gitignore was overwritten");
assert.ok(existsSync(join(existing, "styles", "tokens.css")), "tokens.css should still be written");
assert.match(res.summary, /existing project kept/, "summary should say the project was left alone");
assert.ok(!existsSync(join(existing, "scripts", "build.mjs")), "no template scripts in an existing project");

rmSync(existing, { recursive: true, force: true });
console.log("greenfield build (scaffold + real verifier + design→code edges) check passed");
