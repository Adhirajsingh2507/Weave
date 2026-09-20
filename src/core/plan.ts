// Phase 6 — execution-graph generation (decision #26): fixed skeleton + dynamic fan-out.
// One impl node per unrealized design node; QA nodes follow. No free synthesis.

import type { ExecNode } from "./graph/types.js";

/** Build the execution graph for a run from the unrealized-design work list. */
export function buildExecGraph(unrealizedDesign: string[]): ExecNode[] {
  const nodes: ExecNode[] = [];
  // Pre-impl skeleton stages are complete by the time we plan (intake/analysis done).
  for (const kind of ["intake", "plan", "design-analysis", "architecture"] as const) {
    nodes.push({ id: kind, kind, status: "complete" });
  }
  // Fan-out: one implementation node per unrealized design node.
  for (const d of unrealizedDesign) {
    nodes.push({ id: `impl:${d}`, kind: "impl", designNodeId: d, status: "pending" });
  }
  // Post-impl QA stages.
  for (const kind of ["integration", "code-qa", "browser-qa", "visual-qa"] as const) {
    nodes.push({ id: kind, kind, status: "pending" });
  }
  // Final release (deploy), driven by the pre-release gate; skipped if no deployer.
  nodes.push({ id: "release", kind: "release", status: "pending" });
  return nodes;
}

/** The impl fan-out nodes, in order. */
export function implNodes(nodes: ExecNode[]): ExecNode[] {
  return nodes.filter((n) => n.kind === "impl");
}
