// Execution runtime: the NodeExecutor seam (agent adapter) + real GitHarness (sandbox).
// Decisions #5 (git worktree per node, sequential, working branch) and #30-#33.

import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { DEFAULT_ALLOW_HOSTS, EgressProxy } from "./egress.js";
import type { EgressRecord } from "./egress.js";
import { detectSandbox, wrapCommand } from "./sandbox.js";
import { DECISION_MODEL } from "./decision/index.js";
import type { SandboxInfo } from "./sandbox.js";

const run = promisify(execFile);

/** What a node's agent gets — only what the node needs, not the whole project. */
export interface ContextPack {
  taskId: string;
  goal: string;
  relevantNodeIds: string[];
  relevantFiles: string[];
  constraints: string[];
  previousFailures: string[];
  /** FS baseline: write scope (the node's ownership), secrets denied, outbound hosts allowed. */
  permissions: { write: string[]; deny: string[]; allowHosts?: string[] };
}

export interface ExecInput {
  contextPack: ContextPack;
  /** Isolated git worktree dir this node runs in. */
  worktreeDir: string;
  /** The user's repo. A sandboxing executor hides its working tree from the agent. */
  repoPath?: string;
}

export interface ExecResult {
  ok: boolean;
  summary: string;
  changedFiles: string[];
  evidenceRefs: string[];
  /** Every host the agent contacted, from the executor's egress proxy. */
  egress?: EgressRecord[];
  /** How the agent was confined — recorded per node, never assumed. */
  sandbox?: SandboxInfo;
  /** Messages the owner typed into the agent's session (D4.5): each is a human intervention. */
  interventions?: string[];
  /** Tokens the agent's session used so far, where the executor can read them. */
  usage?: { input: number; output: number; cacheRead: number; cacheWrite: number; turns: number };
}

/** What an executor can do and how it is confined (V2.4). Recorded, not trusted blindly. */
export interface ExecutorCapabilities {
  canShell: boolean;
  canNetwork: boolean;
  /** True only when an OS or native sandbox actually confines the agent. */
  sandboxed: boolean;
}

/**
 * The single agent-adapter seam (decision #5: multi-runtime seam preserved, Claude Code
 * the only adapter). Additional runtimes implement this without touching the engine.
 */
export interface NodeExecutor {
  readonly name: string;
  readonly capabilities?: ExecutorCapabilities;
  run(input: ExecInput): Promise<ExecResult>;
  /** The node is over (passed or out of retries): release its session, report late interventions. */
  finish?(taskId: string): Promise<{ interventions: string[] }>;
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}
function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "-");
}

/**
 * The two ways to run (decision #75). Subscription: Claude Code on the `claude` login, no API key
 * anywhere. API: the same agents on ANTHROPIC_API_KEY, billed per token. One setting switches.
 */
export type WeaveMode = "subscription" | "api";
export function weaveMode(env: NodeJS.ProcessEnv = process.env): WeaveMode {
  return env["WEAVE_MODE"] === "api" ? "api" : "subscription";
}

/**
 * Every `claude` Weave starts runs without the user's own setup: no MCP servers (theirs can
 * deploy, push, or reach a local gateway the sandbox cannot see), no user settings, plugins or
 * hooks, no slash commands. The login still works. Measured 2026-09-30: 5.7s and one host
 * (api.anthropic.com) isolated, against 59s and ten hosts inheriting a typical setup.
 */
/** The tools an agent may use without asking, in either mode. Web tools are absent: egress is closed. */
export const AGENT_TOOLS = ["Bash", "Edit", "Write", "MultiEdit", "Read", "Glob", "Grep", "TodoWrite", "NotebookEdit"];

export const ISOLATED_CLAUDE_ARGS = [
  "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
  "--setting-sources", "",
  "--disable-slash-commands",
];

/**
 * Allow-list of environment variables an agent subprocess inherits. Everything else —
 * cloud credentials, database URLs, CI tokens, unrelated API keys — stays out of reach.
 * Enforcement lives here rather than in the prompt, which an agent can simply ignore.
 * ANTHROPIC_API_KEY passes only in API mode: in subscription mode a stray key in the shell
 * would silently move every agent onto per-token billing.
 */
export function scrubbedEnv(extra: string[] = [], mode: WeaveMode = weaveMode()): NodeJS.ProcessEnv {
  const keep = [
    "PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "LC_ALL", "TERM", "TMPDIR",
    ...(mode === "api" ? ["ANTHROPIC_API_KEY"] : []),
    "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME",
    ...extra,
  ];
  const env: NodeJS.ProcessEnv = {};
  for (const key of keep) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return env;
}

/**
 * Real Claude Code adapter — invokes the `claude` CLI headless in the worktree.
 * Requires the `claude` CLI on PATH + auth; not exercised in offline self-checks.
 */
