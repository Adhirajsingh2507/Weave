// The headless core API surface (decision #19/#20): transport-agnostic
// commands / queries / events. v1 execution is coarse/autonomous-only:
// run() drives intake → plan → execute → loop, halting at a gate or completion.

import { join } from "node:path";
import { existsSync } from "node:fs";
import { EventLog } from "./events/index.js";
import { initAgentDir, AGENT_DIR } from "./state.js";
import { GraphStore } from "./store/graph-store.js";
import type { MappingFilter, NodeQuery } from "./store/graph-store.js";
import { compileBrief } from "./compiler.js";
import type { BriefInput } from "./compiler.js";
import { projectIR } from "./graph/project.js";
import { buildExecGraph } from "./plan.js";
import { runNode, executeAndVerify } from "./loop.js";
import type { Verifier } from "./loop.js";
import { ClaudeCodeExecutor, GitHarness } from "./runtime.js";
import type { ContextPack, NodeExecutor } from "./runtime.js";
import { DeterministicVerifier } from "./verify.js";
import type { Deployer } from "./deploy.js";
import { ClaudeDecision } from "./decision/providers.js";
import { DecisionRunner } from "./decision/runner.js";
import type { Decision } from "./decision/index.js";
import { ingestRepo, inferMappings } from "./ingest/sweep.js";
import type { IngestResult, MappingResult } from "./ingest/sweep.js";
import type { Edge, ExecNode, KgNode } from "./graph/types.js";
import type { Gaps } from "./graph/project.js";
import type {
  Gate,
  GateDecision,
  GateId,
  GateKind,
  NodeId,
  ProjectMode,
  RunHandle,
  RunId,
  RunRecord,
} from "./types.js";

export interface EngineDeps {
  executor?: NodeExecutor;
  verifier?: Verifier;
  decision?: Decision;
  makeHarness?: (repoPath: string) => GitHarness;
  /** Optional deployer — enables the gated RELEASE step (off by default, decision #5b). */
  deployer?: Deployer;
  /** Max impl attempts before halting to a gate (decision #27). */
  budget?: number;
  /** Parallel impl nodes per batch (1 = sequential; >1 = worktree parallelism). */
  concurrency?: number;
}

export interface EngineOptions {
  repoPath: string;
  deps?: EngineDeps;
}

interface ResolvedDeps {
  executor: NodeExecutor;
  verifier: Verifier;
  decision: Decision;
  makeHarness: (repoPath: string) => GitHarness;
  deployer?: Deployer;
  budget: number;
  concurrency: number;
}

export class Engine {
  #repoPath: string;
  #events: EventLog;
  #graph?: GraphStore;
  #deps: ResolvedDeps;
  #harness?: GitHarness;

