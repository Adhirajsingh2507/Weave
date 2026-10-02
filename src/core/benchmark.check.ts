// ponytail: the benchmark's arithmetic and honesty, without paying for agent runs. Two fake arms
// build known sites; a scorer that fetches the served page counts images without alt text; an
// uninstalled scorer must be reported, not silently dropped; and a loss must show in the table.

import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderBenchmark, runBenchmark, serve, summarise } from "./benchmark.js";
import type { Arm, Scorer } from "./benchmark.js";

const page = (imgs: string): string => `<!doctype html><html lang="en"><title>t</title><body>${imgs}</body></html>`;

/** Writes a site whose missing-alt count is chosen per run. */
function arm(name: string, missingAlt: number[]): Arm {
  let i = 0;
  return {
    name,
    async build(_brief, dir) {
      const n = missingAlt[i++]!;
      mkdirSync(join(dir, "dist"), { recursive: true });
      writeFileSync(join(dir, "dist", "index.html"), page(`${'<img src="a.png">'.repeat(n)}<img src="b.png" alt="ok">`));
      return { ok: true, siteDir: join(dir, "dist"), meta: { n } };
    },
  };
}

// Stands in for axe: judges the page as served over HTTP, not the file on disk.
const missingAlt: Scorer = {
  name: "missing-alt",
  async unavailable() {
    return null;
  },
  async score({ url }) {
    const html = await (await fetch(url)).text();
    const imgs = html.match(/<img\b[^>]*>/g) ?? [];
    return { "img.missing-alt": { value: imgs.filter((t) => !/\balt=/.test(t)).length, better: "lower" } };
  },
};
const absent: Scorer = {
  name: "not-installed",
  async unavailable() {
    return "not-installed not on PATH (install it)";
  },
  async score() {
    throw new Error("must never be called");
  },
};

// weave wins runs 1 and 3, loses run 2, never ties.
const result = await runBenchmark({
  brief: "x",
  arms: [arm("plain", [2, 0, 3]), arm("weave", [0, 1, 0])],
  runs: 3,
  scorers: [missingAlt, absent],
});

assert.equal(result.runs.length, 6, "runs × arms");

// Resumed: runs that produced a site are kept, not rebuilt; progress is reported after each run.
{
  let built = 0;
  const counting = (name: string) => ({
    name,
    async build(_b: string, dir: string) {
      built++;
      mkdirSync(join(dir, "dist"), { recursive: true });
      writeFileSync(join(dir, "dist", "index.html"), page('<img src="b.png" alt="ok">'));
      return { ok: true, siteDir: join(dir, "dist") };
    },
  });
  const saved: number[] = [];
  const previous = [...result.runs.filter((r) => r.index === 1), { arm: "plain", index: 2, ok: false, metrics: {} }];
  const resumed = await runBenchmark({ brief: "x", arms: [counting("plain"), counting("weave")], runs: 2, scorers: [missingAlt], previous, onRun: (runs) => saved.push(runs.length) });
  assert.equal(built, 2, "only the unfinished pair is built — the failed plain run 2 is rebuilt, run 1 is kept");
  assert.deepEqual(resumed.runs.find((r) => r.arm === "plain" && r.index === 1)!.metrics, result.runs.find((r) => r.arm === "plain" && r.index === 1)!.metrics);
  assert.deepEqual(saved, [3, 4], "saved after each new run");
}
assert.deepEqual(result.unavailable, [{ scorer: "not-installed", why: "not-installed not on PATH (install it)" }]);
assert.deepEqual(
  result.runs.map((r) => [r.arm, r.index]),
  [["plain", 1], ["weave", 1], ["plain", 2], ["weave", 2], ["plain", 3], ["weave", 3]],
  "arms are interleaved so drift hits both",
);

const [s] = summarise(result);
assert.equal(s!.metric, "img.missing-alt");
assert.equal(s!.better, "lower");
assert.deepEqual(s!.arms["plain"], { n: 3, mean: 5 / 3, sd: Math.sqrt(((2 - 5 / 3) ** 2 + (0 - 5 / 3) ** 2 + (3 - 5 / 3) ** 2) / 2), min: 0, max: 3 });
assert.equal(s!.arms["weave"]!.mean, 1 / 3);
assert.deepEqual(s!.wins, { tie: 0, plain: 1, weave: 2 }, "the run weave lost is counted");

const table = renderBenchmark(result);
assert.match(table, /\| img\.missing-alt \| lower \| 1\.7 ± 1\.5 \(3\) \| 0\.3 ± 0\.6 \(3\) \| plain 1, weave 2, tie 0 \|/);
assert.match(table, /Not measured \(scorer unavailable\):\n- not-installed: /);

// The server never serves outside the site.
// A raw, encoded path: fetch would normalise "/../.." away before the server ever saw it.
const site = await serve(join(tmpdir(), "."));
const port = Number(new URL(site.url).port);
const status = await new Promise<number>((resolve) => {
  request({ host: "127.0.0.1", port, path: "/..%2f..%2f..%2fetc%2fpasswd" }, (r) => {
    r.resume();
    resolve(r.statusCode ?? 0);
  }).end();
});
assert.equal(status, 404, "no path traversal");
await site.close();

console.log("benchmark check passed (third-party scorers only, unavailable reported, variance and losses in the table)");
