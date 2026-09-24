// Local-first .agent/ layout (decision #3, #21). Files here + SQLite state.db (wired later).

import { mkdir, writeFile } from "node:fs/promises";
import { appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const AGENT_DIR = ".agent";

const SUBDIRS = [
  "project", // IR versions, design spec exports, architecture notes
  "policies", // permissions, quality, approval
  "policies/decisions", // typed decision schemas (catalog)
  "evidence", // screenshots, test-results, browser-traces, visual-reviews
  "artifacts", // manifests, generated specs
  "history", // execution-log.jsonl (append-only events + traces)
];

const AGENT_README = `# .agent/

Local-first state for Weave.

- state.db      SQLite: knowledge graph, execution graph, mapping edges, run state (wired later)
- project/      IR versions, design spec exports, architecture notes
- policies/     permissions, quality, approval, decisions/ (typed decision schemas)
- evidence/     screenshots, test-results, browser-traces, visual-reviews
- artifacts/    manifests, generated specs
- history/      execution-log.jsonl (append-only events + traces)
`;

/** Create the .agent/ tree under repoPath. Idempotent. Returns the .agent path. */
export async function initAgentDir(repoPath: string): Promise<string> {
  const base = join(repoPath, AGENT_DIR);
  for (const d of SUBDIRS) {
    await mkdir(join(base, d), { recursive: true });
  }
  // Ensure the event log exists (append-open then close via writeFile with 'a').
  await writeFile(join(base, "history", "execution-log.jsonl"), "", { flag: "a" });
  // Write the README only if absent.
  await writeFile(join(base, "README.md"), AGENT_README, { flag: "wx" }).catch(() => {});
  // Self-ignoring directory. The root .gitignore is itself an uncommitted change at the
  // start of a run, so the harness auto-stash takes it away and .agent/ stops being
  // ignored mid-run — which let `git add -A` commit engine state into the user's history.
  // A .gitignore inside .agent/ survives that, because it goes away with the directory.
  await writeFile(join(base, ".gitignore"), "*\n", { flag: "w" });

  // Root entry as well, so the directory reads as ignored to a human running git status.
  const giPath = join(repoPath, ".gitignore");
  const gi = existsSync(giPath) ? await readFile(giPath, "utf8") : "";
  if (!gi.split(/\r?\n/).includes(".agent/")) {
    await appendFile(giPath, `${gi && !gi.endsWith("\n") ? "\n" : ""}.agent/\n`);
  }
  return base;
}
