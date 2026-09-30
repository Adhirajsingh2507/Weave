// ponytail: V2.7 — assets are acquired, measured and budgeted by the engine; agents only place
// them. Real files throughout: a glTF binary and a PNG built to spec, an SVG with fat in it.
//   1. measurement is exact and dependency-free; the SVG minifier only removes what is safe;
//   2. no agent is ever asked to build an asset; the placing component is told what to place,
//      fails verification (with the reason) when it forgets, and the placement is on the record;
//   3. an over-budget asset opens a gate naming the measured numbers; approving waives it;
//   4. a missing asset opens a gate; supplying the file and approving re-checks it.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { budgetFor, measureAsset, overBudget, svgMinifier } from "./assets.js";
import { realise, tinyGlb, tinyPng } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { EngineDeps } from "./api.js";
import type { ExecInput, NodeExecutor } from "./runtime.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const SVG = `<?xml version="1.0"?>\n<!-- exported by a design tool -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32">\n  <metadata>tool noise</metadata>\n  <rect width="64" height="32" fill="#3DE1FF"/>\n</svg>\n`;

// ── 1. Measurement ────────────────────────────────────────────
{
  const dir = mkdtempSync(join(tmpdir(), "weave-measure-"));
  writeFileSync(join(dir, "robot.glb"), tinyGlb(1200));
  writeFileSync(join(dir, "hero.png"), tinyPng(1920, 1080));
  writeFileSync(join(dir, "logo.svg"), SVG);
  const glb = measureAsset(join(dir, "robot.glb"));
  assert.deepEqual([glb.triangles, glb.vertices, glb.meshes, glb.format], [1200, 3600, 1, "glb"], "glTF geometry read from the file");
  assert.deepEqual(measureAsset(join(dir, "hero.png")).dims, [1920, 1080], "PNG dimensions read from the header");
  assert.deepEqual(measureAsset(join(dir, "logo.svg")).dims, [64, 32], "SVG size from its viewBox");
  assert.deepEqual(overBudget(glb, budgetFor({ type: "3d" })), [], "within the default 3D budget");
  assert.deepEqual(overBudget(glb, budgetFor({ type: "3d", budgetTriangles: 1000 })), ["1,200 triangles exceed the 1,000 budget"]);
  assert.deepEqual(overBudget(measureAsset(join(dir, "hero.png")), budgetFor({ type: "logo" })), ["1920×1080 px exceeds the 1024 px limit"]);
  assert.throws(() => measureAsset((writeFileSync(join(dir, "fake.glb"), "not a model"), join(dir, "fake.glb"))), /not a glTF binary/);

  const r = await svgMinifier.optimize(join(dir, "logo.svg"));
  const min = readFileSync(join(dir, "logo.svg"), "utf8");
  assert.ok(r.changed && !/<!--|<metadata|<\?xml/.test(min), "comments, metadata and the prolog go");
  assert.match(min, /<rect width="64" height="32" fill="#3DE1FF"\/>/, "the drawing stays");
  rmSync(dir, { recursive: true, force: true });
}

function newRepo(tag: string): { repo: string; design: string } {
  const repo = mkdtempSync(join(tmpdir(), `weave-assets-${tag}-`));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);
  // The designer's asset folder, outside the project.
  const design = mkdtempSync(join(tmpdir(), `weave-assets-src-${tag}-`));
  writeFileSync(join(design, "robot.glb"), tinyGlb(1200));
  writeFileSync(join(design, "logo.svg"), SVG);
  return { repo, design };
}

const tasks: string[] = [];
const constraintsSeen = new Map<string, string[]>();
let heroForgot = true;
const agent: NodeExecutor = {
  name: "placer",
  async run(input: ExecInput) {
    tasks.push(input.contextPack.taskId);
    constraintsSeen.set(input.contextPack.taskId, input.contextPack.constraints);
    if (input.contextPack.taskId === "impl:hero") {
      // First try forgets the robot; the verifier must say so, and the retry places it.
      if (heroForgot) {
        heroForgot = false;
        return realise(input, "<h2>Meet Atlas</h2>");
      }
      // Places exactly what its brief says to place.
      const told = input.contextPack.constraints.find((c) => c.startsWith("Place these assets")) ?? "";
      const paths = [...new Set(told.match(/assets\/[\w.-]+/g) ?? [])];
      return realise(input, `<h2>Meet Atlas</h2>${paths.map((p) => `<model-viewer src="${p}" alt="Atlas"></model-viewer>`).join("")}`);
    }
    return realise(input);
  },
};

async function start(repo: string, design: string, text: string, extra: EngineDeps = {}): Promise<{ engine: Engine; runId: string }> {
  const engine = new Engine({
    repoPath: repo,
    deps: { executor: agent, makeHarness: (p) => new GitHarness(p), assetFolders: [design], concurrency: 2, defaultPacks: [], ...extra },
  });
  await engine.init("new");
  const { runId } = await engine.run({ projectName: "Atlas", text });
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  return { engine, runId };
}

// ── 2. Acquired, not built; placed, and checked ───────────────
{
  const { repo, design } = newRepo("flow");
  const { engine, runId } = await start(
    repo,
    design,
    "page: home /\ncomponent: hero section\ncomponent: cta section\nasset: robot 3d robot.glb in:hero\nasset: logo logo logo.svg",
  );
  assert.equal((await engine.listGates())[0]?.kind, "pre-release", "the run reaches release");
  assert.ok(!tasks.some((t) => /robot|logo|asset/.test(t)), `no agent is asked to build an asset: ${tasks.join(", ")}`);

  const graph = await engine.getExecGraph(runId);
  const node = (id: string) => graph.find((n) => n.id === id)!;
  assert.equal(node("asset:robot").kind, "asset");
  assert.equal(node("asset:robot").status, "complete");
  assert.ok(node("impl:hero").dependsOn!.includes("asset:robot"), "the placing section waits for its asset");
  assert.equal(graph.filter((n) => n.kind === "impl").length, 3, "home, hero and cta — assets are not impl work");

  const heroBrief = constraintsSeen.get("impl:hero")!.join("\n");
  assert.match(heroBrief, /Place these assets in this section .*assets\/robot\.glb \(3d, \d+ KB, 1200 triangles\)/, "the placer is told what, and the numbers");
  assert.ok(!constraintsSeen.get("impl:cta")!.join("\n").includes("Place these assets"), "a section that places nothing is not told to");

  assert.ok(existsSync(join(repo, "assets", "robot.glb")) && existsSync(join(repo, "assets", "logo.svg")), "acquired into assets/");
  assert.ok(!readFileSync(join(repo, "assets", "logo.svg"), "utf8").includes("<!--"), "the SVG was optimised on the way in");

  const report = await engine.report(runId);
  const crit = (id: string) => report.requirements.flatMap((r) => r.criteria).find((c) => c.id === id)!;
  assert.equal(crit("crit:robot.asset-budget").status, "passed");
  assert.match(crit("crit:robot.asset-budget").evidence.at(-1)!.detail, /1,200 triangles.*budget 2\.00 MB, 100,000 triangles/);
  assert.equal(crit("crit:robot.asset-present").status, "passed");
  assert.match(crit("crit:robot.asset-present").evidence.at(-1)!.detail, /assets\/robot\.glb is on index\.html in the hero section/);
  assert.ok(
    report.nodeFailures.some((f) => f.nodeId === "impl:hero" && /assets\/robot\.glb was not placed/.test(f.detail)),
    "forgetting to place it failed verification, with the reason",
  );
  assert.equal(crit("crit:logo.asset-present").status, "failed", "an asset nobody used is reported, not hidden");
  assert.equal(crit("crit:robot.asset-visible").status, "unavailable", "visibility needs a render and a vision pass — never a free pass");
  rmSync(repo, { recursive: true, force: true });
  rmSync(design, { recursive: true, force: true });
}

// ── 3. Over budget: the gate names the numbers; approving waives it ──
{
  const { repo, design } = newRepo("budget");
  heroForgot = false;
  const { engine, runId } = await start(repo, design, "page: home /\ncomponent: hero section\nasset: robot 3d robot.glb in:hero tris:1000");
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "policy");
  assert.deepEqual(gate.evidenceRefs, ["asset.robot: assets/robot.glb — 1,200 triangles exceed the 1,000 budget"]);
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "impl:hero")!.status, "pending", "nothing built on an asset under review");
  await engine.resolveGate(gate.id, "approve", "fine for the demo");
  assert.equal((await engine.listGates())[0]?.kind, "pre-release", "the waiver lets the run proceed");
  assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === "asset:robot")!.status, "complete");
  rmSync(repo, { recursive: true, force: true });
  rmSync(design, { recursive: true, force: true });
}

// ── 4. Missing: supply it, approve, and it is re-checked ──────
{
  const { repo, design } = newRepo("missing");
  const { engine, runId } = await start(repo, design, "page: home /\ncomponent: hero section\nasset: poster image poster.png in:hero");
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "policy");
  assert.match(gate.evidenceRefs[0]!, /^asset\.poster: poster\.png not found \(looked in the repo and /);
  mkdirSync(design, { recursive: true });
  writeFileSync(join(design, "poster.png"), tinyPng(1200, 630));
  await engine.resolveGate(gate.id, "approve", "added it");
  assert.equal((await engine.listGates())[0]?.kind, "pre-release");
  const poster = (await engine.getNode("poster"))!.attrs as { dims: [number, number]; from: string };
  assert.deepEqual(poster.dims, [1200, 630], "measured once it arrived");
  assert.equal(poster.from, join(design, "poster.png"), "with its provenance");
  void runId;
  rmSync(repo, { recursive: true, force: true });
  rmSync(design, { recursive: true, force: true });
}

console.log("assets check passed (measured to spec, never built by an agent, placed and checked, over-budget and missing both gate)");
