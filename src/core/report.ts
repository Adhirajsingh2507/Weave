// Traceability report: requirement → design → code → criteria → evidence → commit → approval.
//
// Canonical §65 calls this potentially the strongest differentiator of the platform. It is the
// answer to "what was built, why, and how do you know it works" — assembled from persisted
// state, never from the model's memory.

import { isVerdict, latestStatus, runMetrics } from "./metrics.js";
import type { CriterionStatus, RunMetrics } from "./metrics.js";
import type { GraphStore } from "./store/graph-store.js";

export interface CriterionReport {
  id: string;
  rule: string;
  runner: string;
  judged: boolean;
  source: string;
  severity?: string;
  evidence: Array<{ ok: boolean; status: string; kind: string; detail: string; artifactPath?: string }>;
  /** not-applicable and unavailable are distinct from passing, and are never counted as one. */
  status: CriterionStatus;
}

export interface RequirementReport {
  id: string;
  title: string;
  source: string;
  designNodeId?: string;
  codeFiles: string[];
  commits: string[];
  criteria: CriterionReport[];
  covered: boolean;
}

export interface RunReport {
  runId: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  requirements: RequirementReport[];
  metrics: RunMetrics;
  gates: Array<{ id: string; kind: string; status: string; notes?: string }>;
  orphanCode: string[];
  /**
   * Impl wall-clock against the sum of node durations — what parallelism bought, measured
   * from the attempts table rather than claimed. Absent before any impl node ran.
   */
  timing?: { wallMs: number; serialMs: number };
  /** Every failed check, by node, deduplicated — the repair trail. */
  nodeFailures: Array<{ nodeId: string; detail: string }>;
  /** The execution graph as it ended: what ran, in what order, depending on what. */
  nodes: Array<{ id: string; kind: string; status: string; dependsOn: string[]; commit?: string; attempts?: number }>;
  /** Every attempt with its timing — the failure/repair timeline and the parallelism, drawn. */
  attempts: Array<{ nodeId: string; attempt: number; startedAt: string; endedAt?: string; ok: boolean }>;
  /** How each node was confined and what it touched: sandbox, network and risk records. */
  boundaries: Array<{ nodeId: string; kind: string; ok: boolean; detail: string }>;
}

