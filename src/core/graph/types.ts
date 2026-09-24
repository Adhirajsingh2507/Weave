// Knowledge graph + execution graph node/edge kinds (decisions #12, #26, #36).
// One store (state.db) holds both graph kinds as distinct node/edge kinds.

import type { NodeId } from "../types.js";

/** Knowledge-graph node layers. Design nodes are projected from the canonical IR. */
export type KgNodeKind = "design" | "code" | "asset" | "criterion" | "package";

/** Fixed execution-graph skeleton stages; `impl` is the fan-out stage (one per unrealized design node). */
export type ExecNodeKind =
  | "intake"
  | "plan"
  | "design-analysis"
  | "architecture"
  | "scaffold"
  | "impl"
  | "integration"
  | "code-qa"
  | "browser-qa"
  | "visual-qa"
  | "gate"
  | "release";

export type MappingProvenance = "by_construction" | "inferred" | "human_confirmed";

export interface KgNode {
  id: NodeId;
  kind: KgNodeKind;
  name: string;
  attrs?: Record<string, unknown>;
}

export type EdgeKind =
  | "realizes" // code -> design
  | "realized_by" // design -> code
  | "depends_on" // code/package dependency (incl. cross-package)
  | "belongs_to"; // node -> page/package

export interface Edge {
  from: NodeId;
  to: NodeId;
  kind: EdgeKind;
  /** Present on mapping edges (realizes/realized_by). */
  confidence?: number;
  provenance?: MappingProvenance;
  ts?: string;
}

/** Node-level state machine (canonical §98) + cancellation. */
export type ExecNodeStatus =
  | "pending"
  | "ready"
  | "running"
  | "verifying"
  | "complete"
  | "skipped"
  | "retry"
  | "blocked"
  | "escalated"
  | "failed"
  | "cancelled";

export interface ExecNode {
  id: NodeId;
  kind: ExecNodeKind;
  /** Set for fan-out impl nodes: the unrealized design node this node realizes. */
  designNodeId?: NodeId;
  status: ExecNodeStatus;
  /** Git commit sha that captured this node's work, once passed. */
  commit?: string;
  /** Evidence refs recorded by the node loop, kept for passing nodes too. */
  evidence?: string[];
  /** How many attempts the node took, so first-pass rate is computable. */
  attempts?: number;
}
