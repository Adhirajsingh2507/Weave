// Execution runtime: the NodeExecutor seam (agent adapter) + real GitHarness (sandbox).
// Decisions #5 (git worktree per node, sequential, working branch) and #30-#33.

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** What a node's agent gets — only what the node needs, not the whole project. */
export interface ContextPack {
  taskId: string;
  goal: string;
  relevantNodeIds: string[];
  relevantFiles: string[];
  constraints: string[];
  previousFailures: string[];
  /** FS baseline: write-scoped to repo, secrets denied. */
  permissions: { write: string[]; deny: string[] };
}

export interface ExecInput {
  contextPack: ContextPack;
  /** Isolated git worktree dir this node runs in. */
  worktreeDir: string;
}

export interface ExecResult {
  ok: boolean;
  summary: string;
  changedFiles: string[];
  evidenceRefs: string[];
}

/**
 * The single agent-adapter seam (decision #5: multi-runtime seam preserved, Claude Code
 * the only adapter). Additional runtimes implement this without touching the engine.
 */
export interface NodeExecutor {
  readonly name: string;
  run(input: ExecInput): Promise<ExecResult>;
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}
function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "-");
}

/**
 * Real Claude Code adapter — invokes the `claude` CLI headless in the worktree.
 * Requires the `claude` CLI on PATH + auth; not exercised in offline self-checks.
 */
export class ClaudeCodeExecutor implements NodeExecutor {
  readonly name = "claude-code";
  #bin: string;
  constructor(opts: { bin?: string } = {}) {
    this.#bin = opts.bin ?? "claude";
  }

  async run(input: ExecInput): Promise<ExecResult> {
    const prompt = buildPrompt(input.contextPack);
    let summary = "";
    try {
      summary = execFileSync(this.#bin, ["-p", prompt, "--permission-mode", "acceptEdits"], {
        cwd: input.worktreeDir,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }).trim();
    } catch (err) {
      return {
        ok: false,
        summary: err instanceof Error ? err.message : String(err),
        changedFiles: [],
        evidenceRefs: [],
      };
    }
    const changedFiles = git(["status", "--porcelain"], input.worktreeDir)
      .split("\n")
      .filter(Boolean)
      .map((l) => l.slice(3));
    return { ok: true, summary, changedFiles, evidenceRefs: [] };
  }
}

function buildPrompt(cp: ContextPack): string {
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

  /** Discard a failed node's worktree + branch = instant rollback. */
  async discardNode(nodeId: string): Promise<void> {
    const wt = this.#worktrees.get(nodeId);
    if (!wt) return;
    this.#removeWorktree(nodeId, wt);
  }

  /** Discard every still-open worktree + branch (cleanup when a parallel batch halts). */
  async discardAll(): Promise<void> {
    for (const [nodeId, wt] of [...this.#worktrees]) this.#removeWorktree(nodeId, wt);
  }

  /** Return to the base branch and restore an auto-stashed working tree. */
  async finish(): Promise<void> {
    if (this.#baseBranch) git(["checkout", this.#baseBranch], this.#repoPath);
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
