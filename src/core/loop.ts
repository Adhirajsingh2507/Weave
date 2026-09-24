// Node loop (decision #26/#27): discover → execute → verify → record → repair,
// bounded by a retry cap → escalate. Graph decides the route; the loop decides quality.

import type { ContextPack, NodeExecutor } from "./runtime.js";
import type { GitHarness } from "./runtime.js";

export interface VerifyResult {
  ok: boolean;
  evidence: string[];
}
/** Verifies a node's worktree. Deterministic checks (build/test) land in Phase 5. */
export interface Verifier {
  verify(worktreeDir: string): Promise<VerifyResult>;
}

export interface LoopNode {
  id: string;
  contextPack: ContextPack;
}
export interface NodeLoopResult {
  status: "complete" | "escalated";
  commit?: string;
  attempts: number;
  evidence: string[];
  /** Files the agent touched — the basis for design→code mapping edges. */
  changedFiles: string[];
}

export interface RunNodeOptions {
  harness: GitHarness;
  executor: NodeExecutor;
  verifier: Verifier;
  node: LoopNode;
  /** Repair attempts before escalating (default 3, decision #27). */
  retryCap?: number;
  /** false → commit to the node branch but don't merge (parallel path integrates later). */
  integrate?: boolean;
}

/**
 * The git-free core: execute → verify → repair in a given worktree dir, bounded by retryCap.
 * Safe to run concurrently across nodes (each has its own worktree dir).
 */
export async function executeAndVerify(opts: {
  executor: NodeExecutor;
  verifier: Verifier;
  node: LoopNode;
  worktreeDir: string;
  retryCap?: number;
}): Promise<{ ok: boolean; attempts: number; evidence: string[]; changedFiles: string[] }> {
  const { executor, verifier, node, worktreeDir } = opts;
  const retryCap = opts.retryCap ?? 3;
  const evidence: string[] = [];
  let changedFiles: string[] = [];
  for (let attempt = 1; attempt <= retryCap; attempt++) {
    const exec = await executor.run({ contextPack: node.contextPack, worktreeDir });
    evidence.push(...exec.evidenceRefs);
    changedFiles = exec.changedFiles;
    const verdict = await verifier.verify(worktreeDir);
    evidence.push(...verdict.evidence);
    if (exec.ok && verdict.ok) return { ok: true, attempts: attempt, evidence, changedFiles };
    node.contextPack.previousFailures.push(
      `attempt ${attempt}: ${exec.ok ? "verification failed" : exec.summary}`,
    );
  }
  return { ok: false, attempts: retryCap, evidence, changedFiles };
}

/** Run one node's loop in an isolated worktree; commit on pass, discard+escalate on exhaustion. */
export async function runNode(opts: RunNodeOptions): Promise<NodeLoopResult> {
  const { harness, executor, verifier, node } = opts;
  const dir = await harness.worktreeForNode(node.id);
  const res = await executeAndVerify({ executor, verifier, node, worktreeDir: dir, retryCap: opts.retryCap });

  if (res.ok) {
    const msg = `feat(${node.id}): ${node.contextPack.goal}`;
    const commit =
      opts.integrate === false
        ? await harness.commitDetached(node.id, msg)
        : await harness.commitNode(node.id, msg);
    return {
      status: "complete",
      commit,
      attempts: res.attempts,
      evidence: res.evidence,
      changedFiles: res.changedFiles,
    };
  }
  await harness.discardNode(node.id);
  return {
    status: "escalated",
    attempts: res.attempts,
    evidence: res.evidence,
    changedFiles: res.changedFiles,
  };
}
