// ponytail: every pack item ships with a fixture proving both directions. A check that only
// ever proves the happy path is how false positives get shipped, and a security pack nobody
// trusts is worse than no pack at all.

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSiteContext } from "./context.js";
import { DEFAULT_PACKS, listPacks, loadPack, runPack } from "./load.js";
import type { CheckStatus } from "./types.js";

const write = (root: string, rel: string, body: string): void => {
  const path = join(root, rel);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body, "utf8");
};

// Every shipped pack loads, has unique ids and known runners (loadPack enforces both).
const packs = listPacks();
assert.ok(packs.length >= 4, `expected the starter packs, found ${packs.join(", ")}`);
for (const name of packs) {
  const pack = loadPack(name);
  assert.ok(pack.items.length > 0, `${name} has no items`);
  for (const item of pack.items) {
    assert.ok(item.requirement.length > 15, `${name}/${item.id} has no usable requirement text`);
    assert.ok(["blocking", "advisory"].includes(item.severity), `${name}/${item.id} bad severity`);
    // Provenance back to the source lists, so an item can always be traced to why it exists.
    if (!["a11y", "performance"].includes(name)) {
      assert.ok(item.source, `${name}/${item.id} has no source`);
    }
  }
}
assert.deepEqual(DEFAULT_PACKS, ["web-security", "a11y"], "security and a11y are the defaults");

const statusOf = (outcomes: ReturnType<typeof runPack>, id: string): CheckStatus => {
  const found = outcomes.find((o) => o.itemId === id);
  assert.ok(found, `no outcome for ${id}`);
  return found!.status;
};

// ── A site that violates the rules ────────────────────────
const bad = mkdtempSync(join(tmpdir(), "weave-pack-bad-"));
write(bad, "package.json", `{"name":"bad","dependencies":{}}\n`);
write(bad, ".env", "SECRET=hunter2\n");
write(
  bad,
  "index.html",
  `<!doctype html>
<html>
<head><title>x</title></head>
<body>
  <h1>One</h1>
  <h1>Two</h1>
  <img src="a.png">
  <a href="https://example.com" target="_blank">out</a>
  <script>const key = "sk_live_abcdefghijklmnop";</script>
</body>
</html>
`,
);
write(bad, "styles/site.css", "a:focus { outline: none; }\n");

const badCtx = buildSiteContext(bad);
const badSec = runPack(loadPack("web-security"), badCtx);
const badA11y = runPack(loadPack("a11y"), badCtx);

assert.equal(statusOf(badSec, "sec.secrets.not-tracked"), "fail", "a committed .env must fail");
assert.equal(statusOf(badSec, "sec.secrets.not-in-source"), "fail", "a live key in source must fail");
assert.equal(statusOf(badSec, "sec.links.noopener"), "fail", "target=_blank without noopener must fail");
assert.equal(statusOf(badA11y, "a11y.lang"), "fail", "missing lang must fail");
assert.equal(statusOf(badA11y, "a11y.one-h1"), "fail", "two h1 elements must fail");
assert.equal(statusOf(badA11y, "a11y.img-alt"), "fail", "img without alt must fail");
assert.equal(statusOf(badA11y, "a11y.focus-visible"), "fail", "outline:none must fail");
assert.equal(statusOf(badA11y, "a11y.reduced-motion"), "fail", "css without a reduced-motion block must fail");

// ── The same site, fixed ──────────────────────────────────
const good = mkdtempSync(join(tmpdir(), "weave-pack-good-"));
write(good, "package.json", `{"name":"good","dependencies":{}}\n`);
write(
  good,
  "index.html",
  `<!doctype html>
<html lang="en">
<head>
  <title>A real title</title>
  <meta name="description" content="A description long enough to be useful to a search engine.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <a href="#main">Skip to content</a>
  <nav aria-label="Primary">
    <a href="#one">One</a>
    <a href="#two">Two</a>
  </nav>
  <main id="main">
    <h1>One</h1>
    <img src="a.png" alt="a picture" width="10" height="10" loading="lazy">
    <a href="https://example.com" target="_blank" rel="noopener">out</a>
  </main>
</body>
</html>
`,
);
write(good, "styles/site.css", "@media (prefers-reduced-motion: reduce) { * { animation: none; } }\n");

const goodCtx = buildSiteContext(good);
const goodSec = runPack(loadPack("web-security"), goodCtx);
const goodA11y = runPack(loadPack("a11y"), goodCtx);

