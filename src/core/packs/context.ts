// What a pack runner gets to look at: the source tree, the built output, and a set of
// applicability facts derived from both.
//
// Applicability is the difference between a useful pack and noise. A payments rule firing on a
// brochure site trains people to ignore the report, so an item that does not apply is recorded
// as not-applicable with its reason rather than quietly passing.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import type { Applicability } from "./types.js";

export interface SiteFile {
  path: string;
  size: number;
}

export interface HtmlPage {
  path: string;
  html: string;
}

export interface SiteContext {
  repoPath: string;
  /** Every non-ignored file, relative to the repo root. */
  files: SiteFile[];
  /** Files git actually tracks — what would be published. */
  trackedFiles: string[];
  htmlPages: HtmlPage[];
  css: string;
  js: string;
  packageJson?: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> };
  distFiles: SiteFile[];
  facts: Set<Applicability>;
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".agent", "dist", "build", ".next", "coverage"]);
const TEXT_EXT = new Set([".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".txt", ".svg"]);

function walk(root: string, dir: string, out: SiteFile[], includeSkipped = false): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!includeSkipped && (SKIP_DIRS.has(entry.name) || entry.name.startsWith("."))) continue;
      walk(root, full, out, includeSkipped);
      continue;
    }
    try {
      out.push({ path: relative(root, full), size: statSync(full).size });
    } catch {
      // vanished mid-walk
    }
  }
}

function read(repoPath: string, rel: string): string {
  try {
    return readFileSync(join(repoPath, rel), "utf8");
  } catch {
    return "";
  }
}

export function buildSiteContext(repoPath: string): SiteContext {
  const files: SiteFile[] = [];
  walk(repoPath, repoPath, files);

  let trackedFiles: string[] = [];
  try {
    // stdio: a non-repo fixture is a normal case here, not something to print about.
    trackedFiles = execFileSync("git", ["ls-files"], {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    trackedFiles = files.map((f) => f.path);
  }

  const htmlPages: HtmlPage[] = files
    .filter((f) => [".html", ".htm"].includes(extname(f.path).toLowerCase()))
    .map((f) => ({ path: f.path, html: read(repoPath, f.path) }));

  const css = files
    .filter((f) => extname(f.path).toLowerCase() === ".css")
    .map((f) => read(repoPath, f.path))
    .join("\n");

  const js = files
    .filter((f) => [".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"].includes(extname(f.path).toLowerCase()))
    .filter((f) => !f.path.startsWith("scripts/")) // the scaffold's own build tooling
    .map((f) => read(repoPath, f.path))
    .join("\n");

  let packageJson: SiteContext["packageJson"];
  if (existsSync(join(repoPath, "package.json"))) {
    try {
      packageJson = JSON.parse(read(repoPath, "package.json")) as SiteContext["packageJson"];
    } catch {
      packageJson = undefined;
    }
  }

  const distFiles: SiteFile[] = [];
  if (existsSync(join(repoPath, "dist"))) walk(join(repoPath, "dist"), join(repoPath, "dist"), distFiles, true);

  const allText = [...htmlPages.map((p) => p.html), css, js].join("\n").toLowerCase();
  const deps = { ...(packageJson?.dependencies ?? {}), ...(packageJson?.devDependencies ?? {}) };
  const depNames = Object.keys(deps).join(" ").toLowerCase();

  const facts = new Set<Applicability>(["always"]);
  if (htmlPages.length) facts.add("hasHtml");
  if (/<form\b/.test(allText)) facts.add("hasForms");
  if (/type=["']password["']|\bsign ?in\b|\blog ?in\b|\bauth\b/.test(allText) || /auth|passport|lucia|clerk|next-auth/.test(depNames)) {
    facts.add("hasAuth");
  }
  if (/stripe|checkout|\bcart\b|\bprice\b|payment/.test(allText) || /stripe|paddle|braintree/.test(depNames)) {
    facts.add("hasPayments");
  }
  if (/prisma|drizzle|mongoose|\bpg\b|mysql|sqlite|supabase/.test(depNames)) facts.add("hasDatabase");
  if (/express|fastify|koa|next|nuxt|remix|hono/.test(depNames)) facts.add("hasServer");
  if (/<img\b/.test(allText)) facts.add("hasImages");
  if (Object.keys(deps).length > 0) facts.add("hasDependencies");
  if (css.trim().length > 0) facts.add("hasStyles");
  if (js.trim().length > 0) facts.add("hasScripts");
  if (["vercel.json", "netlify.toml", "_headers", "public/_headers", "static/_headers"].some((f) => existsSync(join(repoPath, f)))) {
    facts.add("hasDeployConfig");
  }

  return { repoPath, files, trackedFiles, htmlPages, css, js, packageJson, distFiles, facts };
}

/** Human-readable reason an item did not apply, for the evidence record. */
export function missingFacts(required: Applicability[] | undefined, facts: Set<Applicability>): Applicability[] {
  return (required ?? []).filter((f) => !facts.has(f));
}
