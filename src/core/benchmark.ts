// V2.5 — the benchmark: the same brief, two arms — one plain agent session and one governed Weave
// run — scored by third-party tools only. Weave's own checks never grade either arm; if they did,
// the benchmark would measure agreement with itself.
//
// Scorers are probed, not assumed. One that is not installed is reported as unavailable with how
// to get it, and every metric carries its direction so "better" is never implicit. N runs per arm,
// with variance, and the runs Weave loses are part of the table.

import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { promisify } from "node:util";
import { PlaywrightBrowserWorker, openPage } from "./browser.js";
import { WEAVE_ROOT, toolBin } from "./tools.js";

const run = promisify(execFile);

export interface ArmResult {
  ok: boolean;
  /** Directory holding the built site (dist/ if the project builds, else its root). */
  siteDir: string;
  /** Anything the arm wants on the record: gates opened, attempts, wall-clock. */
  meta?: Record<string, unknown>;
  log?: string;
}

export interface Arm {
  readonly name: string;
  build(brief: string, workDir: string): Promise<ArmResult>;
}

export interface Metric {
  value: number;
  better: "higher" | "lower";
}

export interface Scorer {
  readonly name: string;
  /** Null when usable; otherwise why not, and how to fix it. */
  unavailable(): Promise<string | null>;
  score(site: { dir: string; url: string }): Promise<Record<string, Metric>>;
}

async function onPath(bin: string): Promise<boolean> {
  if (toolBin(bin) !== bin) return true;
  try {
    await run("which", [bin]);
    return true;
  } catch {
    return false;
  }
}

async function json(cmd: string, args: string[], cwd: string): Promise<unknown> {
  try {
    const { stdout } = await run(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 300_000 });
    return JSON.parse(stdout);
  } catch (e) {
    // Several of these tools exit non-zero when they find something; the report is still on stdout.
    const out = (e as { stdout?: string }).stdout;
    if (out) return JSON.parse(out);
    throw e;
  }
}

/** Lighthouse category scores, 0–100. */
export const lighthouse: Scorer = {
  name: "lighthouse",
  async unavailable() {
    return (await onPath("lighthouse")) ? null : "lighthouse not installed (pnpm install; needs Chrome)";
  },
  async score({ url, dir }) {
    const report = (await json(
      toolBin("lighthouse"),
      [url, "--output=json", "--quiet", "--chrome-flags=--headless=new --no-sandbox"],
      dir,
    )) as { categories: Record<string, { score: number | null }> };
    const out: Record<string, Metric> = {};
    for (const [k, v] of Object.entries(report.categories)) {
      if (v.score !== null) out[`lighthouse.${k}`] = { value: Math.round(v.score * 100), better: "higher" };
    }
    return out;
  },
};

/** axe-core accessibility violations, run in Weave's Playwright Chromium (D2). */
export const axe: Scorer = {
  name: "axe",
  async unavailable() {
    return PlaywrightBrowserWorker.available() ? null : "axe needs Playwright (pnpm install && pnpm exec playwright install chromium)";
  },
  async score({ url }) {
    const { default: AxeBuilder } = (await import(join(WEAVE_ROOT, "node_modules", "@axe-core", "playwright", "dist", "index.mjs"))) as {
      default: new (o: { page: unknown }) => { analyze(): Promise<{ violations: Array<{ nodes: unknown[] }> }> };
    };
    const { browser, page } = await openPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      const { violations } = await new AxeBuilder({ page }).analyze();
      return {
        "axe.violations": { value: violations.length, better: "lower" },
        "axe.affected-nodes": { value: violations.reduce((n, v) => n + v.nodes.length, 0), better: "lower" },
      };
    } finally {
      await browser.close();
    }
  },
};

