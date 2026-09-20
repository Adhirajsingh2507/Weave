// Ingestion: tiered cheap sweep → code nodes + depends_on edges + package nodes.
// git-diff freshness; monorepo workspace detection; code→design inferred mapping.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { parseFile } from "./parse.js";
import type { GraphStore } from "../store/graph-store.js";
import type { DecisionRunner } from "../decision/runner.js";

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".agent"]);

export interface IngestResult {
  files: number;
  edges: number;
  packages: number;
}

interface Pkg {
  name: string;
  dir: string;
}

function isSkippableDir(name: string): boolean {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

function walkCodeFiles(root: string): string[] {
  const out: string[] = [];
  const rec = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!isSkippableDir(e.name)) rec(full);
      } else if (CODE_EXT.has(extname(e.name))) {
        out.push(full);
      }
    }
  };
  rec(root);
  return out;
}

function detectPackages(root: string): Pkg[] {
  const pkgs: Pkg[] = [];
  const rec = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!isSkippableDir(e.name)) rec(full);
      } else if (e.name === "package.json") {
        try {
          const j = JSON.parse(readFileSync(full, "utf8")) as { name?: string };
          if (j.name) pkgs.push({ name: j.name, dir });
        } catch {
          /* ignore malformed package.json */
        }
      }
    }
  };
  rec(root);
  return pkgs;
}

function changedFiles(repoPath: string): string[] {
  const out = execFileSync("git", ["ls-files", "-m", "-o", "--exclude-standard"], {
    cwd: repoPath,
    encoding: "utf8",
  });
  return out.split("\n").filter((f) => f && CODE_EXT.has(extname(f)));
}

function resolveImport(spec: string, fromRel: string, repoRoot: string, pkgNames: Set<string>): string | null {
  if (spec.startsWith(".")) {
    const base = resolve(repoRoot, dirname(fromRel), spec);
    const noext = base.replace(/\.(js|jsx|mjs|cjs)$/, ""); // NodeNext: "./b.js" → b.ts
    const cands = [
      base,
      `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
      `${noext}.ts`, `${noext}.tsx`,
      join(base, "index.ts"), join(base, "index.tsx"), join(base, "index.js"),
    ];
    for (const c of cands) {
      if (existsSync(c) && statSync(c).isFile()) return relative(repoRoot, c);
    }
    return null; // unresolved relative
  }
  // Bare specifier: cross-package edge iff it names a workspace package.
  const seg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!;
  if (pkgNames.has(spec)) return `pkg:${spec}`;
  if (pkgNames.has(seg)) return `pkg:${seg}`;
  return null; // external dependency
}

/** Cheap tier: whole-repo (or git-changed) sweep → code/package nodes + depends_on edges. */
export function ingestRepo(store: GraphStore, repoPath: string, opts: { changedOnly?: boolean } = {}): IngestResult {
  const ts = new Date().toISOString();
  const pkgs = detectPackages(repoPath);
  for (const p of pkgs) {
    store.upsertNode({ id: `pkg:${p.name}`, kind: "package", name: p.name, attrs: { dir: relative(repoPath, p.dir) } });
  }
  const pkgNames = new Set(pkgs.map((p) => p.name));

  const files = opts.changedOnly
    ? changedFiles(repoPath)
    : walkCodeFiles(repoPath).map((f) => relative(repoPath, f));

  let edges = 0;
  for (const rel of files) {
    const abs = join(repoPath, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const facts = parseFile(abs, readFileSync(abs, "utf8"));
    store.upsertNode({
      id: rel,
      kind: "code",
      name: basename(rel),
      attrs: { language: facts.language, exports: facts.exports.length },
    });
    for (const imp of facts.imports) {
      const target = resolveImport(imp, rel, repoPath, pkgNames);
      if (target) {
        store.upsertEdge({ from: rel, to: target, kind: "depends_on", ts });
        edges++;
      }
    }
  }
  return { files: files.length, edges, packages: pkgs.length };
}

export interface MappingResult {
  mapped: number;
  escalated: number;
}

/**
 * Modify-existing mapping (decision #12): classify each code node → design concept via
 * `map.classifyFileToDesign`. High-confidence → realizes edge; low-confidence is reported
 * for a gate (the orchestrator opens it). Cardinality ≤255 → caller prefilters candidates.
 */
export async function inferMappings(store: GraphStore, runner: DecisionRunner): Promise<MappingResult> {
  const designIds = store.query({ kind: "design" }).map((n) => n.id);
  if (designIds.length === 0) return { mapped: 0, escalated: 0 };
  const candidates = [...designIds.slice(0, 254), "none"];
  const ts = new Date().toISOString();
  let mapped = 0;
  let escalated = 0;

  for (const code of store.query({ kind: "code" })) {
    const { result, escalation } = await runner.run({
      name: "map.classifyFileToDesign",
      state: { file: code.id, exports: code.attrs?.["exports"] },
      candidates,
    });
    if (result.value === "none") continue;
    if (escalation === "human") {
      escalated++;
      continue; // leave unmapped; orchestrator opens a gate
    }
    store.upsertEdge({
      from: code.id,
      to: String(result.value),
      kind: "realizes",
      confidence: result.confidence,
      provenance: "inferred",
      ts,
    });
    mapped++;
  }
  return { mapped, escalated };
}