export class ClaudeCodeExecutor implements NodeExecutor {
  readonly name = "claude-code";
  #bin: string;
  #timeoutMs: number;
  /** A minimal env keeps the user's other credentials out of the agent's process. */
  #env: NodeJS.ProcessEnv;
  #sandbox: "auto" | "off";
  #allowHosts: string[];

  constructor(
    opts: {
      bin?: string;
      timeoutMs?: number;
      env?: NodeJS.ProcessEnv;
      /** "auto" confines the agent with bubblewrap where the machine supports it. */
      sandbox?: "auto" | "off";
      /** Outbound hosts the agent may reach when the context pack names none. */
      allowHosts?: string[];
    } = {},
  ) {
    this.#bin = opts.bin ?? "claude";
    this.#timeoutMs = opts.timeoutMs ?? 10 * 60_000;
    this.#env = opts.env ?? scrubbedEnv();
    this.#sandbox = opts.sandbox ?? "auto";
    this.#allowHosts = opts.allowHosts ?? DEFAULT_ALLOW_HOSTS;
  }

  get capabilities(): ExecutorCapabilities {
    return { canShell: true, canNetwork: true, sandboxed: this.#sandboxInfo().backend !== "none" };
  }

  #sandboxInfo(): SandboxInfo {
    return this.#sandbox === "off" ? { backend: "none", detail: "unsandboxed: disabled by configuration" } : detectSandbox();
  }