for (const id of ["sec.secrets.not-tracked", "sec.secrets.not-in-source", "sec.links.noopener"]) {
  assert.equal(statusOf(goodSec, id), "pass", `${id} should pass on the fixed site`);
}
// A nav written over several lines, as real agents write it (found by the first real build: the
// pattern used "." and failed every multi-line nav).
assert.equal(statusOf(goodA11y, "a11y.ux.nav-choices"), "pass", "a short multi-line nav passes");
// reduced-motion lives in CSS, not markup — the check must look where the rule actually is.
assert.equal(statusOf(goodA11y, "a11y.reduced-motion"), "pass", "a reduced-motion block in CSS must pass");
for (const id of ["a11y.lang", "a11y.title", "a11y.one-h1", "a11y.img-alt", "a11y.skip-link", "a11y.viewport"]) {
  assert.equal(statusOf(goodA11y, id), "pass", `${id} should pass on the fixed site`);
}

// ── Headers are what the host serves: unavailable on disk, decided against the live site ──
const HEADERS = ["sec.headers.nosniff", "sec.headers.frame", "sec.headers.hsts", "sec.headers.referrer"];
for (const id of HEADERS) assert.equal(statusOf(goodSec, id), "unavailable", `${id} cannot be decided before release`);
const liveGood = runPack(loadPack("web-security"), {
  ...goodCtx,
  live: {
    url: "https://site.test",
    headers: {
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "strict-transport-security": "max-age=63072000; includeSubDomains",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  },
});
for (const id of HEADERS) assert.equal(statusOf(liveGood, id), "pass", `${id} should pass when the host sends it`);
const liveBad = runPack(loadPack("web-security"), {
  ...goodCtx,
  live: { url: "https://site.test", headers: { "x-content-type-options": "sniff-away", "x-frame-options": "ALLOWALL" } },
});
for (const id of HEADERS) assert.equal(statusOf(liveBad, id), "fail", `${id} should fail when the header is missing or wrong`);

// ── Applicability: the difference between a useful pack and noise ──
// A brochure site has no auth, payments or database, so those items must not fire.
assert.ok(!goodCtx.facts.has("hasAuth"), "a static page is not an auth surface");
assert.ok(!goodCtx.facts.has("hasPayments"), "a static page is not a payments surface");
for (const id of ["sec.auth.session-hygiene", "sec.auth.no-enumeration", "sec.payments.server-side-prices"]) {
  assert.equal(statusOf(goodSec, id), "not-applicable", `${id} must not fire on a static site`);
}
assert.equal(statusOf(goodSec, "sec.db.least-privilege"), "not-applicable", "no database here");

// …and a site that does have those surfaces gets them evaluated.
const app = mkdtempSync(join(tmpdir(), "weave-pack-app-"));
write(app, "package.json", `{"name":"app","dependencies":{"express":"^4","stripe":"^14","prisma":"^5"}}\n`);
write(
  app,
  "index.html",
  `<!doctype html><html lang="en"><head><title>Sign in</title></head><body>
  <h1>Sign in</h1>
  <form method="post"><input type="password" name="p"><button>Go</button></form>
  </body></html>
`,
);
const appCtx = buildSiteContext(app);
assert.ok(appCtx.facts.has("hasAuth"), "a password field is an auth surface");
assert.ok(appCtx.facts.has("hasPayments"), "a stripe dependency is a payments surface");
assert.ok(appCtx.facts.has("hasDatabase"), "a prisma dependency is a database surface");
assert.ok(appCtx.facts.has("hasForms"), "a form is a form");

const appSec = runPack(loadPack("web-security"), appCtx);
assert.equal(
  statusOf(appSec, "sec.auth.session-hygiene"),
  "unavailable",
  "an applicable browser check reports unavailable, never pass",
);
assert.equal(statusOf(appSec, "sec.db.least-privilege"), "human", "some things only a person can confirm");
// No lockfile, so pnpm cannot audit. A failed audit is not a clean one (it used to read as pass).
assert.equal(statusOf(appSec, "sec.deps.audited"), "unavailable", "an audit that could not run is unavailable");

// Nothing may claim to pass without having been evaluated.
for (const outcomes of [badSec, badA11y, goodSec, goodA11y, appSec]) {
  for (const o of outcomes) {
    assert.ok(o.detail.length > 3, `${o.itemId} produced no detail`);
    assert.ok(
      ["pass", "fail", "not-applicable", "unavailable", "human"].includes(o.status),
      `${o.itemId} has an unknown status`,
    );
  }
}

for (const dir of [bad, good, app]) rmSync(dir, { recursive: true, force: true });
const total = packs.reduce((n, p) => n + loadPack(p).items.length, 0);
console.log(`policy packs check passed (${packs.length} packs, ${total} items, both directions fixtured)`);
