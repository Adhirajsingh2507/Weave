// D2 — where Weave finds its tools: its own devDependencies, then the pinned downloads in
// .tools/bin (scripts/tools.mjs), then PATH. The target repo never has to install anything.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Weave's own install (the folder holding its package.json), from dist/core/tools.js. */
export const WEAVE_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** The command to run for a tool: a local install when there is one, else the bare name. */
export function toolBin(name: string): string {
  for (const dir of [join(WEAVE_ROOT, "node_modules", ".bin"), join(WEAVE_ROOT, ".tools", "bin")]) {
    const path = join(dir, name);
    if (existsSync(path)) return path;
  }
  return name;
}
