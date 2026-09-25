// Loading and running packs.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { buildSiteContext, missingFacts } from "./context.js";
import type { SiteContext } from "./context.js";
import { RUNNERS } from "./runners.js";
import type { CheckOutcome, Pack } from "./types.js";

export const PACK_DIR = fileURLToPath(new URL("../../../packs", import.meta.url));

/** On unless a brief says otherwise: the two nobody should have to opt into. */
export const DEFAULT_PACKS = ["web-security", "a11y"];

export function listPacks(dir: string = PACK_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "pack.json")))
    .map((e) => e.name)
    .sort();
}

export function loadPack(name: string, dir: string = PACK_DIR): Pack {
  const path = join(dir, name, "pack.json");
  if (!existsSync(path)) {
    throw new Error(`unknown pack '${name}' — expected ${path}. Known packs: ${listPacks(dir).join(", ")}`);
  }
  const pack = JSON.parse(readFileSync(path, "utf8")) as Pack;
  const seen = new Set<string>();
  for (const item of pack.items) {
    if (seen.has(item.id)) throw new Error(`pack '${name}' has duplicate item id '${item.id}'`);
    seen.add(item.id);
    if (!RUNNERS[item.runner]) throw new Error(`pack '${name}' item '${item.id}' uses unknown runner '${item.runner}'`);
  }
  return pack;
}

/**
 * Evaluate a pack against a built site. Applicability is checked first, so an item that does
 * not apply is recorded with its reason rather than passing by default.
 */
export function runPack(pack: Pack, ctx: SiteContext): CheckOutcome[] {
  return pack.items.map((item) => {
    const missing = missingFacts(item.appliesWhen, ctx.facts);
    if (missing.length) {
      return {
        itemId: item.id,
        status: "not-applicable" as const,
        severity: item.severity,
        detail: `does not apply: this project has no ${missing.join(", ")}`,
      };
    }
    const runner = RUNNERS[item.runner]!;
    try {
      const result = runner(item, ctx);
      return { itemId: item.id, status: result.status, detail: result.detail, severity: item.severity };
    } catch (e) {
      return {
        itemId: item.id,
        status: "unavailable" as const,
        severity: item.severity,
        detail: `runner '${item.runner}' failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  });
}

export function runPacks(names: string[], repoPath: string, dir: string = PACK_DIR): Map<string, CheckOutcome[]> {
  const ctx = buildSiteContext(repoPath);
  const results = new Map<string, CheckOutcome[]>();
  for (const name of names) results.set(name, runPack(loadPack(name, dir), ctx));
  return results;
}
