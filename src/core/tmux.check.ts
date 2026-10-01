// D4.5 — agents in tmux windows, end to end with a stand-in `claude` that behaves like the real
// interactive one: it reads its settings, fires the SessionStart / UserPromptSubmit / Stop hooks,
// does the node's work, then waits on its terminal for the next message (bracketed paste or typed
// keys, submitted with Enter). Proven:
//   - every impl node runs in its own window of one tmux session, sandboxed, and passes;
//   - a failed first attempt is repaired by a message pasted into the same session;
//   - a message typed into a window mid-turn is waited for and counted as a human intervention;
//   - windows close when their nodes finish.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { GitHarness } from "./runtime.js";
import { TmuxClaudeExecutor, tmuxAvailable } from "./tmux.js";
import { WEAVE_ROOT } from "./tools.js";

if (!tmuxAvailable()) {
  assert.notEqual(process.env["WEAVE_REQUIRE_TOOLS"], "1", "tmux is required here");
  console.log("tmux check passed — NOT verified here: tmux is not installed");
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "weave-tmux-"));
const fake = join(dir, "claude");
// The stand-in agent. Hooks get the same JSON fields Claude Code sends.
writeFileSync(
  fake,
  `#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const { realise } = await import(${JSON.stringify(join(WEAVE_ROOT, "dist", "core", "testing.js"))});
const argv = process.argv.slice(2);
const settings = JSON.parse(readFileSync(argv[argv.indexOf("--settings") + 1], "utf8"));
const session = "sess-" + process.pid;
const hook = (name, extra = {}) => {
  const cmd = settings.hooks[name][0].hooks[0].command;
  execFileSync("sh", ["-c", cmd], { input: JSON.stringify({ hook_event_name: name, session_id: session, transcript_path: "/nonexistent", ...extra }) });
};
const first = argv.at(-1);
const write = (/You may change only: ([^\\n]*?)\\.(?:\\n|$)/.exec(first)?.[1] ?? "").split(", ").filter(Boolean);
const id = /<section id="([^"]+)"/.exec(first)?.[1] ?? "page";
const act = (inner) => realise({ contextPack: { taskId: "impl:" + id, goal: "", relevantNodeIds: [], relevantFiles: [], constraints: first.split("\\n"), previousFailures: [], permissions: { write, deny: [] } }, worktreeDir: process.cwd() }, inner);
const turn = async (prompt, work) => {
  hook("UserPromptSubmit", { prompt });
  work();
  if (id === "features" && prompt === first) await new Promise((r) => setTimeout(r, 4000)); // time for a human to type
  hook("Stop");
};
// Like the real CLI: raw keys from the start, and bracketed paste turned on, without which tmux
// sends a multi-line paste as separate lines.
process.stdin.setRawMode(true);
process.stdout.write("\\x1b[?2004h");
hook("SessionStart");
console.log("stand-in agent for " + id);
let attempts = 0;
let buf = "", pending = "", busy = turn(first, () => { attempts++; act(id === "hero" ? "<h1>hero</h1>" : undefined); }); // hero fails its first check
process.stdin.on("data", (d) => {
  buf += d.toString();
  for (;;) {
    if (buf.startsWith("\\x1b[200~")) {
      const end = buf.indexOf("\\x1b[201~");
      if (end < 0) return;
      pending += buf.slice(6, end);
      buf = buf.slice(end + 6);
    } else if (buf.length) {
      const c = buf[0];
      buf = buf.slice(1);
      if (c === "\\r") {
        const msg = pending;
        pending = "";
        if (msg) busy = busy.then(() => turn(msg, () => act()));
      } else if (c !== "\\x1b") pending += c;
    } else return;
  }
});
`,
);
chmodSync(fake, 0o755);

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const repo = join(dir, "repo");
execFileSync("mkdir", ["-p", repo]);
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

const session = `weave-check-${process.pid}`;
const executor = new TmuxClaudeExecutor({ session, bin: fake, turnTimeoutMs: 60_000 });
const engine = new Engine({ repoPath: repo, deps: { executor, makeHarness: (p) => new GitHarness(p), defaultPacks: [], concurrency: 3 } });
await engine.init("new");
const { runId } = await engine.run({ projectName: "Tmux", text: "page: home /\ncomponent: hero section\ncomponent: features section\ncomponent: cta section" });

const windows = (): string[] => {
  try {
    return execFileSync("tmux", ["list-windows", "-t", session, "-F", "#{window_name}"], { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return [];
  }
};
const seen = new Set<string>();
let typed = false;
// The "human": watches the windows and types into the features agent while it works.
const human = (async () => {
  for (let i = 0; i < 400; i++) {
    for (const w of windows()) seen.add(w);
    if (!typed && windows().includes("impl-features")) {
      await new Promise((r) => setTimeout(r, 800));
      execFileSync("tmux", ["send-keys", "-t", `${session}:impl-features`, "-l", "make the headline shorter"]);
      execFileSync("tmux", ["send-keys", "-t", `${session}:impl-features`, "Enter"]);
      typed = true;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
})();
try {
  await engine.resolveGate((await engine.listGates())[0]!.id, "approve");
  const gate = (await engine.listGates())[0];
  assert.equal(gate?.kind, "pre-release", JSON.stringify(gate));
  for (const id of ["impl:hero", "impl:features", "impl:cta", "impl:home"]) assert.equal((await engine.getExecGraph(runId)).find((n) => n.id === id)?.status, "complete", id);
  assert.ok(["impl-hero", "impl-features", "impl-cta"].every((w) => seen.has(w)), `one window per agent: saw ${[...seen].join(", ")}`);

  // The hero failed once and was repaired in the same session: one window, two prompts, one session id.
  const evidence = (await engine.report(runId)).nodeFailures;
  assert.ok(evidence.some((f) => f.nodeId === "impl:hero" && /<h1>/.test(f.detail)), "the first hero attempt failed its check");
  const metrics = await engine.metrics(runId);
  const { GraphStore } = await import("./store/graph-store.js");
  const typedRows = new GraphStore(join(repo, ".agent", "state.db")).evidenceFor({ runId }).filter((e) => e.kind === "intervention");
  assert.equal(metrics.typedInterventions, 1, `the typed message is one intervention: ${JSON.stringify(typedRows.map((r) => [r.node_id, r.detail]))}`);
  assert.equal(metrics.autonomous, false);
  assert.equal(windows().filter((w) => w.startsWith("impl-")).length, 0, "windows close when their nodes finish");
  console.log("tmux check passed (one window per agent, repair in the same session, a typed message counted as an intervention, windows closed)");
} finally {
  typed = true;
  void human;
  try {
    execFileSync("tmux", ["kill-session", "-t", session], { stdio: "ignore" });
  } catch {
    // already gone
  }
  rmSync(dir, { recursive: true, force: true });
}
process.exit(0);
