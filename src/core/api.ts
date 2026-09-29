// The headless core API surface (decision #19/#20): transport-agnostic
// commands / queries / events. v1 execution is coarse/autonomous-only:
// run() drives intake → plan → execute → loop, halting at a gate or completion.

import { join } from "node:path";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { EventLog } from "./events/index.js";
import { initAgentDir, AGENT_DIR } from "./state.js";
import { GraphStore } from "./store/graph-store.js";
import type { MappingFilter, NodeQuery } from "./store/graph-store.js";
import { compileBrief } from "./compiler.js";
import type { BriefInput } from "./compiler.js";
import { projectIR } from "./graph/project.js";
import { buildExecGraph } from "./plan.js";
import { runNode, executeAndVerify } from "./loop.js";
import type { AttemptOutcome, EvidenceRecord, Verifier, VerifyResult } from "./loop.js";
import { ClaudeCodeExecutor, GitHarness } from "./runtime.js";
import type { ContextPack, NodeExecutor } from "./runtime.js";
import { DeterministicVerifier } from "./verify.js";
import type { Deployer } from "./deploy.js";
import { TemplateScaffolder } from "./scaffold.js";
import type { Scaffolder } from "./scaffold.js";
import { loadStyle, styleBrief } from "./design/style.js";
import { mintCriteria, packsFor } from "./criteria.js";
import { loadPack, runPack } from "./packs/load.js";
import { buildSiteContext } from "./packs/context.js";
import { buildReport } from "./report.js";
import type { RunReport } from "./report.js";
import { projectMetrics, runMetrics } from "./metrics.js";
import type { ProjectMetrics, RunMetrics } from "./metrics.js";
import type { StyleGuide } from "./design/style.js";
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
  /** Creates the project before any agent runs (decision: template with command override). */
  scaffolder?: Scaffolder;
  /** Design guide slug used when a brief names no style. */
  defaultStyle?: string;
  /** Policy packs used when a brief names none; [] runs no packs. */
  defaultPacks?: string[];
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
  scaffolder: Scaffolder;
  defaultStyle?: string;
  defaultPacks?: string[];
}

export class Engine {
  #repoPath: string;
  #events: EventLog;
  #graph?: GraphStore;
  #deps: ResolvedDeps;
  #harness?: GitHarness;
  #styleCache?: { slug: string; guide: StyleGuide };

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
      scaffolder: d.scaffolder ?? new TemplateScaffolder(),
      defaultStyle: d.defaultStyle,
      defaultPacks: d.defaultPacks,
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
    const ir = compileBrief({
      defaultStyle: this.#deps.defaultStyle,
      ...(this.#deps.defaultPacks ? { defaultPacks: this.#deps.defaultPacks } : {}),
      ...(inputs ?? {}),
    });
    // Fail fast on an unknown style. Left to execute time it would surface after the
    // design gate, half way through a run, as a mid-flight crash.
    if (ir.meta.style) loadStyle(ir.meta.style);
    store.loadGraph(projectIR(ir));
    // The criteria pass runs before any implementation exists, so what "done" means is
    // authored independently of whatever the implementer later produces (decision #25).
    const criteria = mintCriteria(ir, ir.meta.style ? loadStyle(ir.meta.style) : undefined);
    store.loadGraph({ nodes: criteria.nodes, edges: criteria.edges });

    const unrealized = store.gaps().unrealizedDesign;
    const runId = `run-${Date.now()}`;
    store.createRun({ runId, status: "running", startedAt: new Date().toISOString(), budgetUsed: 0 });
    // The IR is canonical: persist it so a later process can scaffold and brief agents
    // without re-interpreting the input.
    const irDir = join(this.#repoPath, AGENT_DIR, "project");
    mkdirSync(irDir, { recursive: true });
    writeFileSync(join(irDir, `ir-${runId}.json`), `${JSON.stringify(ir, null, 2)}\n`, "utf8");
    for (const n of buildExecGraph(unrealized)) store.upsertExecNode(runId, n);
    await this.#events.emit({ type: "graph.generated", runId, data: { unrealized } });

    const gate = await this.#openGate(runId, "design-approval", `Review interpreted design (${unrealized.length} items)`, []);
    store.updateRun(runId, { status: "gated", cursor: gate.id });
    return { runId, status: "gated" };
  }

  async cancel(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    await this.#finishHarness(runId);
    store.updateRun(runId, { status: "cancelled", endedAt: new Date().toISOString() });
  }

  /** Resolve a human gate; approving a design-approval/blocking gate resumes execution. */
  async resolveGate(gateId: GateId, decision: GateDecision, notes?: string): Promise<void> {
    const store = this.#graphStore();
    const gate = store.getGate(gateId);
    if (!gate) throw new Error(`gate not found: ${gateId}`);
    if (gate.status !== "open") return;

    if (decision === "reject") {
      store.setGateStatus(gateId, "rejected", notes);
      // A rejected run is over: put the user back on their branch with their stash restored.
      await this.#finishHarness(gate.runId);
      store.updateRun(gate.runId, { status: "failed", endedAt: new Date().toISOString() });
      await this.#events.emit({ type: "approval.rejected", runId: gate.runId, data: { gate: gateId } });
      return;
    }

    store.setGateStatus(gateId, "approved", notes);
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
      await this.#finishHarness(gate.runId);
      store.updateRun(gate.runId, { status: ok ? "done" : "failed", endedAt: new Date().toISOString() });
      return;
    }
    // design-approval / low-confidence / risky-op → (re)enter execution.
    await this.#execute(gate.runId);
  }

