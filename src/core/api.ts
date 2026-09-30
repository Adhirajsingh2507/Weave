// The headless core API surface (decision #19/#20): transport-agnostic
// commands / queries / events. v1 execution is coarse/autonomous-only:
// run() drives intake → plan → execute → loop, halting at a gate or completion.

import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { EventLog } from "./events/index.js";
import { initAgentDir, AGENT_DIR } from "./state.js";
import { GraphStore } from "./store/graph-store.js";
import type { MappingFilter, NodeQuery } from "./store/graph-store.js";
import { compileBrief } from "./compiler.js";
import { ClaudeVisionInterpreter, compileMultimodal, uncertain } from "./intake.js";
import type { MultimodalInput, VisionInterpreter } from "./intake.js";
import { projectIR } from "./graph/project.js";
import { buildExecGraph, isOwned, pageLayout, readyNodes } from "./plan.js";
import type { PageLayout } from "./plan.js";
import type { DesignIR } from "./ir/schema.js";
import { executeAndVerify } from "./loop.js";
import type { AttemptOutcome, EvidenceRecord, Verifier, VerifyResult } from "./loop.js";
import { ClaudeCodeExecutor, GitHarness } from "./runtime.js";
import type { ContextPack, NodeExecutor } from "./runtime.js";
import { DeterministicVerifier } from "./verify.js";
import { VercelDeployer } from "./deploy.js";
import type { Deployer, DeployResult } from "./deploy.js";
import { classifyChanges, diffExcerpt, stagedChanges } from "./risk.js";
import type { EgressRecord } from "./egress.js";
import { buildLiveContext } from "./packs/context.js";
import { TemplateScaffolder, assembleFragments } from "./scaffold.js";
import type { Scaffolder } from "./scaffold.js";
import { loadStyle, styleBrief } from "./design/style.js";
import { mintCriteria, packsFor } from "./criteria.js";
import { loadPack, runPack } from "./packs/load.js";
import { buildSiteContext } from "./packs/context.js";
import { buildReport } from "./report.js";
import type { RunReport } from "./report.js";
import { renderExplorer } from "./explorer.js";
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
  /** Checks run on the assembled working tree by the integration node (default: build + check). */
  integrationVerifier?: Verifier;
  /**
   * Decision provider that judges every node diff (risk.classifyOperation) on top of the
   * deterministic rules, and fills the calibration corpus. Absent: deterministic rules only.
   * The CLI and MCP server set it when ANTHROPIC_API_KEY is present.
   */
  riskDecision?: Decision;
  /** Outbound hosts agents may reach; the executor's default when absent. */
  allowHosts?: string[];
  /** Reads screenshots at intake (V2.6). Claude vision when credentials exist. */
  vision?: VisionInterpreter;
  /** Normalises read fields with confidence (interpret.normalizeField). Absent: exact-match only. */
  intakeDecision?: Decision;
}

/** Paths no agent may read, enforced by the sandbox and flagged by the risk rules. */
export const DENY_PATHS = [".env", "**/.env", "**/*.pem", "**/secrets/**"];

/**
 * What the CLI and MCP adapters configure from the environment: the decision layer judges node
 * diffs when ANTHROPIC_API_KEY is set, and WEAVE_DEPLOY=vercel makes pre-release approval deploy.
 */
