// D4 — 3D that renders. The engine builds a hero that places the real Go2 (examples/assets), with
// the viewer bundled into vendor/ and the deploy headers in vercel.json; Playwright renders the
// built site under that CSP, served as Vercel would serve it. Proven here:
//   - the scaffold bundles model-viewer and loads it locally; vercel.json reaches dist/;
//   - the render has no console errors under the CSP (no CDN, no refused WebAssembly);
//   - the viewer actually draws the robot: its pixels vary like a model, not like an empty box;
//   - visual QA passes on a recorded reading (a real vision call is run on the owner's machine).

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { measureAsset } from "./assets.js";
import { serve } from "./benchmark.js";
import { PlaywrightBrowserWorker, openPage } from "./browser.js";
import { FakeDecision } from "./decision/providers.js";
import { GitHarness } from "./runtime.js";
import { realise } from "./testing.js";
import { WEAVE_ROOT } from "./tools.js";
import type { VisionExtractor } from "./visual.js";

const GO2 = join(WEAVE_ROOT, "examples", "assets", "go2.glb");
const go2 = measureAsset(GO2);
assert.ok(go2.sizeBytes <= 2 * 1024 * 1024 && go2.triangles! <= 100_000, "the Go2 is within the 3D budget");
assert.ok(existsSync(join(WEAVE_ROOT, "examples", "assets", "go2.CREDITS.md")), "its licence ships beside it");

if (!PlaywrightBrowserWorker.available()) {
  assert.notEqual(process.env["WEAVE_REQUIRE_TOOLS"], "1", "the 3D render needs Playwright here");
  console.log("viewer check passed (Go2 within budget, credited) — render NOT verified here: no Playwright");
} else {
  const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
  const repo = mkdtempSync(join(tmpdir(), "weave-viewer-"));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);

  const reading: VisionExtractor = {
    async extract() {
      return { regions: [{ name: "hero", contents: ["a white quadruped robot dog, rendered in 3D"] }], media: [{ description: "Unitree Go2 robot dog", kind: "3D render", region: "hero", widthPct: 90 }], problems: [] };
    },
  };
  const engine = new Engine({
    repoPath: repo,
    deps: {
      executor: { name: "r", run: async (input) => realise(input) },
      makeHarness: (p) => new GitHarness(p),
      assetFolders: [join(WEAVE_ROOT, "examples", "assets")],
      defaultPacks: [],
      browser: new PlaywrightBrowserWorker(),
      visionExtractor: reading,
      qaDecision: new FakeDecision(() => ({ value: "pass", confidence: 0.95 })),
    },
  });
  await engine.init("new");
  const { runId } = await engine.run({ projectName: "Go2", text: "style: futuristic\npage: home /\ncomponent: hero section\nasset: go2 3d go2.glb in:hero" });
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "pre-release", gate.summary);

  // The scaffold bundled the viewer and the headers; the build carried both into dist/.
  assert.ok(existsSync(join(repo, "vendor", "model-viewer.min.js")));
  assert.match(readFileSync(join(repo, "index.html"), "utf8"), /<script type="module" src="vendor\/model-viewer\.min\.js"><\/script>/);
  assert.ok(existsSync(join(repo, "dist", "vercel.json")), "the deploy config is in what Vercel uploads");
  // No request that can only fail: an explicit (empty) icon, and no dangling source-map reference.
  assert.match(readFileSync(join(repo, "index.html"), "utf8"), /<link rel="icon" href="data:,">/);
  assert.ok(!/sourceMappingURL/.test(readFileSync(join(repo, "vendor", "model-viewer.min.js"), "utf8").slice(-300)));
  assert.match(readFileSync(join(repo, "dist", "vercel.json"), "utf8"), /Content-Security-Policy/);

  // Rendered under the CSP with no console errors.
  const report = await engine.report(runId);
  assert.equal(report.nodes.find((n) => n.id === "browser-qa")!.status, "complete");
  const rendered = report.nodeFailures.filter((f) => f.nodeId === "browser-qa");
  assert.equal(rendered.length, 0, JSON.stringify(rendered));
  const visible = report.requirements.flatMap((r) => r.criteria).find((c) => c.id === "crit:go2.asset-visible")!;
  assert.equal(visible.status, "passed", JSON.stringify(visible.evidence));

  // The viewer drew the robot: the model-viewer box, once loaded, is far from uniform.
  const site = await serve(join(repo, "dist"));
  const { browser, page } = await openPage(1280, 900);
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  try {
    await page.goto(site.url, { waitUntil: "networkidle", timeout: 60_000 });
    const loaded = await page.evaluate<boolean | string>(`new Promise((r) => {
      const mv = document.querySelector("model-viewer");
      if (!mv) return r("no model-viewer");
      mv.scrollIntoView();
      if (mv.loaded) return r(true);
      mv.addEventListener("load", () => r(true));
      mv.addEventListener("error", (e) => r("error: " + JSON.stringify(e.detail)));
      setTimeout(() => r("timeout"), 30000);
    })`);
    assert.equal(loaded, true, String(loaded));
    await new Promise((r) => setTimeout(r, 1500));
    const box = await page.evaluate<{ x: number; y: number; width: number; height: number }>(
      `(() => { const r = document.querySelector("model-viewer").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
    );
    const shot = join(repo, "hero-3d.png");
    await (page as unknown as { screenshot(o: object): Promise<Buffer> }).screenshot({ path: shot, clip: box });
    const sharp = createRequire(join(WEAVE_ROOT, "package.json"))("sharp") as (p: string) => { stats(): Promise<{ channels: Array<{ stdev: number }> }> };
    const { channels } = await sharp(shot).stats();
    const spread = Math.max(...channels.slice(0, 3).map((c) => c.stdev));
    assert.ok(spread > 20, `the viewer box is near-uniform (stdev ${spread.toFixed(1)}): nothing was drawn`);
    assert.deepEqual(errors, [], "no console errors under the CSP");
    console.log(`viewer check passed (Go2 ${Math.round(go2.sizeBytes / 1024)} KB / ${go2.triangles} triangles, bundled viewer, CSP clean, robot drawn — pixel spread ${spread.toFixed(0)}, visual QA passed on a recorded reading)`);
  } finally {
    await browser.close();
    await site.close();
  }
  rmSync(repo, { recursive: true, force: true });
}