export function buildReport(store: GraphStore, runId: string): RunReport {
  const run = store.getRun(runId);
  if (!run) throw new Error(`run not found: ${runId}`);

  const evidence = store.evidenceFor({ runId });
  const byCriterion = new Map<string, typeof evidence>();
  for (const e of evidence) {
    if (!e.criterion_id) continue;
    const list = byCriterion.get(e.criterion_id) ?? [];
    list.push(e);
    byCriterion.set(e.criterion_id, list);
  }

  const execNodes = store.getExecGraph(runId);
  const requirements: RequirementReport[] = [];

  for (const req of store.query({ kind: "requirement" })) {
    const edges = store.neighbors(req.id);
    const designNodeId = edges.find((e) => e.kind === "covers" && e.from === req.id)?.to;

    // design → code, written by construction when a node commits.
    const codeFiles = designNodeId
      ? store
          .neighbors(designNodeId)
          .filter((e) => e.kind === "realized_by" && e.from === designNodeId)
          .map((e) => e.to)
      : [];

    const commits = execNodes
      .filter((n) => n.designNodeId === designNodeId && n.commit)
      .map((n) => n.commit!);

    const criteria: CriterionReport[] = edges
      .filter((e) => e.kind === "verifies" && e.to === req.id)
      .map((e) => store.getNode(e.from))
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
      .map((node) => {
        const rows = byCriterion.get(node.id) ?? [];
        const runner = String(node.attrs?.["runner"] ?? "pending");
        return {
          id: node.id,
          rule: String(node.attrs?.["rule"] ?? node.name),
          runner,
          judged: Boolean(node.attrs?.["judged"]),
          source: String(node.attrs?.["source"] ?? "unknown"),
          ...(node.attrs?.["severity"] ? { severity: String(node.attrs["severity"]) } : {}),
          evidence: rows.map((r) => ({
            ok: r.ok === 1,
            status: r.status ?? (r.ok === 1 ? "pass" : "fail"),
            kind: r.kind,
            detail: r.detail,
            ...(r.artifact_path ? { artifactPath: r.artifact_path } : {}),
          })),
          // Status is the latest verdict, not every verdict ever recorded. A criterion that
          // failed twice and then passed is passed — the earlier rows are the repair trail.
          status: latestStatus(rows),
        } satisfies CriterionReport;
      });

    requirements.push({
      id: req.id,
      title: req.name,
      source: String(req.attrs?.["source"] ?? "unknown"),
      ...(designNodeId ? { designNodeId } : {}),
      codeFiles,
      commits,
      criteria,
      // Only an actual verdict counts as covered. not-applicable, unavailable and human are
      // resolutions, but they are not evidence that the requirement holds.
      covered: criteria.some((c) => isVerdict(c.status)),
    });
  }

  return {
    runId,
    status: run.status,
    startedAt: run.startedAt,
    ...(run.endedAt ? { endedAt: run.endedAt } : {}),
    requirements,
    metrics: runMetrics(store, runId),
    gates: store.gatesForRun(runId).map((g) => ({
      id: g.id,
      kind: g.kind,
      status: g.status,
      ...(g.notes ? { notes: g.notes } : {}),
    })),
    orphanCode: store.gaps().orphanCode,
    ...timingOf(store, runId),
    nodes: execNodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      status: n.status,
      dependsOn: n.dependsOn ?? [],
      ...(n.commit ? { commit: n.commit } : {}),
      ...(n.attempts !== undefined ? { attempts: n.attempts } : {}),
    })),
    attempts: store.attemptsFor(runId).map((a) => ({
      nodeId: a.node_id,
      attempt: a.attempt,
      startedAt: a.started_at,
      ...(a.ended_at ? { endedAt: a.ended_at } : {}),
      ok: a.exec_ok === 1 && a.verify_ok === 1,
    })),
    boundaries: [
      ...new Map(
        evidence
          .filter((e) => ["sandbox", "network", "risk"].includes(e.kind) && e.node_id)
          .map((e) => [`${e.node_id}\u0000${e.kind}\u0000${e.detail}`, { nodeId: e.node_id!, kind: e.kind, ok: e.ok === 1, detail: e.detail }]),
      ).values(),
    ],
    nodeFailures: [
      ...new Map(
        evidence
          // Every real failure, whatever it proved or failed to prove: a check tied to a criterion
          // (an <h1> in a fragment, a policy item) is as much the repair trail as an ownership
          // breach. not-applicable, unavailable and human are not failures.
          .filter((e) => e.ok === 0 && (e.status ?? "fail") === "fail" && e.node_id)
          .map((e) => [`${e.node_id}\u0000${e.detail}`, { nodeId: e.node_id!, detail: e.detail }]),
      ).values(),
    ],
  };
}

function timingOf(store: GraphStore, runId: string): { timing?: RunReport["timing"] } {
  const impl = new Set(store.getExecGraph(runId).filter((n) => n.kind === "impl").map((n) => n.id));
  const spans = store
    .attemptsFor(runId)
    .filter((a) => impl.has(a.node_id) && a.ended_at)
    .map((a) => [Date.parse(a.started_at), Date.parse(a.ended_at!)] as const);
  if (!spans.length) return {};
  const wallMs = Math.max(...spans.map(([, end]) => end)) - Math.min(...spans.map(([start]) => start));
  const serialMs = spans.reduce((sum, [start, end]) => sum + (end - start), 0);
  return { timing: { wallMs, serialMs } };
}

/** Distinct symbols, because "not applicable" is not a failure and must not read as one. */
const SYMBOL: Record<CriterionReport["status"], string> = {
  passed: "✓",
  failed: "✗",
  "not-applicable": "–",
  unavailable: "?",
  human: "☐",
  pending: "·",
};

const pct = (v: number | null): string => (v === null ? "n/a" : `${Math.round(v * 100)}%`);

