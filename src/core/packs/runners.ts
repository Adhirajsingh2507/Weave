// Pack runners. Dependency-free by decision: they read the source tree and the built output,
// so they work offline, in CI, and inside a fresh worktree.
//
// A runner never guesses. If it cannot evaluate something it says `unavailable` — the browser
// and Lighthouse runners arrive with the browser worker, and saying so is more useful than a
// green tick that means nothing.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SiteContext } from "./context.js";
import type { CheckStatus, PackItem } from "./types.js";

export interface RunnerResult {
  status: CheckStatus;
  detail: string;
}

type Runner = (item: PackItem, ctx: SiteContext) => RunnerResult;

const arg = <T>(item: PackItem, key: string, fallback: T): T =>
  (item.args?.[key] as T | undefined) ?? fallback;

/** Does any of these paths exist, in the source tree or the built output? */
const fileExists: Runner = (item, ctx) => {
  const candidates = arg<string[]>(item, "paths", []);
  const found = candidates.filter(
    (p) =>
      existsSync(join(ctx.repoPath, p)) ||
      ctx.distFiles.some((f) => f.path === p || f.path.endsWith(`/${p}`)),
  );
  return found.length
    ? { status: "pass", detail: `found ${found.join(", ")}` }
    : { status: "fail", detail: `none of ${candidates.join(", ")} exist` };
};

/** Nothing matching these globs may be tracked by git or present in the built output. */
const fileAbsent: Runner = (item, ctx) => {
  const patterns = arg<string[]>(item, "patterns", []).map((p) => new RegExp(p));
  const offenders = [
    ...ctx.trackedFiles.filter((f) => patterns.some((re) => re.test(f))),
    ...ctx.distFiles.map((f) => `dist/${f.path}`).filter((f) => patterns.some((re) => re.test(f))),
  ];
  return offenders.length
    ? { status: "fail", detail: `should not be published: ${offenders.slice(0, 5).join(", ")}` }
    : { status: "pass", detail: "none present" };
};

/**
 * Regex assertions over HTML pages. Deliberately not a DOM parser: these are coarse structural
 * facts (a title exists, one h1, every img has alt), and a parser dependency buys little here.
 */
const htmlAssert: Runner = (item, ctx) => {
  if (!ctx.htmlPages.length) return { status: "not-applicable", detail: "no html pages" };

  const pattern = arg<string>(item, "pattern", "");
  const expect = arg<"present" | "absent" | "count">(item, "expect", "present");
  const count = arg<number>(item, "count", 1);
  const perMatch = arg<string | undefined>(item, "eachMatch", undefined);
  const requires = arg<string | undefined>(item, "requires", undefined);
  const flags = arg<string>(item, "flags", "i");

  const failures: string[] = [];
  for (const page of ctx.htmlPages) {
    // "every X must contain Y" — e.g. every <img> carries alt, every target=_blank has rel.
    if (perMatch && requires) {
      const matches = page.html.match(new RegExp(perMatch, `g${flags}`)) ?? [];
      const bad = matches.filter((m) => !new RegExp(requires, flags).test(m));
      if (bad.length) failures.push(`${page.path}: ${bad.length} of ${matches.length} missing ${requires}`);
      continue;
    }
    const re = new RegExp(pattern, `g${flags}`);
    const hits = (page.html.match(re) ?? []).length;
    if (expect === "present" && hits === 0) failures.push(`${page.path}: no match for ${pattern}`);
    if (expect === "absent" && hits > 0) failures.push(`${page.path}: ${hits} unwanted match(es)`);
    if (expect === "count" && hits !== count) failures.push(`${page.path}: expected ${count}, found ${hits}`);
  }

  return failures.length
    ? { status: "fail", detail: failures.slice(0, 4).join("; ") }
    : { status: "pass", detail: `${ctx.htmlPages.length} page(s) ok` };
};

/**
 * Scan source text. Defaults to "none of these patterns may appear", and `expect: present`
 * flips it to "at least one must" — for rules like honouring prefers-reduced-motion, which
 * live in CSS rather than markup.
 */
const textScan: Runner = (item, ctx) => {
  const patterns = arg<string[]>(item, "patterns", []);
  const expect = arg<"present" | "absent">(item, "expect", "absent");
  const scope = arg<"source" | "styles" | "scripts">(item, "scope", "source");
  const body =
    scope === "styles" ? ctx.css : scope === "scripts" ? ctx.js : [ctx.css, ctx.js, ...ctx.htmlPages.map((p) => p.html)].join("\n");
  if (!body.trim()) return { status: "not-applicable", detail: `nothing in scope '${scope}' to scan` };

  const hits = patterns.filter((p) => new RegExp(p, "i").test(body));
  if (expect === "present") {
    return hits.length
      ? { status: "pass", detail: `found ${hits.join(", ")}` }
      : { status: "fail", detail: `none of ${patterns.join(", ")} found in ${scope}` };
  }
  return hits.length
    ? { status: "fail", detail: `matched: ${hits.slice(0, 3).join(", ")}` }
    : { status: "pass", detail: `${patterns.length} pattern(s) clean` };
};

/** Dependency vulnerabilities, using the package manager already in the project. */
const depAudit: Runner = (_item, ctx) => {
  const deps = Object.keys({ ...(ctx.packageJson?.dependencies ?? {}) });
  if (!deps.length) return { status: "pass", detail: "no runtime dependencies to audit" };
  try {
    execFileSync("pnpm", ["audit", "--prod", "--json"], {
      cwd: ctx.repoPath,
      encoding: "utf8",
      timeout: 120_000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return { status: "pass", detail: "no advisories" };
  } catch (e) {
    const err = e as { stdout?: string; code?: string };
    if (err.code === "ENOENT") return { status: "unavailable", detail: "pnpm not available to audit" };
    const out = err.stdout ?? "";
    const advisories = (out.match(/"severity"\s*:\s*"(critical|high)"/g) ?? []).length;
    return advisories > 0
      ? { status: "fail", detail: `${advisories} high/critical advisory(ies)` }
      : { status: "pass", detail: "no high or critical advisories" };
  }
};

/** Budget check over built output. */
const fileSize: Runner = (item, ctx) => {
  const pattern = new RegExp(arg<string>(item, "pattern", ".*"), "i");
  const maxBytes = arg<number>(item, "maxBytes", 300_000);
  const pool = ctx.distFiles.length ? ctx.distFiles : ctx.files;
  const matching = pool.filter((f) => pattern.test(f.path));
  if (!matching.length) return { status: "not-applicable", detail: "no matching files" };
  const over = matching.filter((f) => f.size > maxBytes);
  return over.length
    ? {
        status: "fail",
        detail: over.map((f) => `${f.path} is ${Math.round(f.size / 1024)}KB`).slice(0, 3).join(", "),
      }
    : { status: "pass", detail: `${matching.length} file(s) within ${Math.round(maxBytes / 1024)}KB` };
};

const browser: Runner = (item) => ({
  status: "unavailable",
  detail: `needs the browser worker (V2.7): ${item.requirement}`,
});

const human: Runner = (item) => ({
  status: "human",
  detail: `needs a person: ${item.requirement}`,
});

export const RUNNERS: Record<string, Runner> = {
  "file-exists": fileExists,
  "file-absent": fileAbsent,
  "html-assert": htmlAssert,
  "text-scan": textScan,
  "dep-audit": depAudit,
  "file-size": fileSize,
  browser,
  human,
};