  async run(input: ExecInput): Promise<ExecResult> {
    const cp = input.contextPack;
    const prompt = buildPrompt(cp);
    // Layer 1, native: Claude Code's own permission rules refuse the deny-listed paths.
    const settings = JSON.stringify({ permissions: { deny: nativeDenyRules(cp.permissions.deny) } });
    // The same model and tools as the tmux path: in -p mode, acceptEdits alone refuses Bash, so an
    // agent could not even run the build it is judged by.
    const args = ["-p", prompt, "--model", DECISION_MODEL, "--permission-mode", "acceptEdits", "--allowedTools", ...AGENT_TOOLS, "--settings", settings, ...ISOLATED_CLAUDE_ARGS];
    // Layer 2, OS: bubblewrap makes those paths (and home secrets) unreadable to anything the
    // agent spawns, including a shell that never consults the permission rules.
    const sandbox = this.#sandboxInfo();
    const command =
      sandbox.backend === "bwrap"
        ? wrapCommand(this.#bin, args, { worktreeDir: input.worktreeDir, repoPath: input.repoPath, deny: cp.permissions.deny })
        : { cmd: this.#bin, args };
    // Layer 3, network: every outbound host is recorded; off-list hosts are refused.
    const proxy = new EgressProxy(cp.permissions.allowHosts ?? this.#allowHosts);
    const proxyUrl = await proxy.start();
    const env = { ...this.#env, ...EgressProxy.env(proxyUrl), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" };

    let summary = "";
    try {
      // Async on purpose: a sync spawn blocks the event loop, which silently made
      // parallel node execution run one agent at a time.
      const { stdout } = await run(command.cmd, command.args, {
        cwd: input.worktreeDir,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        timeout: this.#timeoutMs,
        env,
      });
      summary = stdout.trim();
    } catch (err) {
      const e = err as { killed?: boolean; signal?: string; message?: string };
      const timedOut = e.killed === true || e.signal === "SIGTERM";
      return {
        ok: false,
        summary: timedOut
          ? `agent timed out after ${this.#timeoutMs}ms`
          : (e.message ?? String(err)),
        changedFiles: [],
        evidenceRefs: [],
        egress: proxy.records,
        sandbox,
      };
    } finally {
      await proxy.stop();
    }
    const changedFiles = git(["status", "--porcelain", "-uall"], input.worktreeDir)
      .split("\n")
      .filter(Boolean)
      .map((l) => l.slice(3));
    return { ok: true, summary, changedFiles, evidenceRefs: [], egress: proxy.records, sandbox };
  }
}

/** Context-pack deny globs as Claude Code permission rules (gitignore-style paths). */
export function nativeDenyRules(deny: string[]): string[] {
  return deny.flatMap((glob) => {
    const path = glob.startsWith("**") || glob.startsWith("/") ? glob : `./${glob}`;
    return [`Read(${path})`, `Edit(${path})`];
  });
}

export function buildPrompt(cp: ContextPack): string {
  const lines = [
    `Task: ${cp.goal}`,
    cp.constraints.length ? `Constraints:\n- ${cp.constraints.join("\n- ")}` : "",
    cp.relevantFiles.length ? `Relevant files: ${cp.relevantFiles.join(", ")}` : "",
    cp.previousFailures.length ? `Prior attempts failed:\n- ${cp.previousFailures.join("\n- ")}` : "",
    `Do not write outside this repo; do not read secrets (.env, credentials).`,
  ];
  return lines.filter(Boolean).join("\n\n");
}

/**
 * Git is the isolation + checkpoint + rollback mechanism (decision #33).
 * Concrete for now (git only); extract an interface when Docker/cloud tiers arrive.
 * Sequential model: worktree per node on a node branch off the working-branch tip;
 * commit → fast-forward the working branch; discard → drop the worktree + branch.
 */
export class GitHarness {
  #repoPath: string;
  #workingBranch = "";
  #baseBranch = "";
  #stashed = false;
  #worktrees = new Map<string, { dir: string; branch: string }>();

  constructor(repoPath: string) {
    this.#repoPath = repoPath;
  }

  get repoPath(): string {
    return this.#repoPath;
  }
  get workingBranch(): string {
    return this.#workingBranch;
  }

  /**
   * The branch state a later process needs to finish this run. Held in memory only
   * until persisted, which is why a crashed or separate process used to strand the
   * user on the working branch with their work still stashed.
   */
  get state(): { workingBranch: string; baseBranch: string; stashed: boolean } {
    return { workingBranch: this.#workingBranch, baseBranch: this.#baseBranch, stashed: this.#stashed };
  }

  /** Re-attach to a run's persisted branch state instead of recomputing it from HEAD. */
  adopt(state: { workingBranch: string; baseBranch: string; stashed: boolean }): void {
    this.#workingBranch = state.workingBranch;
    this.#baseBranch = state.baseBranch;
    this.#stashed = state.stashed;
  }

  /** Check out an already-created working branch, leaving the recorded base intact. */
  async attach(): Promise<void> {
    if (!this.#workingBranch) throw new Error("attach(): no working branch adopted");
    const head = git(["rev-parse", "--abbrev-ref", "HEAD"], this.#repoPath);
    if (head !== this.#workingBranch) git(["checkout", this.#workingBranch], this.#repoPath);
  }

  /**
   * Dedicated working branch off HEAD; auto-stash a dirty tree, restore on finish().
   * Idempotent: if the branch already exists (resume in a fresh process), attach to it.
   */
  async createWorkingBranch(name: string): Promise<string> {
    this.#baseBranch = git(["rev-parse", "--abbrev-ref", "HEAD"], this.#repoPath);
    if (this.#branchExists(name)) {
      git(["checkout", name], this.#repoPath);
    } else {
      const dirty = git(["status", "--porcelain"], this.#repoPath).length > 0;
      if (dirty) {
        git(["stash", "push", "-u", "-m", "weave-autostash"], this.#repoPath);
        this.#stashed = true;
      }
      git(["checkout", "-b", name], this.#repoPath);
    }
    this.#workingBranch = name;
    return name;
  }

  #branchExists(name: string): boolean {
    try {
      git(["rev-parse", "--verify", "--quiet", `refs/heads/${name}`], this.#repoPath);
      return true;
    } catch {
      return false;
    }
  }

  /** New worktree off the working-branch tip = a node's isolation unit. */
  async worktreeForNode(nodeId: string): Promise<string> {
    const branch = `weave/node/${sanitize(nodeId)}`;
    const dir = mkdtempSync(join(tmpdir(), `weave-wt-${sanitize(nodeId)}-`));
    git(["worktree", "add", "-b", branch, dir, this.#workingBranch], this.#repoPath);
    this.#worktrees.set(nodeId, { dir, branch });
    return dir;
  }

  /** Commit a node's work and fast-forward the working branch; returns the commit sha. */
  async commitNode(nodeId: string, message: string): Promise<string> {
    const wt = this.#worktrees.get(nodeId);
    if (!wt) throw new Error(`no worktree for node: ${nodeId}`);
    git(["add", "-A"], wt.dir);
    if (this.#hasStaged(wt.dir)) git(["commit", "-m", message], wt.dir);
    const sha = git(["rev-parse", "HEAD"], wt.dir);
    // Advance the working branch to include this node's commit (sequential → fast-forward).
    git(["merge", "--ff-only", wt.branch], this.#repoPath);
    this.#removeWorktree(nodeId, wt);
    return sha;
  }

  /** Files touched by a commit — the fallback when an executor reports no changed files. */
  filesInCommit(sha: string): string[] {
    try {
      return git(["show", "--name-only", "--pretty=format:", sha], this.#repoPath)
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Commit work made directly in the main working tree — the scaffold step. */
  async commitWorkingTree(message: string): Promise<string | undefined> {
    git(["add", "-A"], this.#repoPath);
    if (!this.#hasStaged(this.#repoPath)) return undefined;
    git(["commit", "-m", message], this.#repoPath);
    return git(["rev-parse", "HEAD"], this.#repoPath);
  }

  /** Commit a node's work to its branch WITHOUT merging or removing the worktree (parallel path). */
  async commitDetached(nodeId: string, message: string): Promise<string> {
    const wt = this.#worktrees.get(nodeId);
    if (!wt) throw new Error(`no worktree for node: ${nodeId}`);
    git(["add", "-A"], wt.dir);
    if (this.#hasStaged(wt.dir)) git(["commit", "-m", message], wt.dir);
    return git(["rev-parse", "HEAD"], wt.dir);
  }

  /** Merge a node's branch into the working branch, then remove its worktree. Reports conflicts. */
  async integrateBranch(nodeId: string): Promise<{ ok: boolean; conflict?: boolean }> {
    const wt = this.#worktrees.get(nodeId);
    if (!wt) return { ok: false };
    try {
      git(["merge", "--no-ff", "-m", `integrate ${nodeId}`, wt.branch], this.#repoPath);
    } catch {
      try {
        git(["merge", "--abort"], this.#repoPath);
      } catch {
        /* nothing to abort */
      }
      return { ok: false, conflict: true };
    }
    this.#removeWorktree(nodeId, wt);
    return { ok: true };
  }

  /**
   * Commit a node's work and keep its branch, but drop the worktree — the node is waiting on a
   * risky-op gate. The branch survives the process, so a later one can integrate it.
   */
  async parkNode(nodeId: string, message: string): Promise<string> {
    const sha = await this.commitDetached(nodeId, message);
    const wt = this.#worktrees.get(nodeId);
    if (wt) {
      git(["worktree", "remove", "--force", wt.dir], this.#repoPath);
      this.#worktrees.delete(nodeId);
    }
    return sha;
  }

  /** Merge a parked node's branch into the working branch after its gate was approved. */
  async integrateParked(nodeId: string): Promise<{ ok: boolean }> {
    const branch = `weave/node/${sanitize(nodeId)}`;
    try {
      git(["merge", "--no-ff", "-m", `integrate ${nodeId} (approved)`, branch], this.#repoPath);
    } catch {
      try {
        git(["merge", "--abort"], this.#repoPath);
      } catch {
        /* nothing to abort */
      }
      return { ok: false };
    }
    try {
      git(["branch", "-D", branch], this.#repoPath);
    } catch {
      /* already gone */
    }
    return { ok: true };
  }

  /** Discard a failed node's worktree + branch = instant rollback. */
  async discardNode(nodeId: string): Promise<void> {
    const wt = this.#worktrees.get(nodeId);
    if (!wt) return;
    this.#removeWorktree(nodeId, wt);
  }

  /** Delete every node branch without a live worktree — node branches are transient. */
  pruneNodeBranches(): void {
    for (const b of git(["branch", "--list", "weave/node/*", "--format=%(refname:short)"], this.#repoPath).split("\n")) {
      try {
        if (b.trim()) git(["branch", "-D", b.trim()], this.#repoPath);
      } catch {
        // still checked out in a live worktree — not ours to remove
      }
    }
  }

  /** Remove node worktrees and branches a dead process left behind, so its nodes can start again. */
  discardStale(): void {
    const list = git(["worktree", "list", "--porcelain"], this.#repoPath).split("\n\n");
    for (const block of list) {
      const dir = /^worktree (.+)$/m.exec(block)?.[1];
      const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1];
      if (!dir || !branch?.startsWith("weave/node/")) continue;
      try {
        git(["worktree", "remove", "--force", dir], this.#repoPath);
      } catch {
        // the folder is already gone; prune clears the record
      }
    }
    git(["worktree", "prune"], this.#repoPath);
    this.pruneNodeBranches();
  }

  /** Discard every still-open worktree + branch (cleanup when a parallel batch halts). */
  async discardAll(): Promise<void> {
    for (const [nodeId, wt] of [...this.#worktrees]) this.#removeWorktree(nodeId, wt);
  }

  /** Return to the base branch and restore an auto-stashed working tree. */
  async finish(): Promise<void> {
    if (this.#baseBranch) git(["checkout", this.#baseBranch], this.#repoPath);
    // A node branch still here was parked behind a gate the run never passed; the run is over.
    this.pruneNodeBranches();
    if (this.#stashed) {
      git(["stash", "pop"], this.#repoPath);
      this.#stashed = false;
    }
  }

  #hasStaged(dir: string): boolean {
    // `git diff --cached --quiet` exits non-zero (throws) when there ARE staged changes.
    try {
      git(["diff", "--cached", "--quiet"], dir);
      return false;
    } catch {
      return true;
    }
  }

  #removeWorktree(nodeId: string, wt: { dir: string; branch: string }): void {
    git(["worktree", "remove", "--force", wt.dir], this.#repoPath);
    try {
      git(["branch", "-D", wt.branch], this.#repoPath);
    } catch {
      // branch already merged/deleted — ignore
    }
    this.#worktrees.delete(nodeId);
  }
}
