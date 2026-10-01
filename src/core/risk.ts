// V2.4 — risky-op classification of a node's diff (decision #28: risky ops are a default gate).
//
// Deterministic first: a dependency change, a migration, a deletion, a secret-shaped string or
// file, or blocked egress is a finding, and a finding always gates. The decision layer may add a
// gate on top (risk.classifyOperation); it can never remove one of these.

import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadPack } from "./packs/load.js";
import { globToRegExp } from "./sandbox.js";
import { BROWSER_BACKGROUND_HOSTS, hostAllowed } from "./egress.js";
import type { EgressRecord } from "./egress.js";

export interface RiskFinding {
  kind: "dependency" | "migration" | "deletion" | "secret" | "egress";
  detail: string;
}

export interface Change {
  status: "A" | "M" | "D" | "R";
  path: string;
}

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const DEP_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] as const;
const LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
const MIGRATION = [/(^|\/)migrations?\//i, /\.sql$/i, /(^|\/)schema\.prisma$/i];

/** Stage everything in a worktree and list what changed against HEAD. */
export function stagedChanges(worktreeDir: string): Change[] {
  git(["add", "-A"], worktreeDir);
  return git(["diff", "--cached", "--name-status", "--no-renames"], worktreeDir)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, path] = line.split("\t");
      return { status: (status?.[0] ?? "M") as Change["status"], path: path ?? "" };
    });
}

function depsOf(json: string): Map<string, string> {
  const deps = new Map<string, string>();
  try {
    const pkg = JSON.parse(json) as Record<string, Record<string, string> | undefined>;
    for (const field of DEP_FIELDS) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) deps.set(name, range);
    }
  } catch {
    // unparseable package.json is the build's problem, not a dependency finding
  }
  return deps;
}

function dependencyFindings(worktreeDir: string, changes: Change[]): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const pkg = changes.find((c) => c.path === "package.json");
  if (pkg) {
    let before = "";
    try {
      before = git(["show", "HEAD:package.json"], worktreeDir);
    } catch {
      // new package.json: every dependency is an addition
    }
    const after = pkg.status === "D" ? "" : readFileSync(join(worktreeDir, "package.json"), "utf8");
    const was = depsOf(before);
    const now = depsOf(after);
    for (const [name, range] of now) {
      if (!was.has(name)) findings.push({ kind: "dependency", detail: `adds dependency ${name}@${range}` });
      else if (was.get(name) !== range) findings.push({ kind: "dependency", detail: `changes ${name} ${was.get(name)} → ${range}` });
    }
    for (const name of was.keys()) {
      if (!now.has(name)) findings.push({ kind: "dependency", detail: `removes dependency ${name}` });
    }
  }
  const locks = changes.filter((c) => LOCKFILES.includes(c.path));
  if (locks.length && !findings.length) {
    findings.push({ kind: "dependency", detail: `lockfile changed without a package.json change: ${locks.map((c) => c.path).join(", ")}` });
  }
  return findings;
}

/** The patterns the web-security pack already trusts for secrets in source. */
function secretPatterns(): RegExp[] {
  try {
    const item = loadPack("web-security").items.find((i) => i.id === "sec.secrets.not-in-source");
    return ((item?.args?.["patterns"] as string[] | undefined) ?? []).map((p) => new RegExp(p, "i"));
  } catch {
    return [];
  }
}

export function classifyChanges(
  worktreeDir: string,
  changes: Change[],
  opts: { deny?: string[]; egress?: EgressRecord[] } = {},
): RiskFinding[] {
  const findings = dependencyFindings(worktreeDir, changes);

  const migrations = changes.filter((c) => c.status !== "D" && MIGRATION.some((re) => re.test(c.path)));
  if (migrations.length) findings.push({ kind: "migration", detail: `migration: ${migrations.map((c) => c.path).join(", ")}` });

  const deleted = changes.filter((c) => c.status === "D");
  if (deleted.length) findings.push({ kind: "deletion", detail: `deletes ${deleted.map((c) => c.path).slice(0, 10).join(", ")}` });

  const deny = (opts.deny ?? []).map(globToRegExp);
  const secretFiles = changes.filter((c) => c.status !== "D" && deny.some((re) => re.test(c.path)));
  if (secretFiles.length) {
    findings.push({ kind: "secret", detail: `writes a secret-shaped file: ${secretFiles.map((c) => c.path).join(", ")}` });
  }

  const patterns = secretPatterns();
  for (const c of changes) {
    if (c.status === "D" || secretFiles.includes(c)) continue;
    const abs = join(worktreeDir, c.path);
    try {
      if (statSync(abs).size > 512 * 1024) continue;
      const text = readFileSync(abs, "utf8");
      const hit = patterns.find((re) => re.test(text));
      if (hit) findings.push({ kind: "secret", detail: `secret-shaped content in ${c.path}` });
    } catch {
      // binary or vanished
    }
  }

  // Refused either way; a browser's own background calls are recorded, not a finding.
  const blocked = (opts.egress ?? []).filter((r) => !r.allowed && !hostAllowed(r.host, BROWSER_BACKGROUND_HOSTS));
  if (blocked.length) {
    findings.push({ kind: "egress", detail: `tried to reach hosts off the allowlist: ${blocked.map((r) => r.host).join(", ")}` });
  }
  return findings;
}

/** A bounded diff for the decision layer: enough to judge, never the whole repo. */
export function diffExcerpt(worktreeDir: string, maxChars = 8000): string {
  try {
    return git(["diff", "--cached", "--no-color", "--no-renames"], worktreeDir).slice(0, maxChars);
  } catch {
    return "";
  }
}