/** Secrets in the built output, via gitleaks. */
export const gitleaks: Scorer = {
  name: "gitleaks",
  async unavailable() {
    return (await onPath("gitleaks")) ? null : "gitleaks not installed (pnpm tools:gitleaks)";
  },
  async score({ dir }) {
    const report = join(mkdtempSync(join(tmpdir(), "weave-gitleaks-")), "report.json");
    try {
      await run(toolBin("gitleaks"), ["detect", "--no-git", "--source", dir, "--report-format", "json", "--report-path", report, "--exit-code", "0"]);
    } catch {
      // the report is what matters
    }
    const findings = existsSync(report) ? (JSON.parse(readFileSync(report, "utf8")) as unknown[]) : [];
    return { "gitleaks.findings": { value: findings.length, better: "lower" } };
  },
};

/** High and critical advisories in the project's dependencies, via pnpm. */
export const pnpmAudit: Scorer = {
  name: "pnpm-audit",
  async unavailable() {
    return (await onPath("pnpm")) ? null : "pnpm not on PATH";
  },
  async score({ dir }): Promise<Record<string, Metric>> {
    const root = dir.endsWith("/dist") ? dir.slice(0, -"/dist".length) : dir;
    if (!existsSync(join(root, "pnpm-lock.yaml"))) {
      const pkg = existsSync(join(root, "package.json"))
        ? (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { dependencies?: object })
        : {};
      // No dependencies at all is a real zero, not a missing measurement.
      return Object.keys(pkg.dependencies ?? {}).length ? {} : { "audit.high+critical": { value: 0, better: "lower" } };
    }
    const report = (await json("pnpm", ["audit", "--prod", "--json"], root)) as { metadata?: { vulnerabilities?: Record<string, number> } };
    const v = report.metadata?.vulnerabilities;
    return v ? { "audit.high+critical": { value: (v["high"] ?? 0) + (v["critical"] ?? 0), better: "lower" } } : {};
  },
};

export const DEFAULT_SCORERS: Scorer[] = [lighthouse, axe, gitleaks, pnpmAudit];

const TYPES: Record<string, string> = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".glb": "model/gltf-binary", ".webp": "image/webp", ".json": "application/json", ".mjs": "text/javascript", ".gltf": "model/gltf+json", ".ico": "image/x-icon" };

/**
 * Serve a built site as its deploy would: the global headers in its vercel.json are sent, so a
 * local render runs under the same CSP as production and a policy that breaks the page is caught
 * before release. ponytail: only `source: "/(.*)"` rules; per-path rules are the upgrade.
 */
export async function serve(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const headers: Record<string, string> = {};
  try {
    const cfg = JSON.parse(readFileSync(join(dir, "vercel.json"), "utf8")) as { headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }> };
    for (const rule of cfg.headers ?? []) if (rule.source === "/(.*)") for (const h of rule.headers) headers[h.key.toLowerCase()] = h.value;
  } catch {
    // no vercel.json, or not ours to read: plain static serving
  }
  const server: Server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0]!)).replace(/^(\.\.[/\\])+/, "");
    let file = join(dir, path === "/" ? "index.html" : path);
    // A folder serves its index.html; reading the folder itself threw and killed the server.
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!file.startsWith(dir) || !existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { ...headers, "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return { url: `http://127.0.0.1:${port}/`, close: () => new Promise((r) => server.close(() => r())) };
}

export interface BenchRun {
  arm: string;
  index: number;
  ok: boolean;
  metrics: Record<string, Metric>;
  meta?: Record<string, unknown>;
}

export interface BenchResult {
  brief: string;
  runs: BenchRun[];
  unavailable: Array<{ scorer: string; why: string }>;
}