  constructor(opts: EngineOptions) {
    this.#repoPath = opts.repoPath;
    this.#events = new EventLog(join(opts.repoPath, AGENT_DIR, "history", "execution-log.jsonl"));
    const d = opts.deps ?? {};
    this.#deps = {
      executor: d.executor ?? new ClaudeCodeExecutor(),
      verifier: d.verifier ?? new DeterministicVerifier(),
      decision: d.decision ?? new ClaudeDecision(),
      makeHarness: d.makeHarness ?? ((p) => new GitHarness(p)),
      deployer: d.deployer,
      budget: d.budget ?? 100,
      concurrency: d.concurrency ?? 1,
    };
  }

  #graphStore(): GraphStore {
    this.#graph ??= new GraphStore(join(this.#repoPath, AGENT_DIR, "state.db"));
    return this.#graph;
  }

  // ── Commands ──────────────────────────────────────────────
  async init(mode: ProjectMode): Promise<{ agentDir: string; mode: ProjectMode }> {
    const agentDir = await initAgentDir(this.#repoPath);
    this.#graphStore();
    await this.#events.emit({ type: "project.created", data: { mode } });
    return { agentDir, mode };
  }

  /** Autonomous driver: intake → plan → open design-approval gate (halt). */
  async run(inputs?: BriefInput): Promise<RunHandle> {
    const store = this.#graphStore();
    const ir = compileBrief(inputs ?? {});
    store.loadGraph(projectIR(ir));

    const unrealized = store.gaps().unrealizedDesign;
    const runId = `run-${Date.now()}`;
    store.createRun({ runId, status: "running", startedAt: new Date().toISOString(), budgetUsed: 0 });
    for (const n of buildExecGraph(unrealized)) store.upsertExecNode(runId, n);
    await this.#events.emit({ type: "graph.generated", runId, data: { unrealized } });

    const gate = this.#openGate(runId, "design-approval", `Review interpreted design (${unrealized.length} items)`, []);
    store.updateRun(runId, { status: "gated", cursor: gate.id });
    return { runId, status: "gated" };
  }

  async cancel(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    if (this.#harness) await this.#harness.finish();
    store.updateRun(runId, { status: "cancelled", endedAt: new Date().toISOString() });
  }

  /** Resolve a human gate; approving a design-approval/blocking gate resumes execution. */
  async resolveGate(gateId: GateId, decision: GateDecision, _notes?: string): Promise<void> {
    const store = this.#graphStore();
    const gate = store.getGate(gateId);
    if (!gate) throw new Error(`gate not found: ${gateId}`);
    if (gate.status !== "open") return;

    if (decision === "reject") {
      store.setGateStatus(gateId, "rejected");
      store.updateRun(gate.runId, { status: "failed", endedAt: new Date().toISOString() });
      await this.#events.emit({ type: "approval.rejected", runId: gate.runId, data: { gate: gateId } });
      return;
    }

    store.setGateStatus(gateId, "approved");
    await this.#events.emit({ type: "approval.granted", runId: gate.runId, data: { gate: gateId } });

    if (gate.kind === "pre-release") {
      let ok = true;
      const relNode = store.getExecNode(gate.runId, "release");
      if (this.#deps.deployer) {
        await this.#events.emit({ type: "deployment.started", runId: gate.runId });
        const res = await this.#deps.deployer.deploy(this.#repoPath); // working branch is checked out
        ok = res.ok;
        if (relNode) store.upsertExecNode(gate.runId, { ...relNode, status: res.ok ? "complete" : "failed" });
        await this.#events.emit({ type: "deployment.completed", runId: gate.runId, data: { ok: res.ok, url: res.url } });
      } else if (relNode) {
        store.upsertExecNode(gate.runId, { ...relNode, status: "skipped" });
      }
      if (this.#harness) await this.#harness.finish();
      store.updateRun(gate.runId, { status: ok ? "done" : "failed", endedAt: new Date().toISOString() });
      return;
    }
    // design-approval / low-confidence / risky-op → (re)enter execution.
    await this.#execute(gate.runId);
  }

  // ── Execution (internal) ──────────────────────────────────
  async #execute(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    if (!this.#harness) {
      this.#harness = this.#deps.makeHarness(this.#repoPath);
      await this.#harness.createWorkingBranch(`weave/${runId}`);
    }
    store.updateRun(runId, { status: "running" });

    const pending = store.getExecGraph(runId).filter((n) => n.kind === "impl" && n.status !== "complete");
    const halted =
      this.#deps.concurrency > 1 && pending.length > 1
        ? await this.#executeParallel(runId, pending)
        : await this.#executeSequential(runId, pending);
    if (halted) return; // a gate was opened

    // Impl done. Per-node deterministic verify already gated code; sequential fast-forward
    // merges = integration. Graph-level browser/visual QA need a browser worker + served URL
    // (not wired in the v1 default path) → mark skipped, not falsely complete.
    for (const qa of ["integration", "code-qa"]) {
      const n = store.getExecNode(runId, qa);
      if (n) store.upsertExecNode(runId, { ...n, status: "complete" });
    }
    for (const qa of ["browser-qa", "visual-qa"]) {
      const n = store.getExecNode(runId, qa);
      if (n) store.upsertExecNode(runId, { ...n, status: "skipped" });
    }
    const g = this.#openGate(runId, "pre-release", "Build verified (browser/visual QA skipped — no worker) — review before release", []);
    store.updateRun(runId, { status: "gated", cursor: g.id });
  }

  #goalFor(node: ExecNode): string {
    return this.#graphStore().getNode(node.designNodeId ?? "")?.name ?? node.designNodeId ?? node.id;
  }

  /** Sequential impl execution (each node ff-merges inline). Returns true if a gate opened. */
  async #executeSequential(runId: RunId, pending: ExecNode[]): Promise<boolean> {
    const store = this.#graphStore();
    for (const node of pending) {
      const budgetUsed = store.getRun(runId)?.budgetUsed ?? 0;
      if (budgetUsed >= this.#deps.budget) {
        const g = this.#openGate(runId, "risky-op", `Budget ${this.#deps.budget} reached at ${node.id}`, []);
        store.updateRun(runId, { status: "gated", cursor: g.id });
        return true;
      }
      store.upsertExecNode(runId, { ...node, status: "running" });
      await this.#events.emit({ type: "node.started", runId, data: { node: node.id } });
      const r = await runNode({
        harness: this.#harness!,
        executor: this.#deps.executor,
        verifier: this.#deps.verifier,
        node: { id: node.id, contextPack: makeContextPack(node, this.#goalFor(node)) },
        retryCap: 3,
      });
      store.updateRun(runId, { budgetUsed: budgetUsed + r.attempts });
      if (r.status === "complete") {
        store.upsertExecNode(runId, { ...node, status: "complete", commit: r.commit });
        await this.#events.emit({ type: "node.completed", runId, data: { node: node.id, commit: r.commit } });
      } else {
        store.upsertExecNode(runId, { ...node, status: "escalated" });
        const g = this.#openGate(runId, "low-confidence", `${node.id} failed after retries`, r.evidence);
        store.updateRun(runId, { status: "gated", cursor: g.id });
        await this.#events.emit({ type: "escalation", runId, data: { node: node.id, gate: g.id } });
        return true;
      }
    }
    return false;
  }

  /**
   * Parallel impl execution. git-touching ops are serialized (worktree add, commit, merge);
   * only the executor+verify run concurrently (each in its own worktree dir → safe).
   */
  async #executeParallel(runId: RunId, pending: ExecNode[]): Promise<boolean> {
    const store = this.#graphStore();
    const harness = this.#harness!;

    // 1. Create worktrees sequentially (git worktree add mutates shared .git).
    const dirs = new Map<string, string>();
    for (const node of pending) {
      store.upsertExecNode(runId, { ...node, status: "running" });
      await this.#events.emit({ type: "node.started", runId, data: { node: node.id } });
      dirs.set(node.id, await harness.worktreeForNode(node.id));
    }

    // 2. Execute + verify concurrently (dir-isolated).
    const results = await Promise.all(
      pending.map((node) =>
        executeAndVerify({
          executor: this.#deps.executor,
          verifier: this.#deps.verifier,
          node: { id: node.id, contextPack: makeContextPack(node, this.#goalFor(node)) },
          worktreeDir: dirs.get(node.id)!,
          retryCap: 3,
        }).then((res) => ({ node, res })),
      ),
    );

    // 3. Commit + integrate sequentially; gate on first escalation / merge conflict.
    let budgetUsed = store.getRun(runId)?.budgetUsed ?? 0;
    for (const { node, res } of results) {
      budgetUsed += res.attempts;
      if (!res.ok) {
        await this.#events.emit({ type: "escalation", runId, data: { node: node.id } });
        return this.#haltParallel(runId, "low-confidence", `${node.id} failed after retries`, res.evidence, budgetUsed);
      }
      const commit = await harness.commitDetached(node.id, `feat(${node.id}): ${this.#goalFor(node)}`);
      const merged = await harness.integrateBranch(node.id);
      if (!merged.ok) {
        return this.#haltParallel(runId, "risky-op", `${node.id} merge conflict on integration`, res.evidence, budgetUsed);
      }
      store.upsertExecNode(runId, { ...node, status: "complete", commit });
      await this.#events.emit({ type: "node.completed", runId, data: { node: node.id, commit } });
    }
    store.updateRun(runId, { budgetUsed });
    return false;
  }

  /** Halt a parallel batch: clean up dangling worktrees, reset unfinished nodes, open a gate. */
  async #haltParallel(
    runId: RunId,
    kind: GateKind,
    summary: string,
    evidence: string[],
    budgetUsed: number,
  ): Promise<boolean> {
    const store = this.#graphStore();
    await this.#harness!.discardAll(); // remove every still-open worktree + branch
    for (const n of store.getExecGraph(runId)) {
      if (n.kind === "impl" && n.status !== "complete") {
        store.upsertExecNode(runId, { ...n, status: "pending" }); // clean re-run on resume
      }
    }
    const g = this.#openGate(runId, kind, summary, evidence);
    store.updateRun(runId, { status: "gated", cursor: g.id, budgetUsed });
    return true;
  }

  #openGate(runId: RunId, kind: GateKind, summary: string, evidenceRefs: string[]): Gate {
    const gate: Gate = {
      id: `${runId}:${kind}`,
      runId,
      kind,
      status: "open",
      summary,
      evidenceRefs,
      openedAt: new Date().toISOString(),
    };
    this.#graphStore().openGate(gate);
    void this.#events.emit({ type: "approval.requested", runId, data: { gate: gate.id, kind } });
    return gate;
  }

  // ── Queries ───────────────────────────────────────────────
  async status(): Promise<{
    repoPath: string;
    initialized: boolean;
    latestRun?: RunRecord;
    openGates?: number;
    gaps?: { unrealizedDesign: number; orphanCode: number };
  }> {
    if (!existsSync(join(this.#repoPath, AGENT_DIR, "state.db"))) {
      return { repoPath: this.#repoPath, initialized: false };
    }
    const store = this.#graphStore();
    const g = store.gaps();
    return {
      repoPath: this.#repoPath,
      initialized: true,
      latestRun: store.latestRun(),
      openGates: store.listGates("open").length,
      gaps: { unrealizedDesign: g.unrealizedDesign.length, orphanCode: g.orphanCode.length },
    };
  }

  async listGates(): Promise<Gate[]> {
    return this.#graphStore().listGates("open");
  }

  async getGate(id: GateId): Promise<Gate | undefined> {
    return this.#graphStore().getGate(id);
  }

  async getNode(id: NodeId): Promise<KgNode | undefined> {
    return this.#graphStore().getNode(id);
  }

  async neighbors(id: NodeId): Promise<Edge[]> {
    return this.#graphStore().neighbors(id);
  }

  async query(q?: NodeQuery): Promise<KgNode[]> {
    return this.#graphStore().query(q);
  }

  async mappings(filter?: MappingFilter): Promise<Edge[]> {
    return this.#graphStore().mappings(filter);
  }

  async gaps(): Promise<Gaps> {
    return this.#graphStore().gaps();
  }

  // ── Ingestion (modify-existing repos) ─────────────────────
  /** Tiered cheap sweep → code graph (+ packages). `changedOnly` uses git for freshness. */
  async ingest(opts: { changedOnly?: boolean } = {}): Promise<IngestResult> {
    const res = ingestRepo(this.#graphStore(), this.#repoPath, opts);
    await this.#events.emit({ type: "graph.generated", data: { ingest: res } });
    return res;
  }

  /** Infer code→design mappings via the decision layer (needs a decision provider/creds). */
  async inferMappings(): Promise<MappingResult> {
    const runner = new DecisionRunner(this.#deps.decision, {
      corpusPath: join(this.#repoPath, AGENT_DIR, "evidence", "decisions.jsonl"),
    });
    return inferMappings(this.#graphStore(), runner);
  }

  async getRun(runId: RunId): Promise<RunRecord | undefined> {
    return this.#graphStore().getRun(runId);
  }

  async getExecGraph(runId?: RunId): Promise<ExecNode[]> {
    const store = this.#graphStore();
    const id = runId ?? store.latestRun()?.runId;
    return id ? store.getExecGraph(id) : [];
  }

  // ── Events ────────────────────────────────────────────────
  get events(): EventLog {
    return this.#events;
  }
}

function makeContextPack(node: ExecNode, goal: string): ContextPack {
  return {
    taskId: node.id,
    goal: `build ${goal}`,
    relevantNodeIds: node.designNodeId ? [node.designNodeId] : [],
    relevantFiles: [],
    constraints: [],
    previousFailures: [],
    permissions: { write: ["**"], deny: [".env", "**/.env", "**/*.pem", "**/secrets/**"] },
  };
}