/** Human-readable rendering. `--json` gives the structure above for tooling. */
export function renderReport(report: RunReport): string {
  const out: string[] = [];
  const m = report.metrics;

  out.push(`Run ${report.runId} — ${report.status}`);
  out.push("");
  out.push("Metrics");
  out.push(`  autonomous run            ${m.autonomous ? "yes" : "no"}`);
  out.push(`  first-pass verification   ${pct(m.firstPassVerificationRate)}`);
  out.push(`  repair success            ${pct(m.repairSuccessRate)}`);
  out.push(`  human intervention        ${pct(m.humanInterventionRate)} (${m.unplannedGates} unplanned of ${m.totalGates} gates)`);
  out.push(`  evidence coverage         ${pct(m.evidenceCoverage)}`);
  out.push(`  criteria awaiting runners ${m.pendingCriteria}`);
  if (report.timing) {
    const { wallMs, serialMs } = report.timing;
    const speedup = wallMs > 0 ? ` (${(serialMs / wallMs).toFixed(1)}× from parallelism)` : "";
    out.push(`  impl wall-clock           ${wallMs}ms vs ${serialMs}ms run one at a time${speedup}`);
  }
  out.push("");

  const covered = report.requirements.filter((r) => r.covered).length;
  out.push(`Requirements (${covered}/${report.requirements.length} with evidence)`);
  for (const req of report.requirements) {
    const passed = req.criteria.filter((c) => c.status === "passed").length;
    const failed = req.criteria.filter((c) => c.status === "failed").length;
    const pending = req.criteria.filter((c) => c.status === "pending").length;
    const mark = failed > 0 ? "✗" : passed > 0 ? "✓" : "·";
    out.push(`  ${mark} ${req.id} — ${req.title}`);
    if (req.designNodeId) out.push(`      design:   ${req.designNodeId}`);
    if (req.codeFiles.length) out.push(`      code:     ${req.codeFiles.join(", ")}`);
    if (req.commits.length) out.push(`      commit:   ${req.commits.map((c) => c.slice(0, 7)).join(", ")}`);
    out.push(`      criteria: ${passed} passed, ${failed} failed, ${pending} awaiting a runner`);
    for (const c of req.criteria.filter((x) => x.status !== "pending")) {
      out.push(`        ${SYMBOL[c.status]} ${c.id}: ${c.evidence.at(-1)?.detail ?? c.rule}`);
    }
  }

  const all = report.requirements.flatMap((r) => r.criteria);
  const tally = (s: CriterionReport["status"]): number => all.filter((c) => c.status === s).length;
  out.push("");
  out.push(
    `Criteria: ${tally("passed")} passed, ${tally("failed")} failed, ${tally("not-applicable")} not applicable, ` +
      `${tally("unavailable")} no runner yet, ${tally("human")} need a person, ${tally("pending")} not yet evaluated`,
  );

  const humans = all.filter((c) => c.status === "human");
  if (humans.length) {
    out.push("");
    out.push("Outstanding — nobody can automate these:");
    for (const c of humans) out.push(`  ☐ ${c.id} — ${c.rule}`);
  }

  const failed = all.filter((c) => c.status === "failed");
  if (failed.length) {
    out.push("");
    out.push("Failing:");
    for (const c of failed) {
      out.push(`  ✗ ${c.id}${c.severity ? ` [${c.severity}]` : ""} — ${c.evidence.at(-1)?.detail ?? c.rule}`);
    }
  }

  if (report.nodeFailures.length) {
    out.push("");
    out.push("Failed node checks (the repair trail):");
    for (const f of report.nodeFailures) out.push(`  ✗ ${f.nodeId} — ${f.detail}`);
  }

  if (report.gates.length) {
    out.push("");
    out.push("Gates");
    for (const g of report.gates) {
      out.push(`  ${g.status.padEnd(8)} ${g.kind}${g.notes ? ` — "${g.notes}"` : ""}`);
    }
  }

  if (report.orphanCode.length) {
    out.push("");
    out.push(`Orphan code (no design mapping): ${report.orphanCode.length}`);
  }

  return out.join("\n");
}
