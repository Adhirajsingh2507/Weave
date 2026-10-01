// Node loop (decision #26/#27): discover → execute → verify → record → repair,
// bounded by a retry cap → escalate. Graph decides the route; the loop decides quality.

import { BROWSER_BACKGROUND_HOSTS, describeEgress, hostAllowed } from "./egress.js";
import type { EgressRecord } from "./egress.js";
import type { ContextPack, NodeExecutor } from "./runtime.js";
import type { GitHarness } from "./runtime.js";

/**
 * A typed piece of evidence. Replaces the string arrays that used to be assembled for a gate
 * and then discarded the moment a node passed.
 */
export interface EvidenceRecord {
  kind:
    | "build"
    | "test"
    | "structural"
    | "dom"
    | "visual"
    | "pack"
    | "deploy"
    | "agent"
    /** How the agent was confined for an attempt (V2.4). */
    | "sandbox"
    /** Which hosts the agent contacted (V2.4). */
    | "network"
    /** A risk finding or a decision-layer risk verdict on the node's diff (V2.4). */
    | "risk"
    /** A message the owner typed into the agent's session (D4.5) — a human intervention. */
    | "intervention";
  ok: boolean;
  detail: string;
  /** Criterion this proves, where the producer knows it. */
  criterionId?: string;
  /** Log or screenshot on disk under .agent/evidence. */
  artifactPath?: string;
}

export interface VerifyResult {
  ok: boolean;
  evidence: EvidenceRecord[];
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
  evidence: EvidenceRecord[];
  /** Per-attempt outcomes, so first-pass and repair rates are measured, not inferred. */
  attemptLog: AttemptOutcome[];
  /** Files the agent touched — the basis for design→code mapping edges. */
  changedFiles: string[];
}

export interface AttemptOutcome {
  attempt: number;
  executor: string;
  execOk: boolean;
  verifyOk: boolean;
  startedAt: string;
  endedAt: string;
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
  /** The user's repo, handed to the executor so a sandbox can hide its working tree. */
  repoPath?: string;
}): Promise<{
  ok: boolean;
  attempts: number;
  evidence: EvidenceRecord[];
  attemptLog: AttemptOutcome[];
  changedFiles: string[];
  /** Hosts contacted across every attempt. */
  egress: EgressRecord[];
}> {
  const { executor, verifier, node, worktreeDir } = opts;
  const retryCap = opts.retryCap ?? 3;
  const evidence: EvidenceRecord[] = [];
  const attemptLog: AttemptOutcome[] = [];
  const egress = new Map<string, EgressRecord>();
  let changedFiles: string[] = [];

  for (let attempt = 1; attempt <= retryCap; attempt++) {
    const startedAt = new Date().toISOString();
    const exec = await executor.run({
      contextPack: node.contextPack,
      worktreeDir,
      ...(opts.repoPath ? { repoPath: opts.repoPath } : {}),
    });
    changedFiles = exec.changedFiles;
    for (const ref of exec.evidenceRefs) {
      evidence.push({ kind: "agent", ok: exec.ok, detail: ref });
    }
    if (exec.sandbox) evidence.push({ kind: "sandbox", ok: true, detail: exec.sandbox.detail });
    if (exec.usage) {
      const u = exec.usage;
      evidence.push({ kind: "agent", ok: true, detail: `usage: input=${u.input} output=${u.output} cacheRead=${u.cacheRead} cacheWrite=${u.cacheWrite} turns=${u.turns}` });
    }
    for (const m of exec.interventions ?? []) evidence.push({ kind: "intervention", ok: true, detail: `owner typed: ${m.slice(0, 500)}` });
    if (exec.egress) {
      // A browser's own background calls are refused and listed, but they are not a failure.
      const blocked = exec.egress.filter((r) => !r.allowed && !hostAllowed(r.host, BROWSER_BACKGROUND_HOSTS));
      evidence.push({ kind: "network", ok: blocked.length === 0, detail: `egress: ${describeEgress(exec.egress)}` });
      for (const r of exec.egress) {
        const seen = egress.get(r.host);
        egress.set(r.host, seen ? { ...seen, count: seen.count + r.count } : { ...r });
      }
    }
    const verdict = await verifier.verify(worktreeDir);
    evidence.push(...normaliseEvidence(verdict));
    attemptLog.push({
      attempt,
      executor: executor.name,
      execOk: exec.ok,
      verifyOk: verdict.ok,
      startedAt,
      endedAt: new Date().toISOString(),
    });

    if (exec.ok && verdict.ok) {
      await finishNode(executor, node.contextPack.taskId, evidence);
      return { ok: true, attempts: attempt, evidence, attemptLog, changedFiles, egress: [...egress.values()] };
    }
    node.contextPack.previousFailures.push(
      `attempt ${attempt}: ${exec.ok ? normaliseEvidence(verdict).filter((e) => !e.ok).map((e) => e.detail).join("; ") || "verification failed" : exec.summary}`,
    );
  }
  await finishNode(executor, node.contextPack.taskId, evidence);
  return { ok: false, attempts: retryCap, evidence, attemptLog, changedFiles, egress: [...egress.values()] };
}

/** Release the node's session; messages the owner typed after the last turn still count. */
async function finishNode(executor: NodeExecutor, taskId: string, evidence: EvidenceRecord[]): Promise<void> {
  if (!executor.finish) return;
  const { interventions } = await executor.finish(taskId);
  for (const m of interventions) evidence.push({ kind: "intervention", ok: true, detail: `owner typed: ${m.slice(0, 500)}` });
}

/**
 * Verifier is a public seam and may be implemented in plain JavaScript, where nothing enforces
 * the record shape. Accept the v1 string form rather than failing deep in the store with a
 * SQL constraint error.
 */
function normaliseEvidence(verdict: VerifyResult): EvidenceRecord[] {
  const raw = (verdict.evidence ?? []) as Array<EvidenceRecord | string>;
  return raw.map((e) =>
    typeof e === "string" ? { kind: "test" as const, ok: verdict.ok, detail: e } : e,
  );
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
      attemptLog: res.attemptLog,
      changedFiles: res.changedFiles,
    };
  }
  await harness.discardNode(node.id);
  return {
    status: "escalated",
    attempts: res.attempts,
    evidence: res.evidence,
    attemptLog: res.attemptLog,
    changedFiles: res.changedFiles,
  };
}
