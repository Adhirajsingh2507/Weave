// ponytail: V2.7 — visual QA of placement on the hybrid path (decision #16), wired to the browser
// worker and the asset criteria. A fake browser writes a real PNG and the vision reading is
// recorded, so the verdicts are deterministic:
//   1. a visible asset passes, with the screenshot as its evidence;
//   2. an asset the render does not show fails — markup that references a file proves nothing;
//   3. with no vision extractor the verdict is unavailable, never a pass;
//   4. where Chrome is installed, the real ChromeBrowserWorker renders the built page.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { measureAsset } from "./assets.js";
import { ChromeBrowserWorker } from "./browser.js";
import type { BrowserWorker } from "./browser.js";
import { FakeDecision } from "./decision/providers.js";
import { realise, tinyGlb, tinyPng } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { EngineDeps } from "./api.js";
import type { VisionExtractor } from "./visual.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const captured: string[] = [];
const fakeBrowser: BrowserWorker = {
  async capture(url, opts) {
    captured.push(url);
    if (opts?.screenshotPath) writeFileSync(opts.screenshotPath, tinyPng(1280, 800));
    return { ok: true, consoleErrors: [], consoleCaptured: false, ...(opts?.screenshotPath ? { screenshotPath: opts.screenshotPath } : {}) };
  },
};
// A recorded reading of the rendered page.
const reading: VisionExtractor = {
  async extract() {
    return {
      regions: [{ name: "hero", contents: ["headline", "3D render of a humanoid robot"] }],
      media: [{ description: "humanoid robot", kind: "3D render", region: "hero", widthPct: 40 }],
      problems: [],
    };
  },
};

async function run(tag: string, deps: EngineDeps): Promise<{ engine: Engine; runId: string; repo: string }> {
  const repo = mkdtempSync(join(tmpdir(), `weave-visual-${tag}-`));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);
  const design = mkdtempSync(join(tmpdir(), `weave-visual-src-${tag}-`));
  writeFileSync(join(design, "robot.glb"), tinyGlb(500));
  const engine = new Engine({
    repoPath: repo,
    deps: {
      executor: { name: "r", run: async (input) => realise(input) },
      makeHarness: (p) => new GitHarness(p),
      assetFolders: [design],
      defaultPacks: [],
      ...deps,
    },
  });
  await engine.init("new");
  const { runId } = await engine.run({ projectName: "Visual", text: "page: home /\ncomponent: hero section\nasset: robot 3d robot.glb in:hero" });
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  return { engine, runId, repo };
}

const visible = async (engine: Engine, runId: string) =>
  (await engine.report(runId)).requirements.flatMap((r) => r.criteria).find((c) => c.id === "crit:robot.asset-visible")!;

// ── 1. Seen in the render → passed, with the screenshot ──
{
  const { engine, runId, repo } = await run("pass", {
    browser: fakeBrowser,
    visionExtractor: reading,
    qaDecision: new FakeDecision(() => ({ value: "pass", confidence: 0.94 })),
  });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "pre-release");
  assert.match(gate.summary, /1 page\(s\) rendered; visual QA 1\/1 asset\(s\) visible/);
  const c = await visible(engine, runId);
  assert.equal(c.status, "passed");
  assert.ok(c.evidence.at(-1)!.artifactPath && existsSync(c.evidence.at(-1)!.artifactPath!), "the screenshot is the evidence");
  assert.match(c.evidence.at(-1)!.detail, /index\.html: judged pass at confidence 0\.94 \(accept\)/);
  assert.ok(captured.some((u) => /^http:\/\/127\.0\.0\.1:\d+\/$/.test(u)), "the built site was served and rendered");
  const report = await engine.report(runId);
  assert.ok(report.nodes.find((n) => n.id === "browser-qa")?.status === "complete");
  rmSync(repo, { recursive: true, force: true });
}

// ── 2. Referenced but not seen → failed ──
{
  const { engine, runId, repo } = await run("fail", {
    browser: fakeBrowser,
    visionExtractor: reading,
    qaDecision: new FakeDecision(() => ({ value: "fail", confidence: 0.9 })),
  });
  const c = await visible(engine, runId);
  assert.equal(c.status, "failed", "markup that references the model proves nothing about the render");
  const placed = (await engine.report(runId)).requirements.flatMap((r) => r.criteria).find((x) => x.id === "crit:robot.asset-present")!;
  assert.equal(placed.status, "passed", "while placement itself still passes — two different facts");
  rmSync(repo, { recursive: true, force: true });
}

// ── 3. No extractor → unavailable, never passed ──
{
  const { engine, runId, repo } = await run("none", { browser: fakeBrowser });
  const c = await visible(engine, runId);
  assert.equal(c.status, "unavailable");
  assert.match(c.evidence.at(-1)!.detail, /no vision extractor/);
  assert.match((await engine.listGates())[0]!.summary, /visual QA unavailable/);
  rmSync(repo, { recursive: true, force: true });
}

// ── 4. The real browser, where there is one ──
if (ChromeBrowserWorker.find()) {
  const { engine, runId, repo } = await run("chrome", { browser: new ChromeBrowserWorker({ width: 1024, height: 768 }) });
  const report = await engine.report(runId);
  assert.equal(report.nodes.find((n) => n.id === "browser-qa")!.status, "complete");
  const shot = join(repo, ".agent", "evidence", "screens", `${runId}-index.html.png`);
  // Chrome keeps its own sandbox on; where the machine forbids it (CI containers often restrict
  // user namespaces) the render fails, and that is reported — the worker never drops the sandbox.
  const failure = report.nodeFailures.find((f) => f.nodeId === "browser-qa");
  if (existsSync(shot)) {
    assert.deepEqual(measureAsset(shot).dims, [1024, 768], "at the requested size");
    console.log("visual placement check passed (visible → passed with screenshot, unseen → failed, no extractor → unavailable; real Chrome render verified)");
  } else {
    assert.ok(failure, "a render that produced nothing must be on the record");
    assert.notEqual(process.env["WEAVE_REQUIRE_TOOLS"], "1", `real render required here: ${failure!.detail.slice(0, 160)}`);
    console.log(`visual placement check passed — real Chrome render NOT verified here: ${failure!.detail.slice(0, 160)}`);
  }
  rmSync(repo, { recursive: true, force: true });
} else {
  assert.notEqual(process.env["WEAVE_REQUIRE_TOOLS"], "1", "real render required here, but no Chrome was found");
  console.log("visual placement check passed (visible → passed with screenshot, unseen → failed, no extractor → unavailable; no Chrome here, real render NOT verified)");
}
