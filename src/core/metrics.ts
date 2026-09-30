// The five metrics from the V2 brief, computed from persisted state rather than logs.
//
// Definitions are recorded here because a metric without a definition is a vanity number.
// The one judgement call: design-approval and pre-release are **mandatory control points you
// chose to have**, not rescues, so they do not count as human intervention. A run that opens
// only those two is fully autonomous.

import type { GraphStore } from "./store/graph-store.js";
import type { GateKind } from "./types.js";

/** Gates that are part of the design, not a sign something went wrong. */
export const MANDATORY_GATES: GateKind[] = ["design-approval", "pre-release"];

export interface RunMetrics {
  runId: string;
  status: string;
  implNodes: number;
  /** Impl nodes that passed on their first attempt ÷ impl nodes that ran. */
  firstPassVerificationRate: number | null;
  /** Nodes that failed at least once and later completed ÷ nodes that failed at least once. */
  repairSuccessRate: number | null;
  /** Gates beyond the mandatory two ÷ impl nodes. */
  humanInterventionRate: number | null;
  /** True when the run reached done opening no gates beyond the mandatory two. */
  autonomous: boolean;
  /** Requirements with a passed or failed verdict on some criterion ÷ requirements. */
  evidenceCoverage: number | null;
  /** Criteria with no runner yet — the V2.2 worklist, reported rather than hidden. */
  pendingCriteria: number;
  unplannedGates: number;
  totalGates: number;
}

export type CriterionStatus = "passed" | "failed" | "pending" | "not-applicable" | "unavailable" | "human";

/** The latest verdict decides: a criterion that failed twice and then passed is passed. */
export function latestStatus(rows: Array<{ ok: number; status?: string | null }>): CriterionStatus {
  if (!rows.length) return "pending";
  const last = rows[rows.length - 1]!;
  switch (last.status ?? (last.ok === 1 ? "pass" : "fail")) {
    case "pass":
      return "passed";
    case "fail":
      return "failed";
    case "not-applicable":
      return "not-applicable";
    case "unavailable":
      return "unavailable";
    case "human":
      return "human";
    default:
      return "pending";
  }
}

export const isVerdict = (s: CriterionStatus | undefined): boolean => s === "passed" || s === "failed";

/** Latest status per criterion for a run, from its evidence rows in time order. */
export function criterionStatuses(store: GraphStore, runId: string): Map<string, CriterionStatus> {
  const byCriterion = new Map<string, Array<{ ok: number; status?: string | null }>>();
  for (const e of store.evidenceFor({ runId })) {
    if (!e.criterion_id) continue;
    const list = byCriterion.get(e.criterion_id) ?? [];
    list.push(e);
    byCriterion.set(e.criterion_id, list);
  }
  return new Map([...byCriterion].map(([id, rows]) => [id, latestStatus(rows)]));
}

const ratio = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : Number((numerator / denominator).toFixed(4));

export function runMetrics(store: GraphStore, runId: string): RunMetrics {
  const run = store.getRun(runId);
  const execNodes = store.getExecGraph(runId);
  const impls = execNodes.filter((n) => n.kind === "impl");
  const attempts = store.attemptsFor(runId);
  const gates = store.gatesForRun(runId);

  // Attempt rows are authoritative; fall back to the node's own counter for runs recorded
  // before the attempts table existed.
  const attemptsByNode = new Map<string, number>();
  for (const a of attempts) {
    attemptsByNode.set(a.node_id, Math.max(attemptsByNode.get(a.node_id) ?? 0, a.attempt));
  }
  const attemptCount = (nodeId: string, fallback?: number): number | undefined =>
    attemptsByNode.get(nodeId) ?? fallback;

  const ran = impls.filter((n) => attemptCount(n.id, n.attempts) !== undefined);
  const firstPass = ran.filter((n) => attemptCount(n.id, n.attempts) === 1);
  const failedOnce = ran.filter((n) => (attemptCount(n.id, n.attempts) ?? 1) > 1);
  const recovered = failedOnce.filter((n) => n.status === "complete");

  const unplanned = gates.filter((g) => !MANDATORY_GATES.includes(g.kind));

  const requirements = store.query({ kind: "requirement" });
  const criteria = store.query({ kind: "criterion" });
  const statuses = criterionStatuses(store, runId);

  // A requirement is covered when a criterion that verifies it has a verdict — passed or failed.
  // not-applicable, unavailable and human are resolutions, not evidence that it holds. The
  // report uses the same function, so the metric and the list can no longer disagree.
  let covered = 0;
  for (const req of requirements) {
    const verifying = store.neighbors(req.id).filter((e) => e.kind === "verifies" && e.to === req.id);
    if (verifying.some((e) => isVerdict(statuses.get(e.from)))) covered++;
  }

  const pending = criteria.filter((c) => (c.attrs?.["runner"] ?? "") === "pending").length;

  return {
    runId,
    status: run?.status ?? "unknown",
    implNodes: impls.length,
    firstPassVerificationRate: ratio(firstPass.length, ran.length),
    repairSuccessRate: ratio(recovered.length, failedOnce.length),
    humanInterventionRate: ratio(unplanned.length, impls.length),
    autonomous: run?.status === "done" && unplanned.length === 0,
    evidenceCoverage: ratio(covered, requirements.length),
    pendingCriteria: pending,
    unplannedGates: unplanned.length,
    totalGates: gates.length,
  };
}

export interface ProjectMetrics {
  runs: number;
  /** Runs reaching done with no unplanned gates ÷ all finished runs. */
  autonomousCompletionRate: number | null;
  perRun: RunMetrics[];
}

export function projectMetrics(store: GraphStore): ProjectMetrics {
  const runs = store.allRuns();
  const finished = runs.filter((r) => ["done", "failed", "cancelled"].includes(r.status));
  const perRun = runs.map((r) => runMetrics(store, r.runId));
  const autonomous = perRun.filter((m) => m.autonomous).length;
  return {
    runs: runs.length,
    autonomousCompletionRate: ratio(autonomous, finished.length),
    perRun,
  };
}