export function adapterDeps(env: NodeJS.ProcessEnv = process.env): EngineDeps {
  return {
    ...(env["ANTHROPIC_API_KEY"]
      ? { riskDecision: new ClaudeDecision(), vision: new ClaudeVisionInterpreter(), intakeDecision: new ClaudeDecision() }
      : {}),
    ...(env["WEAVE_DEPLOY"] === "vercel" ? { deployer: new VercelDeployer({ prod: env["WEAVE_DEPLOY_PROD"] === "1" }) } : {}),
  };
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
  integrationVerifier: Verifier;
  riskDecision?: Decision;
  allowHosts?: string[];
  vision?: VisionInterpreter;
  intakeDecision?: Decision;
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
      integrationVerifier: d.integrationVerifier ?? new DeterministicVerifier(),
      riskDecision: d.riskDecision,
      allowHosts: d.allowHosts,
      vision: d.vision,
      intakeDecision: d.intakeDecision,
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

  /**
   * Autonomous driver: intake → plan → open the intake gate (halt). Screenshots and a URL go
   * through the multimodal compiler; uncertain readings turn the design gate into a
   * low-confidence gate that names each one, rather than being built on silently.
   */
  async run(inputs?: MultimodalInput): Promise<RunHandle> {
    const store = this.#graphStore();
    const brief: MultimodalInput = {
      defaultStyle: this.#deps.defaultStyle,
      ...(this.#deps.defaultPacks ? { defaultPacks: this.#deps.defaultPacks } : {}),
      ...(inputs ?? {}),
    };
    const ir =
      brief.screenshots?.length || brief.url
        ? await compileMultimodal(brief, {
            ...(this.#deps.vision ? { vision: this.#deps.vision } : {}),
            ...(this.#deps.intakeDecision ? { decision: this.#deps.intakeDecision } : {}),
            corpusPath: join(this.#repoPath, AGENT_DIR, "evidence", "decisions.jsonl"),
          })
        : compileBrief(brief);
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
    for (const n of buildExecGraph(unrealized, ir)) store.upsertExecNode(runId, n);
    await this.#events.emit({ type: "graph.generated", runId, data: { unrealized } });

    const unsure = uncertain(ir);
    const gate = unsure.length
      ? await this.#openGate(
          runId,
          "low-confidence",
          `Review interpreted design (${unrealized.length} items) — ${unsure.length} reading(s) need confirming`,
          unsure.map(
            (i) =>
              `${i.field}: read "${i.raw}" as ${i.value} (confidence ${i.confidence.toFixed(2)})` +
              `${i.alternatives?.length ? `; alternatives ${i.alternatives.join(", ")}` : ""} — approve, or correct it in the notes`,
          ),
        )
      : await this.#openGate(runId, "design-approval", `Review interpreted design (${unrealized.length} items)`, []);
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
        // The working branch is checked out; the deployer's secrets live only in its own child env.
        const commit = this.#head();
        const res = await this.#deps.deployer.deploy(this.#repoPath, { commit });
        ok = res.ok;
        await this.#recordRelease(gate.runId, res, commit);
        if (relNode) store.upsertExecNode(gate.runId, { ...relNode, status: res.ok ? "complete" : "failed", ...(commit ? { commit } : {}) });
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

  #head(): string | undefined {
    try {
      return execFileSync("git", ["rev-parse", "HEAD"], { cwd: this.#repoPath, encoding: "utf8" }).trim();
    } catch {
      return undefined;
    }
  }

  /**
   * Deployment evidence — URL, commit, log — and the post-deploy checks: the packs' page and
   * header items re-run against the live URL, because a site that passed on disk can still ship
   * without its headers. A live failure is recorded, not rolled back; rollback is a later step.
   */
  async #recordRelease(runId: RunId, res: DeployResult, commit?: string): Promise<void> {
    const store = this.#graphStore();
    const dir = join(this.#repoPath, AGENT_DIR, "evidence");
    mkdirSync(dir, { recursive: true });
    const logPath = join(dir, `deploy-${Date.now()}.log`);
    writeFileSync(logPath, res.log ?? "", "utf8");
    const short = commit?.slice(0, 7) ?? "the working branch";
    store.recordEvidence(runId, [
      {
        nodeId: "release",
        kind: "deploy",
        ok: res.ok,
        detail: res.ok
          ? `deployed ${short} to ${res.url ?? "(the deployer reported no URL)"}`
          : `deploy of ${short} failed: ${(res.log ?? "").trim().split("\n").slice(-2).join(" ").slice(0, 300)}`,
        artifactPath: logPath,
      },
    ]);
    if (!res.ok || !res.url) return;

    const ir = this.#loadIR(runId);
    const packs = ir ? packsFor(ir) : [];
    if (!packs.length) return;
    const live = await buildLiveContext(res.url, this.#layoutFor(runId).map((p) => p.file));
    if ("error" in live) {
      store.recordEvidence(runId, [
        { nodeId: "release", kind: "deploy", ok: false, status: "unavailable", detail: `post-deploy checks could not run: ${live.error}` },
      ]);
      return;
    }
    // Only items that mean something against a live page; the rest were decided on disk.
    let passed = 0;
    let failed = 0;
    for (const name of packs) {
      const pack = loadPack(name);
      const liveIds = new Set(pack.items.filter((i) => ["html-assert", "http-header"].includes(i.runner)).map((i) => i.id));
      const outcomes = runPack(pack, live).filter((o) => liveIds.has(o.itemId) && o.status !== "not-applicable");
      passed += outcomes.filter((o) => o.status === "pass").length;
      failed += outcomes.filter((o) => o.status === "fail").length;
      store.recordEvidence(
        runId,
        outcomes.map((o) => ({
          nodeId: "release",
          criterionId: `crit:${o.itemId}`,
          kind: "pack" as const,
          ok: o.status === "pass",
          status: o.status,
          detail: `[live ${res.url}] ${o.detail}`,
        })),
      );
    }
    store.recordEvidence(runId, [
      { nodeId: "release", kind: "deploy", ok: failed === 0, detail: `post-deploy checks against ${res.url}: ${passed} passed, ${failed} failed` },
    ]);
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
  #loadIR(runId: RunId): DesignIR | undefined {
    const path = join(this.#repoPath, AGENT_DIR, "project", `ir-${runId}.json`);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as DesignIR;
    } catch {
      return undefined;
    }
  }

  /**
   * This run's pages and the slots it will fill: only components being built now get a slot,
   * and only pages being built now get the marker their page node removes. With no pages in the
   * IR, every component slots into index.html.
   */
  #layoutFor(runId: RunId): PageLayout[] {
    const ir = this.#loadIR(runId);
    const building = new Set(
      this.#graphStore()
        .getExecGraph(runId)
        .filter((n) => n.kind === "impl" && n.designNodeId)
        .map((n) => n.designNodeId!),
    );
    const assets = new Set(ir?.assets.map((a) => a.id) ?? []);
    const layout = ir ? pageLayout(ir) : [];
    if (!layout.length) {
      const sections = [...building].filter((id) => !assets.has(id));
      return [{ id: "", name: "", route: "/", file: "index.html", sections }];
    }
    return layout.map((p) => ({
      ...p,
      id: building.has(p.id) ? p.id : "",
      sections: p.sections.filter((s) => building.has(s)),
    }));
  }

  /** Whether this run's project was created by the template, so the fragment contract holds. */
  #hasContract(runId: RunId): boolean {
    return (this.#graphStore().getExecNode(runId, "scaffold")?.evidence ?? []).includes("contract:fragments");
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
    if (node.owns) constraints.push(ownershipBrief(node));
    const shared = ["styles/tokens.css", "styles/base.css"];
    return {
      taskId: node.id,
      goal: `build ${this.#goalFor(node)}`,
      relevantNodeIds: node.designNodeId ? [node.designNodeId] : [],
      relevantFiles: node.owns
        ? [...node.owns.filter((o) => !o.endsWith("/")), ...shared]
        : ["index.html", ...shared],
      constraints,
      previousFailures,
      permissions: {
        write: node.owns ?? ["**"],
        deny: DENY_PATHS,
        ...(this.#deps.allowHosts ? { allowHosts: this.#deps.allowHosts } : {}),
      },
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
    const layout = this.#layoutFor(runId);
    const result = await this.#deps.scaffolder.scaffold({
      repoPath: this.#repoPath,
      projectName: this.#loadIR(runId)?.meta.projectName ?? "project",
      style: this.#styleFor(runId),
      // Custom scaffolders keep receiving every slot as `sections`; `pages` adds the layout.
      sections: layout.flatMap((p) => p.sections),
      ...(layout[0]?.id || layout.length > 1 ? { pages: layout } : {}),
    });
    const commit = await this.#harness!.commitWorkingTree(`chore(scaffold): ${result.summary}`);
    const evidence: Parameters<GraphStore["recordEvidence"]>[1] = [
      { nodeId: node.id, kind: "structural", ok: true, detail: `${this.#deps.scaffolder.name}: ${result.summary}` },
    ];
    // Ownership only means something inside the template's layout. In a project the template
    // did not create, nodes are unrestricted — and the record says so rather than pretending.
    if (!result.contract) {
      for (const n of store.getExecGraph(runId).filter((x) => x.kind === "impl" && x.owns)) {
        const { owns: _dropped, ...rest } = n;
        store.upsertExecNode(runId, rest);
      }
      evidence.push({
        nodeId: node.id,
        kind: "structural",
        ok: true,
        detail: "file ownership not enforced: the project layout is not the template's",
      });
    }
    store.recordEvidence(runId, evidence);
    store.upsertExecNode(runId, {
      ...node,
      status: "complete",
      commit,
      evidence: [
        `scaffold:${this.#deps.scaffolder.name}`,
        ...(result.contract ? ["contract:fragments"] : []),
        ...result.files.slice(0, 40),
      ],
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
    const owns = node.owns;
    const store = this.#graphStore();
    const criteria = design
      ? store
          .neighbors(`req:design:${design}`)
          .filter((e) => e.kind === "verifies" && e.to === `req:design:${design}`)
          .map((e) => store.getNode(e.from))
          .filter((c): c is KgNode => Boolean(c))
          .filter((c) => ["structural", "build"].includes(String(c.attrs?.["runner"] ?? "")))
      : [];
    if (!criteria.length && !owns) return base;

    return {
      async verify(worktreeDir: string): Promise<VerifyResult> {
        const result = await base.verify(worktreeDir);
        const evidence = [...result.evidence];
        let ok = result.ok;

        if (design && criteria.length) {
          const found = findDesignMarker(worktreeDir, design);
          ok &&= Boolean(found);
          for (const c of criteria) {
            evidence.push({
              kind: "structural",
              criterionId: c.id,
              ok: Boolean(found),
              detail: found ? `${design} present in ${found}` : `nothing in the worktree realises "${design}"`,
            });
          }
        }

        // Ownership: deterministic, and catches a whole class of agent overreach — the node
        // that "helpfully" rewrites the shared page is how parallel branches conflict.
        if (owns) {
          const changed = changedPaths(worktreeDir);
          const outside = changed.filter((p) => !isOwned(p, owns));
          ok &&= outside.length === 0;
          evidence.push({
            kind: "structural",
            ok: outside.length === 0,
            detail: outside.length
              ? `changed files outside its ownership: ${outside.join(", ")} (may change only ${owns.join(", ")})`
              : `${changed.length} changed file(s), all within its ownership`,
          });
        }
        return { ok, evidence };
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

    // One bounded repair before a human is asked: the failures become the brief. It runs once
    // per run — a second failure goes to the gate, not into a loop.
    if (this.#hasContract(runId) && !store.getExecNode(runId, "repair:policy")) {
      if (await this.#repairPolicy(runId, packs, open)) {
        const integration = store.getExecNode(runId, "integration");
        if (integration) store.upsertExecNode(runId, { ...integration, status: "pending" });
        if (await this.#runIntegration(runId)) return true;
        return this.#runPolicyPacks(runId);
      }
    }

    // Every item goes on the gate, untruncated: the gate's list is what an approval waives.
    const repair = store.getExecNode(runId, "repair:policy");
    const gate = await this.#openGate(
      runId,
      "policy",
      `${open.length} blocking policy item(s) failed${repair ? " after an automatic repair" : ""} — fix, or approve to waive`,
      open,
    );
    store.updateRun(runId, { status: "gated", cursor: gate.id });
    return true;
  }

  /**
   * The repair loop for whole-site policy failures. Per-node checks cannot see them — the
   * markup is only wrong once the pieces meet — so a dedicated node gets the failures as its
   * brief, owns the fragments and pages, and passes only when those exact items pass on its own
   * worktree. Returns true when the fix integrated.
   */
  async #repairPolicy(runId: RunId, packs: string[], failures: string[]): Promise<boolean> {
    const store = this.#graphStore();
    const harness = this.#harness!;
    const layout = this.#layoutFor(runId);
    const owns = [...layout.map((p) => p.file), "sections/", "styles/sections/", "styles/pages/"];
    const failingIds = new Set(failures.map((f) => f.split(": ")[0]!));
    const requirements = packs
      .flatMap((name) => loadPack(name).items)
      .filter((i) => failingIds.has(i.id))
      .map((i) => `${i.id}: ${i.requirement}`);
    const node: ExecNode = { id: "repair:policy", kind: "repair", status: "running", owns };
    store.upsertExecNode(runId, node);
    await this.#events.emit({ type: "repair.started", runId, data: { node: node.id, items: [...failingIds] } });

    const pack: ContextPack = {
      taskId: node.id,
      goal: "fix the blocking policy failures on the assembled site",
      relevantNodeIds: [],
      relevantFiles: [...layout.map((p) => p.file), "sections/"],
      constraints: [
        ...requirements,
        "Sections are assembled into pages from sections/<id>.html between weave:fragment markers, " +
          "so fix a section in its fragment file; edit a page file only for markup outside those markers.",
        `You may change only: ${owns.join(", ")}.`,
      ],
      previousFailures: failures.map((f) => `policy: ${f}`),
      permissions: { write: owns, deny: DENY_PATHS, ...(this.#deps.allowHosts ? { allowHosts: this.#deps.allowHosts } : {}) },
    };
    const base = this.#verifierFor(node);
    const verifier: Verifier = {
      async verify(dir: string): Promise<VerifyResult> {
        const result = await base.verify(dir);
        // Judge the fix the way the site will be judged: assembled, against the same items.
        assembleFragments(dir, layout);
        const ctx = buildSiteContext(dir);
        const still = packs
          .flatMap((name) => runPack(loadPack(name), ctx))
          .filter((o) => failingIds.has(o.itemId) && o.status === "fail");
        return {
          ok: result.ok && still.length === 0,
          evidence: [
            ...result.evidence,
            {
              kind: "pack",
              ok: still.length === 0,
              detail: still.length
                ? `still failing: ${still.map((o) => `${o.itemId} (${o.detail})`).join("; ")}`
                : `fixed: ${[...failingIds].join(", ")}`,
            },
          ],
        };
      },
    };

    const dir = await harness.worktreeForNode(node.id);
    const res = await executeAndVerify({
      executor: this.#deps.executor,
      verifier,
      node: { id: node.id, contextPack: pack },
      worktreeDir: dir,
      retryCap: 2,
      repoPath: this.#repoPath,
    });
    let ok = res.ok;
    if (ok) {
      const risk = await this.#assessRisk(node, dir, res.egress);
      res.evidence.push(...risk.evidence);
      ok = !risk.gate;
    }
    let commit: string | undefined;
    if (ok) {
      commit = await harness.commitDetached(node.id, "fix(policy): repair blocking policy failures");
      ok = (await harness.integrateBranch(node.id)).ok;
    }
    if (!ok) await harness.discardNode(node.id);
    const attempts = this.#persistOutcome(runId, node.id, res);
    const used = store.getRun(runId)?.budgetUsed ?? 0;
    store.updateRun(runId, { budgetUsed: used + res.attempts });
    store.upsertExecNode(runId, {
      ...node,
      status: ok ? "complete" : "escalated",
      ...(commit && ok ? { commit } : {}),
      evidence: summarise(res.evidence),
      attempts,
    });
    await this.#events.emit({ type: ok ? "repair.completed" : "failure.detected", runId, data: { node: node.id } });
    return ok;
  }

  /**
   * Persist a node's typed evidence and its per-attempt outcomes. Attempts are numbered after
   * any the node already has in this run, so a retry after a gate or a conflict extends the
   * trail instead of overwriting it. Returns the node's total attempts.
   */
  #persistOutcome(
    runId: RunId,
    nodeId: NodeId,
    result: { evidence: EvidenceRecord[]; attemptLog: AttemptOutcome[] },
  ): number {
    const store = this.#graphStore();
    const offset = store
      .attemptsFor(runId)
      .filter((a) => a.node_id === nodeId)
      .reduce((max, a) => Math.max(max, a.attempt), 0);
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
        attempt: offset + a.attempt,
        executor: a.executor,
        exec_ok: a.execOk ? 1 : 0,
        verify_ok: a.verifyOk ? 1 : 0,
        started_at: a.startedAt,
        ended_at: a.endedAt,
      });
    }
    return offset + result.attemptLog.length;
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
    await this.#integrateApproved(runId);

    // Topological scheduler: each batch is the ready frontier of the DAG, capped at the
    // configured concurrency. A page never starts before its sections.
    for (;;) {
      const graph = store.getExecGraph(runId);
      const ready = readyNodes(graph);
      if (!ready.length) {
        const waiting = graph.filter((n) => n.kind === "impl" && !["complete", "skipped"].includes(n.status));
        if (!waiting.length) break;
        const g = await this.#openGate(
          runId,
          "low-confidence",
          `no runnable node: ${waiting.map((n) => n.id).join(", ")} wait on dependencies that cannot complete`,
          waiting.map((n) => `${n.id} depends on ${(n.dependsOn ?? []).join(", ")}`),
        );
        store.updateRun(runId, { status: "gated", cursor: g.id });
        return;
      }
      const budgetUsed = store.getRun(runId)?.budgetUsed ?? 0;
      if (budgetUsed >= this.#deps.budget) {
        const g = await this.#openGate(runId, "risky-op", `Budget ${this.#deps.budget} reached before ${ready[0]!.id}`, []);
        store.updateRun(runId, { status: "gated", cursor: g.id });
        return;
      }
      const batch = ready.slice(0, this.#deps.concurrency);
      await this.#events.emit({ type: "node.ready", runId, data: { batch: batch.map((n) => n.id) } });
      if (await this.#executeBatch(runId, batch)) return; // a gate was opened
    }

    if (await this.#runIntegration(runId)) return;

    // Policy packs run against the built site, which only exists now.
    if (await this.#runPolicyPacks(runId)) return;
    for (const qa of ["browser-qa", "visual-qa"]) {
      const n = store.getExecNode(runId, qa);
      if (n) store.upsertExecNode(runId, { ...n, status: "skipped" });
    }
    const g = await this.#openGate(runId, "pre-release", "Build verified (browser/visual QA skipped — no worker) — review before release", []);
    store.updateRun(runId, { status: "gated", cursor: g.id });
  }

  /**
   * The integration node earns its name: assemble every fragment into its page, commit, and run
   * the shared checks on the whole site. Per-node verification cannot catch what only exists
   * once the pieces meet — two sections that each pass alone can still break the page together.
   * Returns true when the run halted at a gate.
   */
  async #runIntegration(runId: RunId): Promise<boolean> {
    const store = this.#graphStore();
    const node = store.getExecNode(runId, "integration");
    if (!node || node.status === "complete") return false;
    store.upsertExecNode(runId, { ...node, status: "running" });
    await this.#events.emit({ type: "node.started", runId, data: { node: node.id } });

    const evidence: EvidenceRecord[] = [];
    let ok = true;
    let commit: string | undefined;
    if (this.#hasContract(runId)) {
      const layout = this.#layoutFor(runId);
      const res = assembleFragments(this.#repoPath, layout);
      ok = res.missing.length === 0;
      evidence.push({
        kind: "structural",
        ok,
        detail: ok
          ? `assembled ${res.assembled.length} fragment(s)${res.files.length ? ` into ${res.files.join(", ")}` : ""}`
          : `no fragment for: ${res.missing.join(", ")}`,
      });
      commit = await this.#harness!.commitWorkingTree(`chore(integration): assemble ${res.assembled.length} section(s)`);
    }
    const verdict = await this.#deps.integrationVerifier.verify(this.#repoPath);
    evidence.push(...verdict.evidence);
    ok &&= verdict.ok;

    store.recordEvidence(
      runId,
      evidence.map((e) => ({
        nodeId: node.id,
        kind: e.kind,
        ok: e.ok,
        detail: e.detail,
        ...(e.criterionId ? { criterionId: e.criterionId } : {}),
        ...(e.artifactPath ? { artifactPath: e.artifactPath } : {}),
      })),
    );
    store.upsertExecNode(runId, {
      ...node,
      status: ok ? "complete" : "escalated",
      ...(commit ? { commit } : {}),
      evidence: summarise(evidence),
      attempts: (node.attempts ?? 0) + 1,
    });
    await this.#events.emit({ type: ok ? "node.completed" : "failure.detected", runId, data: { node: node.id } });
    if (ok) return false;

    const failures = evidence.filter((e) => !e.ok).map((e) => e.detail);
    const g = await this.#openGate(runId, "low-confidence", `integration failed: ${failures[0] ?? "shared checks failed"}`, failures);
    store.updateRun(runId, { status: "gated", cursor: g.id });
    return true;
  }

  #goalFor(node: ExecNode): string {
    return this.#graphStore().getNode(node.designNodeId ?? "")?.name ?? node.designNodeId ?? node.id;
  }

  /**
   * A risky-op gate was approved: merge every node parked behind it. One whose branch no longer
   * merges cleanly goes back to pending and re-runs on the current tip.
   */
  async #integrateApproved(runId: RunId): Promise<void> {
    const store = this.#graphStore();
    for (const node of store.getExecGraph(runId).filter((n) => n.kind === "impl" && n.status === "blocked")) {
      const merged = await this.#harness!.integrateParked(node.id);
      if (!merged.ok) {
        store.recordEvidence(runId, [
          { nodeId: node.id, kind: "structural", ok: false, detail: `approved change no longer merges cleanly; re-running ${node.id} on the current tip` },
        ]);
        store.upsertExecNode(runId, { ...node, status: "pending" });
        continue;
      }
      this.#recordRealization(node, [], node.commit);
      store.upsertExecNode(runId, { ...node, status: "complete" });
      await this.#events.emit({ type: "node.completed", runId, data: { node: node.id, commit: node.commit, approved: true } });
    }
  }

  /**
   * Deterministic risk rules on a node's diff, then — when a provider is configured — the
   * decision layer's verdict. A rule finding always gates; the decision layer can add a gate,
   * never remove one. Every verdict lands in the decision corpus.
   */
  async #assessRisk(
    node: ExecNode,
    dir: string,
    egress: EgressRecord[],
  ): Promise<{ gate: boolean; reasons: string[]; evidence: EvidenceRecord[] }> {
    const changes = stagedChanges(dir);
    const findings = classifyChanges(dir, changes, { deny: DENY_PATHS, egress });
    const reasons = findings.map((f) => `${node.id}: ${f.detail}`);
    const evidence: EvidenceRecord[] = findings.map((f) => ({ kind: "risk", ok: false, detail: `${f.kind}: ${f.detail}` }));
    let gate = findings.length > 0;

    if (this.#deps.riskDecision && changes.length) {
      const runner = new DecisionRunner(this.#deps.riskDecision, {
        corpusPath: join(this.#repoPath, AGENT_DIR, "evidence", "decisions.jsonl"),
      });
      try {
        const { result, escalation } = await runner.run<unknown, string>({
          name: "risk.classifyOperation",
          state: { node: node.id, changes, findings, diff: diffExcerpt(dir) },
          candidates: ["safe", "risky"],
        });
        // No separate second-tier classifier exists yet, so "llm" keeps the verdict and only
        // low confidence ("human") escalates on its own.
        const judged = result.value === "risky" || escalation === "human";
        evidence.push({
          kind: "risk",
          ok: !judged,
          detail: `decision layer: ${String(result.value)} at confidence ${result.confidence} (${escalation})`,
        });
        if (judged && !gate) reasons.push(`${node.id}: decision layer judged the change ${String(result.value)} at confidence ${result.confidence}`);
        gate ||= judged;
      } catch (e) {
        evidence.push({ kind: "risk", ok: true, detail: `decision layer unavailable: ${e instanceof Error ? e.message : String(e)}` });
      }
    }
    if (!findings.length) evidence.push({ kind: "risk", ok: true, detail: `no risky operation in ${changes.length} change(s)` });
    return { gate, reasons, evidence };
  }

  /**
   * One batch from the DAG's ready frontier. git-touching ops are serialized (worktree add,
   * commit, merge); only the executor+verify run concurrently, each in its own worktree.
   * A batch of one is the sequential case — same path, so both get the same guarantees.
   */
  async #executeBatch(runId: RunId, pending: ExecNode[]): Promise<boolean> {
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
          repoPath: this.#repoPath,
        }).then((res) => ({ node, res })),
      ),
    );

    // 3. Assess, commit and integrate sequentially; gate on the first escalation or unresolved
    //    conflict, and park risky nodes behind one risky-op gate for the whole batch.
    let budgetUsed = store.getRun(runId)?.budgetUsed ?? 0;
    const parked: string[] = [];
    const park = async (node: ExecNode, res: { evidence: EvidenceRecord[]; attemptLog: AttemptOutcome[] }, reasons: string[]): Promise<void> => {
      const commit = await harness.parkNode(node.id, `feat(${node.id}): ${this.#goalFor(node)}`);
      const attempts = this.#persistOutcome(runId, node.id, res);
      store.upsertExecNode(runId, { ...node, status: "blocked", commit, evidence: summarise(res.evidence), attempts });
      parked.push(...reasons);
    };
    for (const { node, res: first } of results) {
      let res = first;
      budgetUsed += res.attempts;
      if (!res.ok) {
        await this.#events.emit({ type: "escalation", runId, data: { node: node.id } });
        this.#persistOutcome(runId, node.id, res);
        return this.#haltParallel(runId, "low-confidence", `${node.id} failed after retries`, summarise(res.evidence), budgetUsed, node.id);
      }
      let risk = await this.#assessRisk(node, dirs.get(node.id)!, res.egress);
      res.evidence.push(...risk.evidence);
      if (risk.gate) {
        await park(node, res, risk.reasons);
        continue;
      }
      let commit = await harness.commitDetached(node.id, `feat(${node.id}): ${this.#goalFor(node)}`);
      let merged = await harness.integrateBranch(node.id);
      if (!merged.ok) {
        // The work verified; it collides with what integrated first. Rebasing cannot resolve a
        // textual conflict a merge could not, so re-run the node once on the new tip instead,
        // and involve a human only if that fails too.
        this.#persistOutcome(runId, node.id, {
          evidence: [
            ...res.evidence,
            { kind: "structural", ok: false, detail: `merge conflict integrating ${node.id}; re-running on the new tip` },
          ],
          attemptLog: res.attemptLog,
        });
        await this.#events.emit({ type: "repair.started", runId, data: { node: node.id, reason: "merge conflict" } });
        await harness.discardNode(node.id);
        const pack = this.#contextPack(runId, node);
        pack.previousFailures.push("your earlier change conflicted with work another node integrated first; apply yours on top of the current files");
        const dir = await harness.worktreeForNode(node.id);
        res = await executeAndVerify({
          executor: this.#deps.executor,
          verifier: this.#verifierFor(node),
          node: { id: node.id, contextPack: pack },
          worktreeDir: dir,
          retryCap: 3,
          repoPath: this.#repoPath,
        });
        budgetUsed += res.attempts;
        if (res.ok) {
          risk = await this.#assessRisk(node, dir, res.egress);
          res.evidence.push(...risk.evidence);
          if (risk.gate) {
            await park(node, res, risk.reasons);
            continue;
          }
          commit = await harness.commitDetached(node.id, `feat(${node.id}): ${this.#goalFor(node)}`);
          merged = await harness.integrateBranch(node.id);
        }
        if (!res.ok || !merged.ok) {
          this.#persistOutcome(runId, node.id, res);
          const why = res.ok ? "merge conflict again after re-running on the new tip" : "failed after re-running on the new tip";
          return this.#haltParallel(runId, "risky-op", `${node.id} ${why}`, summarise(res.evidence), budgetUsed, node.id);
        }
      }
      this.#recordRealization(node, res.changedFiles, commit);
      const attempts = this.#persistOutcome(runId, node.id, res);
      store.upsertExecNode(runId, {
        ...node,
        status: "complete",
        commit,
        evidence: summarise(res.evidence),
        attempts,
      });
      await this.#events.emit({ type: "node.completed", runId, data: { node: node.id, commit } });
    }
    store.updateRun(runId, { budgetUsed });
    if (!parked.length) return false;

    // The work is committed on its own branch but not integrated: approving merges it,
    // rejecting ends the run and the branch goes with it.
    const g = await this.#openGate(
      runId,
      "risky-op",
      `${parked.length} risky change(s) held for review — approve to integrate, reject to discard`,
      parked,
    );
    store.updateRun(runId, { status: "gated", cursor: g.id });
    return true;
  }

  /**
   * Halt a batch: clean up dangling worktrees and parked branches, mark the failing node
   * escalated and reset the rest, open a gate. Nodes parked in this batch are reset too — their
   * risk is re-assessed when they re-run, so no change is ever integrated without its own review.
   */
  async #haltParallel(
    runId: RunId,
    kind: GateKind,
    summary: string,
    evidence: string[],
    budgetUsed: number,
    failing?: NodeId,
  ): Promise<boolean> {
    const store = this.#graphStore();
    await this.#harness!.discardAll(); // remove every still-open worktree + branch
    this.#harness!.pruneNodeBranches();
    for (const n of store.getExecGraph(runId)) {
      if (n.kind === "impl" && n.status !== "complete") {
        const { commit: _parked, ...rest } = n;
        // The failing node is escalated; the rest re-run cleanly on resume.
        store.upsertExecNode(runId, { ...rest, status: n.id === failing ? "escalated" : "pending" });
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

  /**
   * Open gates of one run — the latest by default. Across every run only when asked: an old run
   * left gated used to sit first in the list, so "approve the first gate" hit the wrong run.
   */
  async listGates(opts: { runId?: RunId; all?: boolean } = {}): Promise<Gate[]> {
    const store = this.#graphStore();
    if (opts.all) return store.listGates("open");
    const runId = opts.runId ?? store.latestRun()?.runId;
    return runId ? store.gatesForRun(runId).filter((g) => g.status === "open") : [];
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

  /** The explorer: the whole run as one self-contained HTML file. */
  async reportHtml(runId?: RunId): Promise<string> {
    const report = await this.report(runId);
    const name = this.#loadIR(report.runId)?.meta.projectName;
    return renderExplorer(report, { ...(name ? { title: name } : {}), generatedAt: new Date().toISOString() });
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

/** Every path a worktree changed, untracked files listed individually. */
function changedPaths(worktreeDir: string): string[] {
  const out = execFileSync("git", ["status", "--porcelain", "-uall"], { cwd: worktreeDir, encoding: "utf8" });
  return out
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => line.slice(3).split(" -> "))
    .map((p) => p.replace(/^"|"$/g, ""));
}

/** What the agent is told about the contract its ownership check enforces. */
function ownershipBrief(node: ExecNode): string {
  const owns = node.owns ?? [];
  const id = node.designNodeId ?? node.id;
  if (owns.some((o) => o.startsWith("sections/"))) {
    return (
      `Write this component as one complete <section id="${id}" data-design-node="${id}"> element in ` +
      `sections/${id}.html; put its styles in styles/sections/${id}.css if it needs any. Integration places ` +
      `the section into its page, so do not edit any page, styles/tokens.css or styles/base.css. Use <h2> ` +
      `and below — the page owns the <h1>. You may change only: ${owns.join(", ")}.`
    );
  }
  if (owns.some((o) => o.endsWith(".html"))) {
    const file = owns.find((o) => o.endsWith(".html"))!;
    return (
      `You own ${file}. Build the page shell — header, navigation, footer and its single <h1> — around ` +
      `the section slots. Leave every element carrying data-design-node inside <main> exactly where it is; ` +
      `integration fills them. Remove data-placeholder from <body> once the page is built. ` +
      `You may change only: ${owns.join(", ")}.`
    );
  }
  return `You may change only: ${owns.join(", ")}.`;
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
      // Exact stem, not a substring: a component called "a" is not realised by package.json.
      if (entry.name.replace(/\.[^.]+$/, "") === designNodeId) return childRel;
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
