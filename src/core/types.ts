// Shared primitives for the headless core. Erasable TS only (runs under Node type-stripping).

export type RunId = string;
export type GateId = string;
export type NodeId = string;

export type ProjectMode = "new" | "existing";

/** Run-level status (one execution pass of the graph). */
export type RunStatus =
  | "idle"
  | "running"
  | "gated"
  | "done"
  | "cancelled"
  | "failed";

/** Project-level state machine (canonical §97). v1 exercises draft→…→awaiting-approval; monitoring/maintenance are post-deploy (out of v1). */
export type ProjectStatus =
  | "draft"
  | "planning"
  | "executing"
  | "verifying"
  | "awaiting-approval"
  | "released"
  | "monitoring"
  | "maintenance"
  | "archived";

/** v1 default gate set (decisions #28). */
export type GateKind =
  | "design-approval"
  | "low-confidence"
  | "risky-op"
  /** A blocking policy-pack item failed on the built site; the human decides. */
  | "policy"
  | "pre-release";

export type GateDecision = "approve" | "reject";
export type GateStatus = "open" | "approved" | "rejected";

export interface Gate {
  id: GateId;
  runId: RunId;
  kind: GateKind;
  status: GateStatus;
  nodeId?: NodeId;
  summary: string;
  evidenceRefs: string[];
  openedAt: string;
  /** What the human said when resolving. Feeds the next attempt's context pack. */
  notes?: string;
  resolvedAt?: string;
}

export interface RunHandle {
  runId: RunId;
  status: RunStatus;
}

/** Persisted run record (survives process death — invariant §109). */
export interface RunRecord {
  runId: RunId;
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  /** Current node/phase the run is at (resume point). */
  cursor?: NodeId;
  /** Steps / cost units consumed; ceiling lives in policies (decision #27). */
  budgetUsed: number;
  /** Branch this run's work lands on. Persisted so another process can finish the run. */
  workingBranch?: string;
  /** Branch the repo was on when the run started, restored by finish(). */
  baseBranch?: string;
  /** Whether the user's dirty tree was auto-stashed and still needs popping. */
  stashed?: boolean;
}