  // ── Harness lifecycle ─────────────────────────────────────
  /**
   * The harness for executing a run: reuse the in-process one, re-attach to the branch
   * a previous process created, or cut a new working branch and persist its state.
   */
  async #harnessForExecution(runId: RunId): Promise<GitHarness> {
    if (this.#harness) return this.#harness;
    const store = this.#graphStore();
    const run = store.getRun(runId);
    const harness = this.#deps.makeHarness(this.#repoPath);
    if (run?.workingBranch && run.baseBranch) {
      harness.adopt({
        workingBranch: run.workingBranch,
        baseBranch: run.baseBranch,
        stashed: run.stashed ?? false,
      });
      await harness.attach();
    } else {
      await harness.createWorkingBranch(`weave/${runId}`);
      store.updateRun(runId, harness.state);
    }
    this.#harness = harness;
    return harness;
  }

  /**
   * The harness for finishing or cancelling a run. Never creates a branch — if the run
   * never started one there is nothing to restore.
   */
  async #harnessForCleanup(runId: RunId): Promise<GitHarness | undefined> {
    if (this.#harness) return this.#harness;
    const run = this.#graphStore().getRun(runId);
    if (!run?.workingBranch || !run.baseBranch) return undefined;
    const harness = this.#deps.makeHarness(this.#repoPath);
    harness.adopt({
      workingBranch: run.workingBranch,
      baseBranch: run.baseBranch,
      stashed: run.stashed ?? false,
    });
    return harness;
  }

