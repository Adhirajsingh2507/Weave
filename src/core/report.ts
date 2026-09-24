// Traceability report: requirement → design → code → criteria → evidence → commit → approval.
//
// Canonical §65 calls this potentially the strongest differentiator of the platform. It is the
// answer to "what was built, why, and how do you know it works" — assembled from persisted
// state, never from the model's memory.

import { runMetrics } from "./metrics.js";
import type { RunMetrics } from "./metrics.js";
import type { GraphStore } from "./store/graph-store.js";

export interface CriterionReport {
  id: string;
  rule: string;
  runner: string;
  judged: boolean;
  source: string;
  evidence: Array<{ ok: boolean; kind: string; detail: string; artifactPath?: string }>;
  status: "passed" | "failed" | "pending";
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
          evidence: rows.map((r) => ({
            ok: r.ok === 1,
            kind: r.kind,
            detail: r.detail,
            ...(r.artifact_path ? { artifactPath: r.artifact_path } : {}),
          })),
          // Status is the latest verdict, not every verdict ever recorded. A criterion that
          // failed twice and then passed is passed — the earlier rows are the repair trail.
          status:
            rows.length === 0 ? "pending" : rows[rows.length - 1]!.ok === 1 ? "passed" : "failed",
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
      covered: criteria.some((c) => c.status !== "pending"),
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
  };
}

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
      const detail = c.evidence.map((e) => e.detail).join("; ");
      out.push(`        ${c.status === "passed" ? "✓" : "✗"} ${c.id}: ${detail}`);
    }
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
