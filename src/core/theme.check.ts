// D3 — the 91 styles rendered for real. The same markup is themed by each guide and rendered in
// Playwright: every page carries its own background, text colour, heading face, radius and border;
// no two of the 91 renders are the same image; and every theme's text meets WCAG AA, measured on
// the page by the same contrast runner the engine uses. Also reports how many of the guides'
// checks now have a rendered-page runner — the honest coverage number.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serve } from "./benchmark.js";
import { PlaywrightBrowserWorker, openPage } from "./browser.js";
import { SNAPSHOT_SCRIPT, renderedCoverage, runRenderedCheck } from "./design/rendered.js";
import type { PageSnapshot } from "./design/rendered.js";
import { listStyles, loadBaseChecks, loadStyle, styleTokensCss } from "./design/style.js";
import { contrast, parseColor, resolveRoles, styleThemeCss } from "./design/theme.js";

const slugs = listStyles();
assert.equal(slugs.length, 91);

// ── Pure: every theme's roles are readable, and every theme is deterministic ──
for (const slug of slugs) {
  const g = loadStyle(slug);
  const r = resolveRoles(g);
  const c = (a: string, b: string): number => contrast(parseColor(a)!, parseColor(b)!);
  assert.ok(c(r.fg, r.bg) >= 4.5, `${slug}: text ${r.fg} on ${r.bg} is ${c(r.fg, r.bg).toFixed(2)}:1`);
  assert.ok(c(r.onAccent, r.accent) >= 4.5, `${slug}: button label ${r.onAccent} on ${r.accent}`);
  assert.ok(c(r.link, r.bg) >= 4.5, `${slug}: link ${r.link} on ${r.bg}`);
  assert.equal(styleThemeCss(g), styleThemeCss(g));
}
const brutal = styleThemeCss(loadStyle("brutalism"));
assert.ok(!/transition|box-shadow/.test(brutal), "a zero-motion, no-shadow guide declares neither");
assert.match(brutal, /--radius: 0px/);

// ── Coverage of the guides' checks by a rendered-page runner ──
const allChecks = [...loadBaseChecks(), ...slugs.flatMap((s) => loadStyle(s).checks)];
const cov = renderedCoverage(allChecks);
assert.ok(cov.covered >= 100 && cov.full >= 30, JSON.stringify(cov));

// ── Rendered: the same markup, 91 ways ──
if (!PlaywrightBrowserWorker.available()) {
  assert.notEqual(process.env["WEAVE_REQUIRE_TOOLS"], "1", "the 91-style render needs Playwright here");
  console.log(`theme check passed (91 themes readable; coverage ${cov.covered}/${cov.deterministic} checks can fail, ${cov.full} can pass) — render NOT verified here: no Playwright`);
} else {
  const root = mkdtempSync(join(tmpdir(), "weave-themes-"));
  for (const slug of slugs) {
    const g = loadStyle(slug);
    mkdirSync(join(root, slug, "styles"), { recursive: true });
    writeFileSync(join(root, slug, "styles", "tokens.css"), styleTokensCss(g));
    writeFileSync(join(root, slug, "styles", "theme.css"), styleThemeCss(g));
    writeFileSync(
      join(root, slug, "index.html"),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${g.title}</title>
<link rel="stylesheet" href="styles/tokens.css"><link rel="stylesheet" href="styles/theme.css"></head>
<body><main><h1>Go2, the robot dog</h1><p>Ships with <a href="#specs">full specifications</a> and a <code>ros2</code> SDK.</p>
<section id="specs"><h2>Specifications</h2><article><h3>Battery</h3><p>Two hours of continuous walking.</p></article>
<p><button>Reserve yours</button> <input aria-label="Email" placeholder="you@example.com"></p></section></main></body></html>`,
    );
  }
  const site = await serve(root);
  const { browser, page } = await openPage(1024, 700);
  const hashes = new Map<string, string>();
  let overGradient = 0;
  const contrastRule = { id: "theme.contrast", rule: "all text meets 4.5:1 against the single surface colour", kind: "deterministic" as const };
  try {
    for (const slug of slugs) {
      await page.goto(`${site.url}${slug}/`, { waitUntil: "load" });
      const got = await page.evaluate<{ bg: string; color: string; h1: string; radius: string; border: string }>(`(() => {
        const b = getComputedStyle(document.body), h = getComputedStyle(document.querySelector("h1")), btn = getComputedStyle(document.querySelector("button"));
        return { bg: b.backgroundColor, color: b.color, h1: h.fontFamily, radius: btn.borderTopLeftRadius, border: btn.borderTopWidth };
      })()`);
      const g = loadStyle(slug);
      const r = resolveRoles(g);
      const same = (css: string, hex: string): boolean => parseColor(css)!.every((v, i) => Math.abs(v - parseColor(hex)![i]!) <= 1);
      assert.ok(same(got.bg, r.bg), `${slug}: background ${got.bg}, token ${r.bg}`);
      assert.ok(same(got.color, r.fg), `${slug}: text ${got.color}, resolved ${r.fg}`);
      const shape = g.tokens["shape"] as { radius_px?: number; border_px?: number };
      assert.equal(got.radius, `${shape.radius_px ?? 0}px`, `${slug}: button radius`);
      assert.equal(got.border, `${shape.border_px ?? 1}px`, `${slug}: button border`);
      const families = (g.tokens["typography"] as { families: Array<{ role: string; family: string }> }).families;
      // The display face when the guide has one; otherwise one of the guide's own families.
      const h1 = got.h1.replace(/"/g, "");
      const display = families.find((f) => f.role === "display") ?? families.find((f) => f.role === "hand");
      const first = (f: { family: string }): string => f.family.split(",")[0]!.trim();
      assert.ok(display ? h1.startsWith(first(display)) : families.some((f) => h1.startsWith(first(f))), `${slug}: h1 in ${got.h1}`);

      const snap = await page.evaluate<PageSnapshot>(SNAPSHOT_SCRIPT);
      // A theme with a gradient behind its text cannot pass on computed colours — that needs a
      // pixel check — but no theme may fail, and every other theme must pass outright.
      const res = runRenderedCheck(contrastRule, snap)!;
      const gradient = /gradient\(/.test(styleThemeCss(g));
      assert.notEqual(res.status, "fail", `${slug}: ${res.detail}`);
      assert.equal(res.status, gradient ? "unavailable" : "pass", `${slug}: ${res.detail}`);
      if (gradient) overGradient++;
      hashes.set(createHash("sha256").update(await page.screenshot()).digest("hex"), slug);
    }
  } finally {
    await browser.close();
    await site.close();
  }
  assert.equal(hashes.size, 91, `only ${hashes.size} distinct renders of 91 styles`);
  console.log(
    `theme check passed (91 styles rendered: own background, text, heading face, radius and border; 91 distinct images; WCAG AA text on every theme — ${91 - overGradient} measured, ${overGradient} over a gradient left for a pixel check; coverage ${cov.covered}/${cov.deterministic} deterministic checks can fail on a render, ${cov.full} can also pass)`,
  );
}