  /** Restore the user's branch and stash, then record that there is nothing left to restore. */
  async #finishHarness(runId: RunId): Promise<void> {
    const harness = await this.#harnessForCleanup(runId);
    if (!harness) return;
    await harness.finish();
    this.#graphStore().updateRun(runId, { stashed: false });
    this.#harness = undefined;
  }

  // ── Execution (internal) ──────────────────────────────────
  /** The canonical IR for a run, persisted at intake. */
  #loadIR(runId: RunId): { meta: { projectName: string; style?: string } } | undefined {
    const path = join(this.#repoPath, AGENT_DIR, "project", `ir-${runId}.json`);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as { meta: { projectName: string; style?: string } };
    } catch {
      return undefined;
    }
  }

  /** Cached per slug, not per engine — two runs in one process can use different styles. */
  #styleFor(runId: RunId): StyleGuide | undefined {
    const slug = this.#loadIR(runId)?.meta.style ?? this.#deps.defaultStyle;
    if (!slug) return undefined;
    if (this.#styleCache?.slug !== slug) this.#styleCache = { slug, guide: loadStyle(slug) };
    return this.#styleCache.guide;
  }

  /** Context pack: what the node needs, including the style it must build to. */
  #contextPack(runId: RunId, node: ExecNode): ContextPack {
    const store = this.#graphStore();
    const style = this.#styleFor(runId);
    const notes = store.latestGateNotes(runId);
    const constraints: string[] = [];
    if (style) constraints.push(styleBrief(style));
    if (notes) constraints.push(`Reviewer notes from the last gate: ${notes}`);
    // A retry after a gate used to start blind. Seed it with what the earlier attempt
    // recorded, so the agent does not repeat the same failure.
    const prior = store.getExecNode(runId, node.id)?.evidence ?? [];
    const previousFailures = prior.length
      ? [`earlier attempt on this node recorded: ${prior.slice(-8).join("; ")}`]
      : [];
    return {
      taskId: node.id,
      goal: `build ${this.#goalFor(node)}`,
      relevantNodeIds: node.designNodeId ? [node.designNodeId] : [],
      relevantFiles: ["index.html", "styles/tokens.css", "styles/base.css"],
      constraints,
      previousFailures,
      permissions: { write: ["**"], deny: [".env", "**/.env", "**/*.pem", "**/secrets/**"] },
    };
  }

  /**
   * The fixed template step. Runs on the working branch before any agent, so impl nodes
   * inherit a project that builds — the thing greenfield runs never had.
   */
  async #runScaffold(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    const node = store.getExecNode(runId, "scaffold");
    if (!node || node.status === "complete" || node.status === "skipped") return;

    store.upsertExecNode(runId, { ...node, status: "running" });
    await this.#events.emit({ type: "node.started", runId, data: { node: node.id } });
    const sections = store
      .getExecGraph(runId)
      .filter((n) => n.kind === "impl" && n.designNodeId)
      .map((n) => n.designNodeId!);
    const result = await this.#deps.scaffolder.scaffold({
      repoPath: this.#repoPath,
      projectName: this.#loadIR(runId)?.meta.projectName ?? "project",
      style: this.#styleFor(runId),
      sections,
    });
    const commit = await this.#harness!.commitWorkingTree(`chore(scaffold): ${result.summary}`);
    store.recordEvidence(runId, [
      { nodeId: node.id, kind: "structural", ok: true, detail: `${this.#deps.scaffolder.name}: ${result.summary}` },
    ]);
    store.upsertExecNode(runId, {
      ...node,
      status: "complete",
      commit,
      evidence: [`scaffold:${this.#deps.scaffolder.name}`, ...result.files.slice(0, 40)],
      attempts: 1,
    });
    await this.#events.emit({
      type: "node.completed",
      runId,
      data: { node: node.id, commit, files: result.files.length },
    });
  }

  /**
   * Wraps the injected verifier with the node's own structural criterion, so "did the agent
   * actually build the thing it was asked for" is part of pass/fail rather than a note added
   * afterwards. Without it a no-op agent passes whenever the project still builds.
   */
  #verifierFor(node: ExecNode): Verifier {
    const base = this.#deps.verifier;
    const design = node.designNodeId;
    if (!design) return base;
    const store = this.#graphStore();
    const criteria = store
      .neighbors(`req:design:${design}`)
      .filter((e) => e.kind === "verifies" && e.to === `req:design:${design}`)
      .map((e) => store.getNode(e.from))
      .filter((c): c is KgNode => Boolean(c))
      .filter((c) => ["structural", "build"].includes(String(c.attrs?.["runner"] ?? "")));
    if (!criteria.length) return base;

    return {
      async verify(worktreeDir: string): Promise<VerifyResult> {
        const result = await base.verify(worktreeDir);
        const found = findDesignMarker(worktreeDir, design);
        const structural: EvidenceRecord[] = criteria.map((c) => ({
          kind: "structural" as const,
          criterionId: c.id,
          ok: Boolean(found),
          detail: found
            ? `${design} present in ${found}`
            : `nothing in the worktree realises "${design}"`,
        }));
        return { ok: result.ok && Boolean(found), evidence: [...result.evidence, ...structural] };
      },
    };
  }

  /**
   * Run the selected policy packs against the built site and record every outcome as evidence.
   * A failing blocking item opens a gate: Weave records and escalates, the human decides
   * whether to fix, waive or reject. Returns true when the run halted.
   */
  async #runPolicyPacks(runId: RunId): Promise<boolean> {
    const store = this.#graphStore();
    const node = store.getExecNode(runId, "code-qa");
    const ir = this.#loadIR(runId);
    const packs = ir ? packsFor(ir as never) : [];
    if (!packs.length) {
      if (node) store.upsertExecNode(runId, { ...node, status: "skipped" });
      return false;
    }

    if (node) store.upsertExecNode(runId, { ...node, status: "running" });
    await this.#events.emit({ type: "node.started", runId, data: { node: "code-qa", packs } });

    const ctx = buildSiteContext(this.#repoPath);
    const blocking: string[] = [];
    const summary = { pass: 0, fail: 0, "not-applicable": 0, unavailable: 0, human: 0 } as Record<string, number>;

    for (const name of packs) {
      const outcomes = runPack(loadPack(name), ctx);
      store.recordEvidence(
        runId,
        outcomes.map((o) => ({
          nodeId: "code-qa",
          criterionId: `crit:${o.itemId}`,
          kind: "pack" as const,
          ok: o.status === "pass",
          status: o.status,
          detail: `[${name}] ${o.detail}`,
          ...(o.artifactPath ? { artifactPath: o.artifactPath } : {}),
        })),
      );
      for (const o of outcomes) {
        summary[o.status] = (summary[o.status] ?? 0) + 1;
        if (o.status === "fail" && o.severity === "blocking") blocking.push(`${o.itemId}: ${o.detail}`);
      }
    }

    const detail = Object.entries(summary)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k}`)
      .join(", ");
    if (node) {
      store.upsertExecNode(runId, {
        ...node,
        status: "complete",
        evidence: [`packs:${packs.join("+")}`, detail],
        attempts: 1,
      });
    }
    await this.#events.emit({ type: "evaluation.completed", runId, data: { packs, summary } });

    // Approving a policy gate waives the items it named — only those. A new blocking failure
    // later in the same run still opens a gate.
    const waived = new Set(
      store
        .gatesForRun(runId)
        .filter((g) => g.kind === "policy" && g.status === "approved")
        .flatMap((g) => g.evidenceRefs.map((ref) => ref.split(": ")[0])),
    );
    const open = blocking.filter((b) => !waived.has(b.split(": ")[0]));
    if (!open.length) return false;

    // Every item goes on the gate, untruncated: the gate's list is what an approval waives.
    const gate = await this.#openGate(
      runId,
      "policy",
      `${open.length} blocking policy item(s) failed — fix, or approve to waive`,
      open,
    );
    store.updateRun(runId, { status: "gated", cursor: gate.id });
    return true;
  }

  /** Persist a node's typed evidence and its per-attempt outcomes. */
  #persistOutcome(
    runId: RunId,
    nodeId: NodeId,
    result: { evidence: EvidenceRecord[]; attemptLog: AttemptOutcome[] },
  ): void {
    const store = this.#graphStore();
    if (result.evidence.length) {
      store.recordEvidence(
        runId,
        result.evidence.map((e) => ({
          nodeId,
          kind: e.kind,
          ok: e.ok,
          detail: e.detail,
          ...(e.criterionId ? { criterionId: e.criterionId } : {}),
          ...(e.artifactPath ? { artifactPath: e.artifactPath } : {}),
        })),
      );
    }
    for (const a of result.attemptLog) {
      store.recordAttempt({
        run_id: runId,
        node_id: nodeId,
        attempt: a.attempt,
        executor: a.executor,
        exec_ok: a.execOk ? 1 : 0,
        verify_ok: a.verifyOk ? 1 : 0,
        started_at: a.startedAt,
        ended_at: a.endedAt,
      });
    }
  }

  /**
   * Record what a node actually built: code nodes plus by-construction mapping edges.
   * Without this the graph never learns anything and every re-run re-plans the same work.
   */
  #recordRealization(node: ExecNode, changedFiles: string[], commit?: string): void {
    if (!node.designNodeId) return;
    const store = this.#graphStore();
    const files = changedFiles.length
      ? changedFiles
      : commit
        ? this.#harness?.filesInCommit(commit) ?? []
        : [];
    const ts = new Date().toISOString();
    for (const file of files) {
      store.upsertNode({
        id: file,
        kind: "code",
        name: file.split("/").pop() ?? file,
        attrs: { commit },
      });
      store.upsertEdge({
        from: file,
        to: node.designNodeId,
        kind: "realizes",
        confidence: 1,
        provenance: "by_construction",
        ts,
      });
      store.upsertEdge({
        from: node.designNodeId,
        to: file,
        kind: "realized_by",
        confidence: 1,
        provenance: "by_construction",
        ts,
      });
    }
  }

  async #execute(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    await this.#harnessForExecution(runId);
    store.updateRun(runId, { status: "running" });
    await this.#runScaffold(runId);

    const pending = store.getExecGraph(runId).filter((n) => n.kind === "impl" && n.status !== "complete");
    const halted =
      this.#deps.concurrency > 1 && pending.length > 1
        ? await this.#executeParallel(runId, pending)
        : await this.#executeSequential(runId, pending);
    if (halted) return; // a gate was opened

    // Impl done. Per-node deterministic verify already gated code; sequential fast-forward
    // merges = integration.
    const integration = store.getExecNode(runId, "integration");
    if (integration) store.upsertExecNode(runId, { ...integration, status: "complete" });

    // Policy packs run against the built site, which only exists now.
    if (await this.#runPolicyPacks(runId)) return;
    for (const qa of ["browser-qa", "visual-qa"]) {
      const n = store.getExecNode(runId, qa);
      if (n) store.upsertExecNode(runId, { ...n, status: "skipped" });
    }
    const g = await this.#openGate(runId, "pre-release", "Build verified (browser/visual QA skipped — no worker) — review before release", []);
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
        const g = await this.#openGate(runId, "risky-op", `Budget ${this.#deps.budget} reached at ${node.id}`, []);
        store.updateRun(runId, { status: "gated", cursor: g.id });
        return true;
      }
      store.upsertExecNode(runId, { ...node, status: "running" });
      await this.#events.emit({ type: "node.started", runId, data: { node: node.id } });
      const r = await runNode({
        harness: this.#harness!,
        executor: this.#deps.executor,
        verifier: this.#verifierFor(node),
        node: { id: node.id, contextPack: this.#contextPack(runId, node) },
        retryCap: 3,
      });
      store.updateRun(runId, { budgetUsed: budgetUsed + r.attempts });
      if (r.status === "complete") {
        this.#recordRealization(node, r.changedFiles, r.commit);
        this.#persistOutcome(runId, node.id, r);
        store.upsertExecNode(runId, {
          ...node,
          status: "complete",
          commit: r.commit,
          evidence: summarise(r.evidence),
          attempts: r.attempts,
        });
        await this.#events.emit({ type: "node.completed", runId, data: { node: node.id, commit: r.commit } });
      } else {
        this.#persistOutcome(runId, node.id, r);
        store.upsertExecNode(runId, {
          ...node,
          status: "escalated",
          evidence: summarise(r.evidence),
          attempts: r.attempts,
        });
        const g = await this.#openGate(runId, "low-confidence", `${node.id} failed after retries`, summarise(r.evidence));
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
          verifier: this.#verifierFor(node),
          node: { id: node.id, contextPack: this.#contextPack(runId, node) },
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
        this.#persistOutcome(runId, node.id, res);
        return this.#haltParallel(runId, "low-confidence", `${node.id} failed after retries`, summarise(res.evidence), budgetUsed);
      }
      const commit = await harness.commitDetached(node.id, `feat(${node.id}): ${this.#goalFor(node)}`);
      const merged = await harness.integrateBranch(node.id);
      if (!merged.ok) {
        return this.#haltParallel(runId, "risky-op", `${node.id} merge conflict on integration`, summarise(res.evidence), budgetUsed);
      }
      this.#recordRealization(node, res.changedFiles, commit);
      this.#persistOutcome(runId, node.id, res);
      store.upsertExecNode(runId, {
        ...node,
        status: "complete",
        commit,
        evidence: summarise(res.evidence),
        attempts: res.attempts,
      });
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
    const g = await this.#openGate(runId, kind, summary, evidence);
    store.updateRun(runId, { status: "gated", cursor: g.id, budgetUsed });
    return true;
  }

  async #openGate(runId: RunId, kind: GateKind, summary: string, evidenceRefs: string[]): Promise<Gate> {
    // Sequenced so a second gate of the same kind cannot overwrite the first's record.
    const seq = this.#graphStore().countGates(runId, kind) + 1;
    const gate: Gate = {
      id: `${runId}:${kind}:${seq}`,
      runId,
      kind,
      status: "open",
      summary,
      evidenceRefs,
      openedAt: new Date().toISOString(),
    };
    this.#graphStore().openGate(gate);
    await this.#events.emit({ type: "approval.requested", runId, data: { gate: gate.id, kind } });
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

  /** Traceability: requirement → design → code → criteria → evidence → commit → approval. */
  async report(runId?: RunId): Promise<RunReport> {
    const store = this.#graphStore();
    const id = runId ?? store.latestRun()?.runId;
    if (!id) throw new Error("no runs yet");
    return buildReport(store, id);
  }

  async metrics(runId?: RunId): Promise<RunMetrics> {
    const store = this.#graphStore();
    const id = runId ?? store.latestRun()?.runId;
    if (!id) throw new Error("no runs yet");
    return runMetrics(store, id);
  }

  async projectMetrics(): Promise<ProjectMetrics> {
    return projectMetrics(this.#graphStore());
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

/** Short labels kept on the exec node for cheap reads; full records live in the evidence table. */
function summarise(evidence: EvidenceRecord[]): string[] {
  return evidence.map((e) => `${e.kind}:${e.ok ? "pass" : "fail"}${e.criterionId ? ` (${e.criterionId})` : ""}`);
}

/**
 * Look for a design element in a worktree: a file named after it, or markup carrying its id.
 * Shallow on purpose — agents write into the scaffolded project root, and walking a whole
 * tree per verification would cost more than it finds.
 */
function findDesignMarker(worktreeDir: string, designNodeId: string): string | undefined {
  const marker = `id="${designNodeId}"`;
  const skip = new Set(["node_modules", ".git", "dist", ".agent"]);
  const search = (dir: string, rel: string, depth: number): string | undefined => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return undefined;
    }
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (depth === 0 || skip.has(entry.name) || entry.name.startsWith(".")) continue;
        const hit = search(join(dir, entry.name), childRel, depth - 1);
        if (hit) return hit;
        continue;
      }
      if (entry.name.includes(designNodeId)) return childRel;
      if (!/\.(html?|jsx?|tsx?|md|css|svg)$/i.test(entry.name)) continue;
      try {
        const text = readFileSync(join(dir, entry.name), "utf8");
        if (!text.includes(marker)) continue;
        // The scaffold seeds a placeholder carrying the same id, so an element still flagged
        // as a placeholder does not count as built.
        const tag = new RegExp(`<[^>]*id=["']${designNodeId}["'][^>]*>`, "i").exec(text);
        if (!tag || !/data-placeholder/i.test(tag[0])) return childRel;
      } catch {
        // unreadable file, keep looking
      }
    }
    return undefined;
  };
  return search(worktreeDir, "", 2);
}
