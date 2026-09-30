// D2 — every demo tool, run for real on a local page and real files: Playwright captures the whole
// page and sees console errors; sharp and gltf-transform shrink real assets; gitleaks finds a
// planted key; axe and Lighthouse score a page. A missing tool prints "NOT verified here" — and
// with WEAVE_REQUIRE_TOOLS=1 (CI) it fails instead, so CI never passes on an unproven machine.

import assert from "node:assert/strict";
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { measureAsset, defaultOptimizers } from "./assets.js";
import { axe, gitleaks, lighthouse, serve } from "./benchmark.js";
import { PlaywrightBrowserWorker } from "./browser.js";
import { tinyGlb } from "./testing.js";
import { createRequire } from "node:module";
import { WEAVE_ROOT } from "./tools.js";

const require = process.env["WEAVE_REQUIRE_TOOLS"] === "1";
const unverified: string[] = [];
const skip = (what: string, why: string): void => {
  if (require) assert.fail(`${what}: ${why} (WEAVE_REQUIRE_TOOLS=1)`);
  unverified.push(`${what} (${why})`);
};

const dir = mkdtempSync(join(tmpdir(), "weave-tools-"));
writeFileSync(
  join(dir, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Tools</title></head>
<body style="margin:0"><main><h1>Tall page</h1><img src="missing.png"><div style="height:3000px;background:#123"></div></main>
<script>console.error("planted console error")</script></body></html>`,
);
const site = await serve(dir);

try {
  // ── Playwright: full-page capture and the console ──────────────
  if (PlaywrightBrowserWorker.available()) {
    const shot = join(dir, "page.png");
    const r = await new PlaywrightBrowserWorker({ width: 800, height: 600 }).capture(site.url, { screenshotPath: shot });
    assert.equal(r.consoleCaptured, true);
    assert.ok(r.consoleErrors.some((e) => /planted console error/.test(e)), JSON.stringify(r.consoleErrors));
    assert.equal(r.ok, false, "a console error fails the render");
    const dims = measureAsset(shot).dims!;
    assert.ok(dims[1] > 3000, `full page captured past the window (${dims[1]}px tall)`);
  } else skip("playwright", "not installed or chromium not downloaded");

  // ── Asset optimisers ────────────────────────────────────────────
  const optimizers = await defaultOptimizers();
  const sharpOpt = optimizers.find((o) => o.name === "sharp");
  if (sharpOpt) {
    const sharp = createRequire(join(WEAVE_ROOT, "package.json"))("sharp") as (o: object) => { png(o: object): { toFile(p: string): Promise<unknown> } };
    const png = join(dir, "photo.png");
    await sharp({ create: { width: 600, height: 400, channels: 3, background: { r: 20, g: 40, b: 60 } } }).png({ compressionLevel: 0 }).toFile(png);
    const before = statSync(png).size;
    assert.equal((await sharpOpt.optimize(png)).changed, true);
    assert.ok(statSync(png).size < before, "sharp shrank the PNG");
    assert.deepEqual(measureAsset(png).dims, [600, 400], "same pixels");
  } else skip("sharp", "not installed");

  const gltfOpt = optimizers.find((o) => o.name === "gltf-transform");
  if (gltfOpt) {
    const glb = join(dir, "robot.glb");
    writeFileSync(glb, tinyGlb(20_000));
    const before = statSync(glb).size;
    const res = await gltfOpt.optimize(glb);
    assert.equal(res.changed, true, res.detail);
    assert.ok(statSync(glb).size < before / 2, `gltf-transform shrank the model (${res.detail})`);
  } else skip("gltf-transform", "not installed");

  // ── Scorers: gitleaks, axe, Lighthouse ──────────────────────────
  if (!(await gitleaks.unavailable())) {
    const leak = mkdtempSync(join(tmpdir(), "weave-leak-"));
    writeFileSync(join(leak, "config.js"), `export const key = "AKIA${"Q".repeat(4)}7Z3N5K2M8P4R";\nexport const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY9";\n`);
    const found = await gitleaks.score({ dir: leak, url: site.url });
    assert.ok(found["gitleaks.findings"]!.value >= 1, "gitleaks found the planted key");
  } else skip("gitleaks", "not installed (pnpm tools:gitleaks)");

  if (!(await axe.unavailable())) {
    const a = await axe.score({ dir, url: site.url });
    assert.ok(a["axe.violations"]!.value >= 1, "axe flagged the image without alt text");
  } else skip("axe", "playwright unavailable");

  if (!(await lighthouse.unavailable())) {
    const l = await lighthouse.score({ dir, url: site.url });
    assert.ok(typeof l["lighthouse.accessibility"]?.value === "number", JSON.stringify(l));
  } else skip("lighthouse", "not installed");
} finally {
  await site.close();
}

console.log(
  unverified.length
    ? `tools check passed — NOT verified here: ${unverified.join("; ")}`
    : "tools check passed (playwright full page + console, sharp, gltf-transform, gitleaks, axe, lighthouse — all run for real)",
);