export async function runBenchmark(opts: {
  brief: string;
  arms: Arm[];
  runs: number;
  scorers?: Scorer[];
  onProgress?: (line: string) => void;
}): Promise<BenchResult> {
  const scorers = opts.scorers ?? DEFAULT_SCORERS;
  const unavailable: BenchResult["unavailable"] = [];
  const usable: Scorer[] = [];
  for (const s of scorers) {
    const why = await s.unavailable();
    if (why) unavailable.push({ scorer: s.name, why });
    else usable.push(s);
  }
  const runs: BenchRun[] = [];
  // Interleave arms so drift over time (API latency, cache state) hits both equally.
  for (let i = 0; i < opts.runs; i++) {
    for (const arm of opts.arms) {
      const work = mkdtempSync(join(tmpdir(), `weave-bench-${arm.name}-`));
      opts.onProgress?.(`${arm.name} run ${i + 1}/${opts.runs}`);
      const result = await arm.build(opts.brief, work);
      const metrics: Record<string, Metric> = {};
      if (result.ok && existsSync(join(result.siteDir, "index.html"))) {
        const site = await serve(result.siteDir);
        try {
          for (const s of usable) {
            try {
              Object.assign(metrics, await s.score({ dir: result.siteDir, url: site.url }));
            } catch (e) {
              opts.onProgress?.(`  ${s.name} failed on ${arm.name} run ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        } finally {
          await site.close();
        }
      }
      runs.push({ arm: arm.name, index: i + 1, ok: result.ok, metrics, ...(result.meta ? { meta: result.meta } : {}) });
    }
  }
  return { brief: opts.brief, runs, unavailable };
}

export interface MetricSummary {
  metric: string;
  better: "higher" | "lower";
  arms: Record<string, { n: number; mean: number; sd: number; min: number; max: number }>;
  /** Head-to-head per paired run index: which arm was better, or a tie. */
  wins: Record<string, number>;
}

export function summarise(result: BenchResult): MetricSummary[] {
  const arms = [...new Set(result.runs.map((r) => r.arm))];
  const names = [...new Set(result.runs.flatMap((r) => Object.keys(r.metrics)))].sort();
  return names.map((metric) => {
    const better = result.runs.find((r) => r.metrics[metric])!.metrics[metric]!.better;
    const stats: MetricSummary["arms"] = {};
    for (const arm of arms) {
      const xs = result.runs.filter((r) => r.arm === arm && r.metrics[metric]).map((r) => r.metrics[metric]!.value);
      if (!xs.length) continue;
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const sd = xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1)) : 0;
      stats[arm] = { n: xs.length, mean, sd, min: Math.min(...xs), max: Math.max(...xs) };
    }
    const wins: Record<string, number> = { tie: 0, ...Object.fromEntries(arms.map((a) => [a, 0])) };
    const indices = [...new Set(result.runs.map((r) => r.index))];
    for (const i of indices) {
      const scored = arms
        .map((a) => ({ a, v: result.runs.find((r) => r.arm === a && r.index === i)?.metrics[metric]?.value }))
        .filter((x): x is { a: string; v: number } => x.v !== undefined);
      if (scored.length < 2) continue;
      const best = better === "higher" ? Math.max(...scored.map((x) => x.v)) : Math.min(...scored.map((x) => x.v));
      const top = scored.filter((x) => x.v === best);
      if (top.length > 1) wins["tie"]!++;
      else wins[top[0]!.a]!++;
    }
    return { metric, better, arms: stats, wins };
  });
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Markdown table: mean ± sd per arm, and the head-to-head — losses included. */
export function renderBenchmark(result: BenchResult): string {
  const arms = [...new Set(result.runs.map((r) => r.arm))];
  const out: string[] = [];
  const perArm = arms.map((a) => {
    const rs = result.runs.filter((r) => r.arm === a);
    return `${a}: ${rs.filter((r) => r.ok).length}/${rs.length} runs produced a site`;
  });
  out.push(`Runs — ${perArm.join("; ")}`, "");
  out.push(`| metric | better | ${arms.map((a) => `${a} (mean ± sd, n)`).join(" | ")} | head-to-head |`);
  out.push(`|---|---|${arms.map(() => "---").join("|")}|---|`);
  for (const s of summarise(result)) {
    const cells = arms.map((a) => {
      const st = s.arms[a];
      return st ? `${fmt(st.mean)} ± ${fmt(st.sd)} (${st.n})` : "—";
    });
    const h2h = [...arms, "tie"].map((a) => `${a} ${s.wins[a] ?? 0}`).join(", ");
    out.push(`| ${s.metric} | ${s.better} | ${cells.join(" | ")} | ${h2h} |`);
  }
  if (result.unavailable.length) {
    out.push("", "Not measured (scorer unavailable):");
    for (const u of result.unavailable) out.push(`- ${u.scorer}: ${u.why}`);
  }
  return out.join("\n");
}
